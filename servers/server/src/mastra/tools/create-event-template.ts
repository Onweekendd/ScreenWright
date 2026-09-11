import fsp from "node:fs/promises";
import path from "node:path";

import { createTool } from "@mastra/core/tools";
import { type Action, type ComponentType } from "@screenwright/types";
import { type ConditionLogicTypeEnum, EventTypeEnum } from "@screenwright/types";
import { EventSchema } from "@screenwright/types/schemas";
import { buildActionFromTemplate, templateConditions, templateEvents } from "@screenwright/types/templates";
import z from "zod";

import { getAgentWorkspacePath } from "@/agent-resources/workspace-path";

import { applyComponentEdit } from "../services/bi-data-sync/component-edit";
import { AgentMode } from "../types/bi-chat";
import { SuspendDefs, SuspendType } from "../types/suspend";
import { diffChange } from "./change-report";
import { ActionInputSchema } from "./create-action-template";
import { ConditionInputSchema } from "./create-condition-template";
import {
  extractIdFromIdName,
  findComponentFileInWorkspace,
  isAmbiguousMatch,
  validateComponentContent
} from "./file/utils";
import { resolveComponentScope } from "./resolve-component-scope";

const WORKSPACE_BASE = getAgentWorkspacePath();

const relativeToWorkspace = (abs: string): string => path.relative(WORKSPACE_BASE, abs).replace(/\\/gu, "/");

/**
 * 解析 insertTo 路径：
 *   格式：{...省略前缀...}/{componentId}/events/{index}
 *   最后两段固定为 events（字段名）和 index（下标）
 *   倒数第三段为 componentId
 *   其余为 workspace 内的屏幕组件目录前缀
 */
/**
 * 解析 `insertTo` 路径，交出**屏作用域**而不是拼好的绝对目录。
 *
 * 之前这里返回 `path.resolve(WORKSPACE_BASE, ...prefixParts)`，再交给一个「递归找到第一个就返回」
 * 的私有 helper。前缀省略时那个目录就是工作区根，于是多块屏共存、组件 id 又相同时，**永远命中
 * 目录字典序第一块屏**——实测 b6/b7 两个 case 把事件插进了 b5 的屏（`screen_9001_1` 上堆了三个
 * 本不属于它的事件），agent 发现自己屏上 events 仍为空，只好退回去用 edit_files 手写补救。
 *
 * 这和 `ungroup` / `group` / `move` / `add_panel_state` 当初的问题是同一个：裸 id 不足以定位组件。
 * 那批已经改用共享的 {@link findComponentFileInWorkspace}（多屏命中时报歧义而不是取第一个），
 * 本工具是漏网的一个，这里补齐。
 */
function parseInsertToPath(
  insertPath: string
): { screenKey: string | null; componentId: number; field: string; insertIndex: number } | null {
  const parts = insertPath.replace(/\\/g, "/").split("/").filter(Boolean);
  if (parts.length < 3) {
    return null;
  }

  const rawIndex = parts[parts.length - 1];
  const insertIndex = parseInt(rawIndex, 10);
  if (isNaN(insertIndex) || String(insertIndex) !== rawIndex) {
    return null;
  }

  const field = parts[parts.length - 2];

  // 路径段格式为 `{id}_{name}`（旧数据可能是纯 `{id}`），用 extractIdFromIdName 取首段数字 id
  const rawComponentId = parts[parts.length - 3];
  const componentId = extractIdFromIdName(rawComponentId);
  if (componentId === null) {
    return null;
  }

  // 前缀里找 `screen_{id}_{version}` 那一段；没有就是裸 id，交给下游报歧义
  const prefixParts = parts.slice(0, parts.length - 3);
  const screenSeg = prefixParts.find((seg) => /^screen_/u.test(seg));
  const screenKey = screenSeg ? screenSeg.replace(/^screen_/u, "") : null;

  return { screenKey, componentId, field, insertIndex };
}

