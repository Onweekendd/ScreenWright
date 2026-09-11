/**
 * 假前端：suspend 应答器 + 观测点。
 *
 * 形状照抄真前端 `useChunkSideEffects.ts` 的 `resolveSuspend`——按 `suspendPayload.type`
 * 查一张 `Map<SuspendType, handler>`，返回 resumeData。省掉的只有 HTTP/SSE 那层。
 *
 * 有肉的是 CreateComponent / CopyComponent / GroupComponent / AddPanelState 四个：前三个要回
 * **含真实 id 的组件**（真环境里 id 由业务接口分配，eval 里没有业务接口，假前端自己造），
 * AddPanelState 要回一个前端已经用在画布上的状态。两个坑：
 *
 * 1. 造出来的组件必须过 `validateComponentContent`（工具 resume 分支里会再校验一次，
 *    见 `create-component.ts:249`），过不了就整屏落盘失败，会被误判成 agent 的问题。
 *    好在 suspend payload 里那份 template 后端已经用 ComponentSchema 校验过了，
 *    补个 id 原样回传即可。
 * 2. 真前端还会补组件菜单默认值、跑位置尺寸分配，假前端不补——见 TODO「已知边界」。
 */

import { createPanelState } from "@screenwright/core";
import { FolderEnum } from "@screenwright/types";

import { answerFirstOption, type FrontendPolicy, type SuspendLogEntry } from "./case";

/** 组件 id 从 900001 起：真实 id 来自业务接口，取一段不会和 fixture 里已有组件撞的高位。 */
let nextComponentId = 900_001;

export const allocateComponentId = (): number => nextComponentId++;

/** 仅供测试重置，避免用例间 id 漂移。 */
export const resetComponentIdAllocator = (): void => {
  nextComponentId = 900_001;
};

type SuspendPayload = { type?: string } & Record<string, unknown>;
type ResumeData = Record<string, unknown>;
/** 假前端的会话内状态。目前只有提问轮次，`ask_user_question` 的策略要靠它分岔。 */
interface FrontendState {
  askIndex: number;
}
/**
 * 解析后的策略。`applyFailure` 不能被 `Required<>` 拉平——它的**缺省本身就是语义**
 * （不给 = 应用成功），补个默认值等于让每个 case 都在悄悄模拟同一种失败。
 */
type ResolvedPolicy = Required<Omit<FrontendPolicy, "applyFailure">> & Pick<FrontendPolicy, "applyFailure">;

type Handler = (payload: SuspendPayload, policy: ResolvedPolicy, state: FrontendState) => ResumeData;

/**
 * 创建类：回一份带 id 的组件，后端据此过 core 放进树并整屏回写。
 *
 * 工具侧的判定顺序是 `approved === false` → `error` → `component`
 * （`create-component.ts:232/237/245`），三条路各自对应一种策略。
 */
const createLike: Handler = (payload, policy) => {
  if (!policy.approve) {
    return { approved: false };
  }
  if (policy.applyFailure) {
    return { approved: true, error: policy.applyFailure("添加组件") };
  }
  const template = payload.component as Record<string, unknown>;
  return { approved: true, component: withFreshIds(template) };
};

/**
 * 递归换新 id：节点自己、`children` 里的子组件、面板各状态 `config` 里的子组件，全都要换。
 *
 * **只换顶层是不够的**。复制分组时载荷里的 children 是整棵内联子树（`copy-component.ts` 的
 * `readFullComponentTree` 把它们读成了完整对象），沿用原 id 回传的话，core 的 upsert 会按
 * 「先摘再放」把**原件的子组件搬到副本下面**——实测结果是原分组 children 变空、副本挂着
 * 4175/4176 这对原 id，树上看着两个分组，其实只有一份组件。
 *
 * 真实前端由业务接口给整棵子树逐个分配新 id，这里做的是同一件事。
 * 磁盘形态的字符串 children（`"4175_条形图"`）原样放过：那是文件引用，不是这条路会遇到的形态。
 */
const withFreshIds = (node: Record<string, unknown>): Record<string, unknown> => {
  const fresh: Record<string, unknown> = { ...node, id: allocateComponentId() };

  const remapList = (list: unknown): unknown =>
    Array.isArray(list)
      ? list.map((child) =>
          child && typeof child === "object"
            ? { ...withFreshIds(child as Record<string, unknown>), parent: fresh.id }
            : child
        )
      : list;

  if (Array.isArray(fresh.children)) {
    fresh.children = remapList(fresh.children);
  }
  if (Array.isArray(fresh.panelData)) {
    fresh.panelData = (fresh.panelData as Array<Record<string, unknown>>).map((state) => ({
      ...state,
      config: remapList(state.config)
    }));
  }
  return fresh;
};

