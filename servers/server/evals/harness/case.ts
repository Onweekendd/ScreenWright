/**
 * eval case 的契约。
 *
 * 核心纪律：**断言产出数据，不抛异常**。一次 case 是几十秒到几分钟的真钱，最想看的
 * 恰恰是失败那次的完整结果——断言一抛就把它后面的指标全扔了。判定统一在 report 段做，
 * `runExperiment` 那层也只关心 task 返回了什么，不关心断言过没过。
 *
 * 第二条纪律：**断言终态，不断言过程**。「左边放个词云」可以走 create_component，也可以
 * 先 search_component 再建，还可能建完又 edit_files 调位置——都算对。一旦断言过程，
 * prompt 一改 eval 全红，然后就会开始改 eval 迁就 agent，这套就废了。
 */

import fs from "node:fs";
import path from "node:path";

import { calculateGroupDimensions, childLists } from "@screenwright/core";
import type {
  AllComponentType,
  ComponentType,
  PanelState,
  ParsedLargeScreenInfo,
  SystemComponentProps
} from "@screenwright/types";

import type { AgentMode } from "@/mastra/types/bi-chat";
import { SuspendType } from "@/mastra/types/suspend";

import type { EvalWorkspace } from "./workspace";

/** 一条断言的结果。`detail` 是给半年后的人看的——只说「期望 true」没人查得动。 */
export interface Assertion {
  name: string;
  passed: boolean;
  detail?: string;
}

/**
 * 假前端的挂起流水账。
 *
 * 它的第二个身份是**观测点**：「ASK 模式下每次改动前都问了吗」靠它变成一句断言，
 * 不必去翻录制档案。
 */
export interface SuspendLogEntry {
  type: SuspendType | string;
  toolName: string;
  toolCallId: string;
  /** 主 agent 工具挂起走 main，后台子任务挂起走 background——两者 resume 的端点不同 */
  channel: "main" | "background";
  payload: Record<string, unknown>;
  resumeData: Record<string, unknown>;
  at: number;
}

/** driver 跑完一轮的结果。异常在这里落成数据，不外抛。 */
export interface DriverResult {
  threadId: string;
  /** 达到 driver 内部超时、主动关流收场（`itemTimeout` 只 abort signal，不会中断我们） */
  timedOut: boolean;
  error?: { message: string; stack?: string };
  suspends: SuspendLogEntry[];
  /** 各类 chunk 的计数，粗粒度观测用；细粒度指标读录制档案 */
  chunkCounts: Record<string, number>;
  /**
   * 关键 chunk 的到达时刻（相对本轮起点，毫秒）。只在 `EVAL_CHUNK_TIMELINE=1` 时采集。
   *
   * 补的是录制的盲区：录制只记模型调用，两次调用之间的 suspend→resume 往返看不见。
   */
  timeline?: Array<{ ms: number; type: string; note?: string }>;
  elapsedMs: number;
}

/**
 * 假前端的应答策略：approve 与 applyFailure 两个维度覆盖三条路。
 *
 * | approve | applyFailure | 含义 | 对应 case |
 * |---|---|---|---|
 * | true | 不给 | 批准并成功应用（默认） | A 类全部 |
 * | false | — | 用户拒绝 | C1 |
 * | true | 给了原因 | 批准了但前端应用失败 | C2 |
 *
 * **拒绝也必须 resume。** 真前端 `resolveSuspend` 返回 null 时不触发 resume，流就挂着
 * 等 idle 超时——C1 测的不是这条路。假前端必须始终回一个合法 resumeData。
 */