/** 事件插入位置：workspace 相对路径 */
const InsertToPathSchema = z
  .string()
  .describe(
    "插入位置路径。**推荐带屏目录的完整形式**：`screen_{screenId}_{versionCode}/component/{componentId}/events/{index}`，" +
      '例如 "screen_9002_1/component/4182/events/0"。' +
      "从后往前依次是：插入下标（0-based）/ 固定的 events / 目标组件 id / 屏目录前缀。" +
      '屏目录可以不写（如 "4182/events/0"），但那样只能靠 id 全工作区搜——' +
      "多块屏上存在同一个组件 id 时会直接报错要求你补上屏目录，而不是猜一块屏。"
  );

/** 导出供测试锁 insertTo 的两种入参形态 */
export const InputSchema = z.object({
  eventName: z.string().optional().describe("事件名称，不超过5个字符，为空则为 `事件`"),
  triggerType: z.string().optional().describe("触发器类型"),
  conditions: z.array(ConditionInputSchema).optional().describe("条件列表，为空则不添加条件"),
  // 模型在没有条件时常传 "null"/"none"/null 来表达「无」（连续三轮 eval 都撞上校验失败再重试）。
  // 这几个明确表示「无」的值在校验前折成 undefined；其余仍严格校验——尤其 "and"，
  // 下面 description 专门警告过它名字是与、行为是或，不能让它悄悄溜过去
  conditionType: z
    .preprocess(
      (value) => (value === null || value === "null" || value === "none" || value === "" ? undefined : value),
      z.enum(["all", "one"]).optional()
    )
    .describe(
      "多个条件之间的关系，只在 conditions 有两条及以上时才有意义；**没有条件时省略此字段**。" +
        '`"all"` = 全部满足才触发（与，默认值）；`"one"` = 任一满足即触发（或）。' +
        "用户说「同时」「并且」「都要」用 all；说「或者」「任一」「其中之一」用 one。" +
        '**注意这里不接受 `"and"`**：类型里虽然有 ConditionLogicTypeEnum.And，但求值处只把 ' +
        '`"all"` 当「与」，`"and"` 会落进 else 分支变成「或」——名字是与、行为是或，' +
        "所以本工具不提供它，想要「或」请写 one。"
    ),
  actions: z.array(ActionInputSchema).optional().describe("行为列表，为空则不添加行为"),
  // 直接收路径字符串；`{ path }` 对象形态仅为兼容旧调用而保留。
  // 只有一个字段的包装层在实测里是纯摩擦：b6/b7 两个 case 100% 先传成字符串、吃一次
  // 校验失败再重传对象，每次白烧一轮。工具描述通篇讲的是「路径」，参数却要求包一层，
  // 模型按描述的字面意思传是合理的——该改的是 schema 不是模型。
  insertTo: z
    .union([InsertToPathSchema, z.object({ path: InsertToPathSchema })])
    .optional()
    .describe("指定将事件插入哪个组件的哪个字段的哪个位置，**直接传路径字符串即可**，省略时只返回事件模板")
});

/** 把 `insertTo` 的两种形态归一成路径字符串 */
function normalizeInsertTo(insertTo: string | { path: string } | undefined): string | undefined {
  if (insertTo === undefined) {
    return undefined;
  }
  return typeof insertTo === "string" ? insertTo : insertTo.path;
}