/**
 * 分组：跟创建类同一条回执形状（`{ approved, component, error }`），但**载荷里没有模板**——
 * `group_component` 的 suspend payload 只有 `componentIds`，容器得假前端自己造。
 *
 * 造一个几何全 0 的空壳就够：成员的摘挂与包围盒重算都归 core（`ComponentManager.group`
 * 见到 children 为空会自己把成员拉进来，再由 upsert 里的 reflowGroup 算盒子）。真前端
 * 那边算好的那份也会被同一个 reflow 覆盖，所以这里传 0 不是偷懒，是**不去伪造派生值**。
 *
 * 字段按 `ComponentFlatSchema` 的必填项铺满——过不了校验的话 `group-component.ts:92`
 * 会直接拒绝落盘，症状看着像 agent 分组失败。
 */
const groupLike: Handler = (_payload, policy) => {
  if (!policy.approve) {
    return { approved: false };
  }
  if (policy.applyFailure) {
    return { approved: true, error: policy.applyFailure("组合分组") };
  }
  // 键集照抄真实分组容器（见 fixtures/a-group.json 的 #4177）——工具用的是**原始对象**
  // 而不是 zod 补过默认值的那份，多写一个字段就会原样落进工作区。
  return {
    approved: true,
    component: {
      id: allocateComponentId(),
      name: "分组",
      title: "分组",
      component: { prop: FolderEnum.group, name: FolderEnum.group, width: 0, height: 0 },
      left: 0,
      top: 0,
      zIndex: 1,
      display: true,
      isLock: false,
      isExpand: true,
      isOuter: true,
      option: {},
      loadAnimation: { type: "none", duration: 1000, delay: 0, timingFunction: "linear" },
      // 空数组即「让 core 自己把成员拉进来」，不是「这个分组没有成员」
      children: []
    }
  };
};

/**
 * 动态面板加状态：状态 id 是本地 uuid，前后端造状态跑的是 core 里同一个 `createPanelState`，
 * 所以这里直接调它，只把名字换成载荷里用户要的那个（core 那份按序号取名「状态N」）。
 */
const addPanelState: Handler = (payload, policy) => {
  if (!policy.approve) {
    return { approved: false };
  }
  if (policy.applyFailure) {
    return { approved: true, error: policy.applyFailure("新增面板状态") };
  }
  const name = typeof payload.stateName === "string" ? payload.stateName : "新状态";
  return { approved: true, state: { ...createPanelState(0), title: name, name } };
};

/**
 * 不产生新 id 的那类（移动 / 解组 / 过滤器存删）：只回一个「干完了」。
 * 路径不由前端拼——它一手写就得跟落盘侧的文件名净化规则逐字对齐，对不上也不报错。
 */
const appliedOnly =
  (field: string): Handler =>
  (_payload, policy) => {
    if (!policy.approve) {
      return { approved: false };
    }
    return policy.applyFailure ? { [field]: false, error: policy.applyFailure("应用改动") } : { [field]: true };
  };

/**
 * 删除组件：回执字段是 **`componentId`**，不是「干完了」布尔。
 *
 * `delete-file.ts:135` 认的就是这个键；回错字段会让它一路走到底再 `suspend()` 一次，
 * 于是同一个删除请求无限挂起——不报错，只是 case 卡到超时。
 */
const deleteComponent: Handler = (payload, policy) => {
  if (!policy.approve) {
    return { approved: false };
  }
  if (policy.applyFailure) {
    return { error: policy.applyFailure("删除组件") };
  }
  return { componentId: Number(payload.componentId) };
};

/**
 * 结构化提问：把每个问题交给 case 的 {@link AnswerPolicy} 定夺，默认取第一个选项。
 *
 * 键是**问题原文**（`ask-user-question.ts:28` 的 outputSchema 写着「问题文本到答案的映射」）。
 *
 * 一次挂起里的多个问题共享同一个 `askIndex`——它数的是「第几轮被问」，不是「第几个问题」。
 * 计数在答完整批之后才 +1，否则同一批里的第二个问题就会被当成下一轮。
 */
const answerQuestions: Handler = (payload, policy, state) => {
  const questions = (payload.questions ?? []) as Array<{ question?: string; options?: Array<{ label?: string }> }>;
  const answers: Record<string, string> = {};
  for (const q of questions) {
    const question = q.question ?? "";
    const options = (q.options ?? []).map((o) => o.label ?? "").filter((label) => label.length > 0);
    answers[question] = policy.answer({ question, options, askIndex: state.askIndex });
  }
  state.askIndex += 1;
  return { answers };
};

/**
 * 提交计划：一律回 `keep_plan`——**批准了就退出计划模式**，那之后的写操作就不再受计划模式
 * 约束了，C4 要测的正是「计划模式全程不落盘」。要测「批准计划后照计划执行」是另一个 case，
 * 到时候按 policy 分岔。
 */
const submitPlan: Handler = () => ({ action: "keep_plan" });

/**
 * 浏览器执行：一律回失败。
 *
 * **不能回 `ok: true`**——eval 跑在 Node 里，没有 DOM，谎称执行成功会让 agent 拿着一个不存在的
 * 结果继续推进，后面的判断全建立在假前提上。回失败是如实反映「这个环境没有浏览器」。
 *
 * 也不能不铺：`execute-in-browser.ts:75` 认的是 `ok` 字段，兜底回的 `{ approved: true }` 两个分支
 * 都不匹配，工具会重新 suspend——同一个请求无限往返，case 卡到超时。
 */