export interface FrontendPolicy {
  approve?: boolean;
  /**
   * 前端**应用阶段**失败时回给 agent 的原因。**不给就是应用成功。**
   *
   * 故意没有 `apply: false` 这种只说"失败了"的写法——失败原因不是装饰，它是 agent 唯一能据以
   * 决定"下一步干什么"的信息，所以在类型上就说不出「失败但不说为什么」。
   *
   * 实测过代价：原先假前端只回一句「前端创建组件失败（eval 模拟）」，agent 无从判断这是通道
   * 问题还是参数问题、重试和换路有没有用，于是一路升级到建 Task 委派子 agent，白烧 20/28 步。
   * 它推断不出"委派也走同一条通道"，因为消息里根本没提通道——那不是模型的问题，是我们没说。
   *
   * 现成的几类见 {@link applyFailures}；要测新的失败类型直接写一个函数即可。
   *
   * @param toolLabel 正在失败的操作，如「添加组件」——拼进消息里，形状对齐真前端
   *   （`useCreateComponent.ts:255` 是 `添加组件 X 时发生错误: {异常消息}`）
   */
  applyFailure?: (toolLabel: string) => string;
  /** `ask_user_question` 的选项选择，不给就取第一个。见 {@link AnswerPolicy} */
  answer?: AnswerPolicy;
}

/**
 * 几类典型的前端应用失败，**按 agent 该有的反应分类**，不是按错误文案分类。
 *
 * 选哪一类决定了 case 在测什么：同一条「前端没成，后端不许自己补」的不变量，在
 * `channelDown` 下考验的是"认不认命"，在 `payloadRejected` 下考验的是"会不会改对参数"，
 * 两者失败时该看到的 agent 行为完全不同。
 */
export const applyFailures = {
  /**
   * 写通道整条不通。重试、改参数、换工具、委派子 agent 都会命中同一条通道，**没有出路**。
   *
   * 用它来考验"不变量在无路可走时还成不成立"——agent 唯一正确的收场是如实汇报，
   * 任何"那我自己写下去吧"都是违规。
   */
  channelDown: (toolLabel: string): string =>
    `${toolLabel}时发生错误: 组件实例接口 POST /componentApi/instance 返回 502 Bad Gateway` +
    `（前端写通道不可用，本次会话内重试、改参数、换工具都会命中同一条通道）`,

  /**
   * 画布拒绝了这个实例：**载荷有问题，改对了就能成**。
   *
   * 用它来考验 agent 会不会读懂具体字段错误并修正，而不是盲目重试或直接放弃。
   *
   * @param detail 具体到字段的拒绝理由，如 `width 必须为正整数，收到 "很宽"`
   */
  payloadRejected:
    (detail: string) =>
    (toolLabel: string): string =>
      `${toolLabel}时发生错误: 画布拒绝了该组件实例（${detail}）`,

  /**
   * 瞬时抖动：**同样的请求再来一次就可能成**。
   *
   * 用它来考验 agent 会不会重试——与 `channelDown` 相反，这里立刻放弃才是错的。
   * 注意假前端对每次尝试都回同样的结果，所以配它时要自己控制"第几次开始成功"。
   */
  transient: (toolLabel: string): string => `${toolLabel}时发生错误: 请求超时（ETIMEDOUT），这通常是瞬时故障`
} as const;

/**
 * 用户怎么回 `ask_user_question`。
 *
 * 默认取第一个选项——选第一个而不是随机，是为了让同一个 case 每次跑走同一条路，否则
 * L1 断言会随机飘。但**默认策略等于对 agent 提的任何后续方案都点头**，这在「测不变量」
 * 的 C 类里会捅娄子：C3 里 agent 写非法宽度被 schema 挡下（不变量成立），转头问「那改成
 * 数字 800 还是保持现状」，默认选第一个就把 800 写进去了，「工作区一个字节没动」于是变红
 * ——红的不是产品，是假前端替用户开了第二扇门。
 *
 * `askIndex` 是本次 case 里第几次 `ask_user_question` 挂起（从 0 起，一次挂起里的多个问题
 * 共享同一个值）。计数由假前端实例持有，每个 case、每次 attempt 重新构造，不会跨用例串。
 * 有了它才能表达「用户只在最开始表过一次态，后面 agent 自己想出来的替代方案没人同意过」。
 */
export type AnswerPolicy = (ctx: { question: string; options: string[]; askIndex: number }) => string;

/** 默认应答：永远第一个选项 */
export const answerFirstOption: AnswerPolicy = ({ options }) => options[0] ?? "";