export const createEventTemplate = createTool({
  id: "createEventTemplate",
  description:
    "生成一个默认的交互事件模板并返回，支持同时添加条件与行为。提供 insertTo 时，将事件插入指定组件的 events 列表并推送前端；否则仅返回模板，不执行任何组件写入操作",
  inputSchema: InputSchema,

  suspendSchema: z.union([
    SuspendDefs[SuspendType.PushComponentUpdate].suspend,
    SuspendDefs[SuspendType.AskApprovalPushComponentUpdate].suspend
  ]),

  resumeSchema: z.union([
    SuspendDefs[SuspendType.AskApprovalPushComponentUpdate].resume,
    SuspendDefs[SuspendType.PushComponentUpdate].resume
  ]),

  execute: async (input, context) => {
    const { eventName, triggerType, conditions, conditionType, actions, insertTo } = input as unknown as z.infer<
      typeof InputSchema
    >;
    const insertToPath = normalizeInsertTo(insertTo);

    const mode = context?.requestContext?.get("mode") as AgentMode | undefined;
    const { resumeData, suspend } = context?.agent ?? {};

    // 从 push_component_update / ask_approval_push_component_update suspend 恢复
    if (resumeData && "componentUpdated" in resumeData) {
      // 重新构建 eventObj 返回给 agent（事件构建无副作用，可安全重跑）
      const parsedInsertTo = insertToPath ? parseInsertToPath(insertToPath) : null;
      const sourceComponentId = parsedInsertTo?.componentId;
      const builtActions = (actions ?? []).map((a) => {
        const targets = a.componentId ?? [];
        const scope =
          sourceComponentId !== undefined
            ? resolveComponentScope(sourceComponentId, targets, undefined, parsedInsertTo?.screenKey)
            : undefined;
        const built = buildActionFromTemplate({ componentId: targets, actionType: a.actionType, scope });
        if ("error" in built) {
          return built;
        }
        const action = built as Partial<Action>;
        return a.config
          ? {
              ...action,
              ...a.config,
              id: action.id,
              name: action.name,
              action: action.action,
              component: action.component,
              componentScope: action.componentScope
            }
          : action;
      });
      const builtConditions = (conditions ?? []).map((c) => {
        const template = templateConditions();
        if (c.type != null) {
          template.type = c.type;
        }
        if (c.field != null) {
          template.field = c.field;
        }
        if (c.compare != null) {
          template.compare = c.compare;
        }
        if (c.expected != null) {
          template.expected = c.expected;
        }
        if (c.code != null) {
          template.code = c.code;
        }
        return template;
      });
      const templateEvent = templateEvents({
        trigger: (triggerType as EventTypeEnum | undefined) ?? EventTypeEnum.DataChange,
        name: eventName || "事件",
        ...(conditionType ? { conditionType: conditionType as ConditionLogicTypeEnum } : {})
      });
      const {
        actions: _a,
        conditions: _c,
        ...rest
      } = templateEvent as typeof templateEvent & {
        conditions: unknown[];
      };
      return EventSchema.parse({ ...rest, conditions: builtConditions, actions: builtActions });
    }

    const templateEvent = templateEvents({
      trigger: (triggerType as EventTypeEnum | undefined) ?? EventTypeEnum.DataChange,
      name: eventName || "事件",
      // 不传就保留 templateEvents 的默认值 All，别用 undefined 把它覆盖掉
      ...(conditionType ? { conditionType: conditionType as ConditionLogicTypeEnum } : {})
    });

    const builtConditions = (conditions ?? []).map((c) => {
      const template = templateConditions();
      if (c.type != null) {
        template.type = c.type;
      }
      if (c.field != null) {
        template.field = c.field;
      }
      if (c.compare != null) {
        template.compare = c.compare;
      }
      if (c.expected != null) {
        template.expected = c.expected;
      }
      if (c.code != null) {
        template.code = c.code;
      }
      return template;
    });

    // 仅当 insertTo 存在时能解析出源组件 ID，从而由代码判定 componentScope；
    // 否则（纯模板预览模式）保留 buildActionFromTemplate 的默认 scope。
    const parsedInsertTo = insertToPath ? parseInsertToPath(insertToPath) : null;
    const sourceComponentId = parsedInsertTo?.componentId;

    const builtActions = (actions ?? []).map((a) => {
      const targets = a.componentId ?? [];
      const scope =
        sourceComponentId !== undefined
          ? resolveComponentScope(sourceComponentId, targets, undefined, parsedInsertTo?.screenKey)
          : undefined;
      const built = buildActionFromTemplate({ componentId: targets, actionType: a.actionType, scope });
      if ("error" in built) {
        return built;
      }
      const action = built as Partial<Action>;
      return a.config ? { ...action, ...a.config } : action;
    });

    const {
      actions: _actions,
      conditions: _conditions,
      ...rest
    } = templateEvent as typeof templateEvent & { conditions: unknown[] };

    const eventObj = EventSchema.parse({ ...rest, conditions: builtConditions, actions: builtActions });

    if (!insertToPath) {
      return eventObj;
    }

    // ── insertTo：解析路径，找到组件文件，插入事件 ────────────────────────────
    if (!parsedInsertTo) {
      throw new Error(
        `insertTo 路径格式无效: "${insertToPath}"。` +
          `期望格式：screen_{screenId}_{versionCode}/component/{componentId}/events/{index}，` +
          `例如 "screen_9002_1/component/4182/events/0"`
      );
    }

    const { screenKey, componentId, field, insertIndex } = parsedInsertTo;

    const scopedRef = screenKey === null ? String(componentId) : `${screenKey}/${componentId}`;
    const found = await findComponentFileInWorkspace(WORKSPACE_BASE, scopedRef);
    if (!found) {
      throw new Error(`insertTo: 找不到组件 ${componentId}${screenKey ? `（在 screen_${screenKey} 下）` : ""}`);
    }
    if (isAmbiguousMatch(found)) {
      throw new Error(
        `insertTo: 组件 ${componentId} 在多块屏上都存在（${found.ambiguous.join("、")}），` +
          `裸 id 无法定位。请在 path 前面带上屏目录，例如 "screen_${(found.ambiguous[0] ?? "").split("/")[0].replace(/^screen_/u, "") || "{screenId}_1"}/component/${componentId}/events/${insertIndex}"`
      );
    }
    const componentFilePath = found.file;

    let componentRaw: string;
    try {
      componentRaw = await fsp.readFile(componentFilePath, "utf8");
    } catch {
      throw new Error(`insertTo: 读取组件文件失败: ${componentFilePath}`);
    }

    let componentData: Record<string, unknown>;
    try {
      componentData = JSON.parse(componentRaw);
    } catch {
      throw new Error(`insertTo: 组件文件不是合法 JSON: ${componentFilePath}`);
    }

    if (!Array.isArray(componentData[field])) {
      componentData[field] = [];
    }
    (componentData[field] as unknown[]).splice(insertIndex, 0, eventObj);

    const newContent = JSON.stringify(componentData, null, 2);
    const validation = validateComponentContent(newContent);
    if (!validation.ok) {
      throw new Error(
        `insertTo 组件校验失败: ${validation.message}${
          validation.validationErrors ? "\n" + validation.validationErrors.join("\n") : ""
        }`
      );
    }

    // 事件这一条比别的工具特殊：不带 insertTo 时它是纯模板生成器（上面已 return），
    // 只有走到这里才真写盘，所以 change 只在这条路上附加。附在返回的事件对象上而不是换成
    // { event, change } 包一层，是因为现有契约就是「直接拿到事件对象」，换形状会打断调用方。
    // 与 edit_files 走同一条：改好的**文本**交给 core，由它合进内存中的整屏树、重算派生值，
    // 再整屏回写工作区。这里不自己写文件——工作区只有一条写入路径，core 接不上就什么都没写。
    // 插事件同样是「改一个组件」，没有理由绕开 core（组件若在分组里，位置没变、包围盒也就不变，
    // 但这条路一并覆盖了将来插事件顺带改位置的情形）。
    const applied = await applyComponentEdit(componentFilePath, newContent);
    if (!applied) {
      throw new Error(`insertTo: 组件 ${(validation.data as ComponentType).id} 不在大屏树上，改动未写入工作区`);
    }

    if (suspend) {
      const component = applied.component;
      return suspend(
        mode === AgentMode.ASK_BEFORE_EDIT
          ? {
              type: SuspendType.AskApprovalPushComponentUpdate,
              purpose: "推送组件更新到前端",
              component,
              replacements: 1
            }
          : { type: SuspendType.PushComponentUpdate, component, replacements: 1 }
      ) as never;
    }

    return { ...eventObj, change: diffChange(relativeToWorkspace(componentFilePath), componentRaw, newContent) };
  }
});