const browserUnavailable: Handler = () => ({ ok: false, error: "eval 环境没有浏览器，无法执行脚本" });

/**
 * 应答表。键是 `SuspendType` 的字符串值而不是枚举本身，所以这张表不随 `suspend.ts` 演进
 * 而失效——新增类型这里不改也能跑（走兜底）。代价是漏铺不会被 tsc 拦住，补齐时照
 * `SuspendDefs`（`types/suspend.ts`，30 个 type / 14 个 AskApproval 变体）过一遍。
 *
 * **有肉的类型漏铺会挂死，不会报错**：兜底回的 `{ approved }` 过得了 resume schema（字段全
 * 可选），但工具认不出自己要的那个键，于是重新 `suspend()`——同一个请求无限往返。所以新写
 * case 时先照着它要走的工具核一遍这张表，别指望兜底。
 */
const handlers = new Map<string, Handler>([
  ["create_component", createLike],
  ["ask_approval_create_component", createLike],
  ["copy_component", createLike],
  ["ask_approval_copy_component", createLike],
  ["group_component", groupLike],
  ["ask_approval_group_component", groupLike],
  ["add_panel_state", addPanelState],
  ["ask_approval_add_panel_state", addPanelState],
  ["push_component_update", appliedOnly("componentUpdated")],
  ["ask_approval_push_component_update", appliedOnly("componentUpdated")],
  ["move_component", appliedOnly("moved")],
  ["ask_approval_move_component", appliedOnly("moved")],
  ["ungroup_component", appliedOnly("ungrouped")],
  ["ask_approval_ungroup_component", appliedOnly("ungrouped")],
  ["save_filter", appliedOnly("filterSaved")],
  ["ask_approval_save_filter", appliedOnly("filterSaved")],
  ["delete_filter", appliedOnly("filterDeleted")],
  ["ask_approval_delete_filter", appliedOnly("filterDeleted")],
  ["update_screen_info", appliedOnly("screenInfoUpdated")],
  ["ask_approval_update_screen_info", appliedOnly("screenInfoUpdated")],
  ["delete_component", deleteComponent],
  ["ask_approval_delete_component", deleteComponent],
  ["execute_in_browser", browserUnavailable],
  ["ask_approval_execute_in_browser", browserUnavailable],
  ["ask_user_question", answerQuestions],
  ["submit_plan", submitPlan]
]);

/**
 * 把批次标识原样回传。
 *
 * `edit_files` 一次可以改多个文件，它靠 `batchId:operationId` 认领每一帧 resume 属于哪一项；
 * 对不上就是 `edit_files resume mismatch: expected <batchId>:0, received undefined`，这次编辑
 * 一个字节都不会落盘。真实前端本来就会原样带回（`batchOperationFields` 在 suspend 与 resume
 * 两侧的 schema 里都有），假前端漏了这一步，症状是「挂起也应答了，工作区却没变」。
 */
const echoBatch = (payload: SuspendPayload): Record<string, unknown> => ({
  ...(typeof payload.batchId === "string" ? { batchId: payload.batchId } : {}),
  ...(typeof payload.operationId === "string" ? { operationId: payload.operationId } : {})
});

export interface FakeFrontend {
  /** 按 payload 查表出应答。**永远返回一个合法 resumeData**，不返回 null。 */
  reply(payload: SuspendPayload, meta: Omit<SuspendLogEntry, "payload" | "resumeData" | "at" | "type">): ResumeData;
  /** 挂起流水账，按发生顺序 */
  readonly log: SuspendLogEntry[];
}

export const createFakeFrontend = (policy: FrontendPolicy = {}): FakeFrontend => {
  const resolved: ResolvedPolicy = {
    approve: policy.approve ?? true,
    applyFailure: policy.applyFailure,
    answer: policy.answer ?? answerFirstOption
  };
  const log: SuspendLogEntry[] = [];
  // 每次 createFakeFrontend 新建一份：case 之间、attempt 之间都不该共享提问轮次
  const state: FrontendState = { askIndex: 0 };

  return {
    log,
    reply(payload, meta) {
      const type = payload.type ?? "";
      const handler = handlers.get(type);

      // 兜底给 `{ approved }` 而不是抛错：纯审批类的 suspend 本来就只要这一个字段，
      // 兜底即正解；真漏注册了一个有肉的类型，也不该让整个 case 挂死——断言里能从 log
      // 看出「这个类型走了兜底」，比挂到超时可查得多。
      const resumeData = {
        ...(handler ? handler(payload, resolved, state) : { approved: resolved.approve }),
        ...echoBatch(payload)
      };

      log.push({ type, ...meta, payload, resumeData, at: Date.now() });
      return resumeData;
    }
  };
};