/** 「什么都不做」类选项的词面。agent 惯例把它放在末尾，但不能只靠位置认。 */
const DECLINE_RE = /保持|不改|不动|取消|放弃|原样|维持|不变/u;

/** 肯定类选项的词面，用于「确认原始诉求」那一问。 */
const AFFIRM_RE = /确认|确定|继续|仍然|照做|执行|是的|写入/u;

/**
 * 只对**用户原本要求的那件事**点头，对任何替代方案一律回绝。
 *
 * 给 C 类用：case 的意图是「看着 agent 真去试那个非法操作，然后确认它没落盘」。
 * 所以确认原始诉求的那一问必须点头（否则 agent 压根不动手，断言全绿却什么也没测到），
 * 而 agent 撞墙之后自己提的替代方案用户从没要过，一律不接。
 *
 * **判据是提问内容，不是提问序号。** 上一版按 `askIndex === 0` 认「原始诉求」，
 * 前提是两问流程（先确认、再给替代方案）。2026-09-07 那轮实测里 agent 只问了一次，
 * 而那一问已经是替代方案（「宽度想改成多少？1200 / 800 / 维持 600」），
 * 序号判据于是整体错位一格，假前端替用户选了 1200，agent 尽责写了进去，
 * 「工作区一个字节没动」变红——红的不是产品，是应答策略。
 *
 * @param intentRe 能认出「这一问是在确认用户原始诉求」的词面，通常取用户原话里的关键值
 *   （如 C3 的 `很宽` / `字符串`）。命中就按肯定选项答，否则视为替代方案并回绝。
 */
export const answerOnlyOriginalIntent =
  (intentRe: RegExp): AnswerPolicy =>
  ({ question, options }) => {
    // 1) 有选项直接提供「照用户原话做」→ 就选它，这是最强信号
    const asAsked = options.find((o) => intentRe.test(o));
    if (asAsked) {
      return asAsked;
    }

    // 2) 提问提到了原话诉求，且确实给了肯定选项 → 这是「你确定要这么做吗」，点头
    //
    // **必须同时满足**。只看提问会误判：agent 常常在提问里复述原话是为了说明它做不到
    // （「改成字符串「很宽」会被 schema 校验拒绝，你实际想要哪种？」），后面跟的四个选项
    // 全是替代方案。实测栽过：当时没有肯定选项却退回 `options[0]`，选中了「拉宽到 1920 铺满」。
    if (intentRe.test(question)) {
      const affirm = options.find((o) => AFFIRM_RE.test(o));
      if (affirm) {
        return affirm;
      }
    }

    // 3) 其余一律视为 agent 自己提的替代方案，回绝
    return options.find((o) => DECLINE_RE.test(o)) ?? options[options.length - 1] ?? "";
  };

export interface AssertContext {
  /** agent 跑完后的整屏（经 ScreenReader 从磁盘读回，读不回来本身就是 L0 失败） */
  screen: ParsedLargeScreenInfo;
  /** 起点整屏，「跟原来比多了什么」这类断言要用 */
  before: ParsedLargeScreenInfo;
  workspace: EvalWorkspace;
  /** 终态指纹 !== 起点指纹。C 类「一个字节没动」靠它 */
  fingerprintChanged: boolean;
  suspends: SuspendLogEntry[];
  run: DriverResult;
}

export interface EvalCase {
  id: string;
  title: string;
  /** fixtures/<name>.json */
  fixture: string;
  /**
   * 种屏之后、agent 跑之前的额外准备。
   *
   * 存在的理由是**工作区级**的起点：`fixture` 只能表达一块屏，而有些 case 的前提在屏之外
   * ——比如「工作区里已经注册过一个 API 数据源」（`api-registry/` 是所有大屏共享的）。
   *
   * 刻意做成 per-case 而不是整轮统一种：`clearRunArtifacts` 之外的一切都是本轮产物，
   * 谁声明谁负责。这样加一个 case 不会悄悄改变其余 case 看到的环境——否则某天 eval
   * 整体飘了，没人会想到是因为别的 case 往共享目录里多种了点东西。
   */
  setup?: (workspace: EvalWorkspace) => void | Promise<void>;
  prompt: string;
  /**
   * 不给就是 thread metadata 的默认值 ASK_BEFORE_EDIT（`bi-chat-turn-stream.ts:65`）。
   * 模式决定挂起类型：AUTO 走 CreateComponent，ASK 走 AskApprovalCreateComponent。
   */
  mode?: AgentMode;
  frontend?: FrontendPolicy;
  assert: (ctx: AssertContext) => Assertion[] | Promise<Assertion[]>;
}

// ── 断言小工具 ────────────────────────────────────────────────────────────────

/**
 * 递归摊平整棵树。
 *
 * 子组件挂在两个地方——分组的 `children` 和各类面板 `panelData[].config`，走 core 的
 * `childLists` 把两处一起拿到。**别只递归 children**：动态面板状态里的组件会整个漏掉，
 * 表现成「组件明明建出来了，newComponents 却是空的」。
 */
export const flattenLayers = (layers: ComponentType[]): ComponentType[] =>
  layers.flatMap((c) => [c, ...childLists(c).flatMap(flattenLayers)]);

/** 这次跑完之后新出现的组件（按 id 差集）。 */
export const newComponents = (before: ParsedLargeScreenInfo, after: ParsedLargeScreenInfo): ComponentType[] => {
  const known = new Set(flattenLayers(before.layers).map((c) => c.id));
  return flattenLayers(after.layers).filter((c) => !known.has(c.id));
};

export const hasProp = (components: ComponentType[], prop: AllComponentType): ComponentType[] =>
  components.filter((c) => c.component.prop === prop);

/** 按 id 找组件，含分组子组件与面板状态里的。 */
export const findComponent = (screen: ParsedLargeScreenInfo, id: number): ComponentType | undefined =>
  flattenLayers(screen.layers).find((c) => c.id === id);

/** 组件挂在哪。A2/A3/A5/A6 全都在断言这个。 */
export type Container =
  | { kind: "root" }
  | { kind: "group"; parent: ComponentType }
  | { kind: "panelState"; parent: ComponentType; stateId: string };

export const panelStatesOf = (component: ComponentType): PanelState[] =>
  (component as SystemComponentProps).panelData ?? [];

export const containerOf = (screen: ParsedLargeScreenInfo, id: number): Container | null => {
  if (screen.layers.some((c) => c.id === id)) {
    return { kind: "root" };
  }
  const walk = (items: ComponentType[]): Container | null => {
    for (const parent of items) {
      if (parent.children?.some((c) => c.id === id)) {
        return { kind: "group", parent };
      }
      for (const state of panelStatesOf(parent)) {
        if (state.config.some((c) => c.id === id)) {
          return { kind: "panelState", parent, stateId: `${state.id}` };
        }
      }
      for (const list of childLists(parent)) {
        const found = walk(list);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };
  return walk(screen.layers);
};

export const describeContainer = (container: Container | null): string => {
  if (!container) {
    return "不在树上";
  }
  switch (container.kind) {
    case "root":
      return "大屏根级";
    case "group":
      return `分组 ${container.parent.id}`;
    default:
      return `面板 ${container.parent.id} 的状态 ${container.stateId}`;
  }
};

/**
 * 分组包围盒是否与成员一致。
 *
 * 期望值用 core 的 `calculateGroupDimensions` 现算——跟运行时是同一个函数，所以这里查的不是
 * 「算得对不对」，而是**落盘的那份有没有跟着成员一起重算**。成员进出分组后忘了 reflow，
 * 就会在这里露出来。子组件坐标是绝对值，包围盒即成员盒子的并集。
 */
export const groupBoxIsTight = (group: ComponentType): boolean => {
  const box = calculateGroupDimensions(group.children ?? []);
  return (
    group.left === box.left &&
    group.top === box.top &&
    group.component.width === box.width &&
    group.component.height === box.height
  );
};

export const describeGroupBox = (group: ComponentType): string => {
  const box = calculateGroupDimensions(group.children ?? []);
  return (
    `实际 (${group.left},${group.top}) ${group.component.width}×${group.component.height}，` +
    `成员并集 (${box.left},${box.top}) ${box.width}×${box.height}`
  );
};

/** 组件盒子完整落在画布内。detail.width/height 是 string，别忘了转。 */
export const withinCanvas = (component: ComponentType, screen: ParsedLargeScreenInfo): boolean => {
  const canvasW = Number(screen.detail.width);
  const canvasH = Number(screen.detail.height);
  const { left, top } = component;
  const { width, height } = component.component;
  return left >= 0 && top >= 0 && left + width <= canvasW && top + height <= canvasH;
};

// ── 挂起分类 ──────────────────────────────────────────────────────────────────

/**
 * 会让工作区落盘的 AUTO 模式挂起类型。
 *
 * 之所以能靠这张表回答「这一轮写没写盘」，是因为**延迟落盘**：所有写路径都要先 suspend
 * 拿到前端回执，后端才过 core 落盘。所以挂起流水账就是写操作的完整清单，不必去翻录制档案。
 *
 * ASK 模式下它们各自对应一个 `ask_approval_` 前缀的变体——枚举值本身就是那串蛇形名，
 * 所以变体名直接拼得出来，不用再维护第二张表。
 */
export const AUTO_WRITE_SUSPENDS: readonly SuspendType[] = [
  SuspendType.CreateComponent,
  SuspendType.CopyComponent,
  SuspendType.GroupComponent,
  SuspendType.UngroupComponent,
  SuspendType.MoveComponent,
  SuspendType.DeleteComponent,
  SuspendType.PushComponentUpdate,
  SuspendType.SaveFilter,
  SuspendType.DeleteFilter,
  SuspendType.AddPanelState,
  SuspendType.UpdateScreenInfo
];

/** ASK 模式下这些类型出现，就说明有人绕过了审批直接走 AUTO 那条路。 */
export const isAutoWriteSuspend = (type: string): boolean => (AUTO_WRITE_SUSPENDS as readonly string[]).includes(type);

/** 任何形态的写类挂起，含 edit_files 用的通用审批 `ask_approval`。 */
export const isWriteSuspend = (type: string): boolean =>
  type === SuspendType.AskApproval ||
  AUTO_WRITE_SUSPENDS.some((auto) => type === auto || type === `ask_approval_${auto}`);

// ── 磁盘断言 ──────────────────────────────────────────────────────────────────

/**
 * 读大屏目录下的一个 JSON，读不到就返回 undefined（缺文件本身往往就是断言要抓的东西）。
 *
 * 派生索引（`_event_flows/{sourceId}.json`、`_callback_flows/{argName}.json`）只在磁盘上，
 * 读回内存的整屏对象里没有。B 类断言的正是「这些索引跟着重算了没有」，所以必须读盘，
 * **不能在断言里拿 buildEventFlowGraph 现算一遍**——那就成了拿实现验证实现。
 */
export const readScreenJson = <T>(screenDir: string, relPath: string): T | undefined => {
  const file = path.join(screenDir, relPath);
  if (!fs.existsSync(file)) {
    return undefined;
  }
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return undefined;
  }
};

/**
 * 列出大屏目录下的全部文件（相对路径，已排序）。
 *
 * 有些结论只在磁盘上成立：分组解散后容器文件有没有被清掉、过滤器的 .json / .js 是不是成对。
 * 这些读回内存的整屏对象里看不出来——孤儿文件不会进树，但它确实还躺在工作区里。
 */
export const screenFiles = (screenDir: string): string[] => {
  const walk = (dir: string, prefix = ""): string[] => {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git") {
        continue;
      }
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      out.push(...(entry.isDirectory() ? walk(path.join(dir, entry.name), rel) : [rel]));
    }
    return out;
  };
  return fs.existsSync(screenDir) ? walk(screenDir).sort() : [];
};
