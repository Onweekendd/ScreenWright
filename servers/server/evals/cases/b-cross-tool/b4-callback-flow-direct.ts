/**
 * B4 · 回调参数贯通（不委派，主 agent 自己做）
 *
 * 跟 B3 是同一个任务（点击抛回调参数 → 过滤器消费 → 绑到另一个组件），唯一变量是**不走委派**。
 * B3 里主 agent 每次都 `createTask` + `agent-swExecutorAgent` 委派给子 agent，子 agent 内部
 * 反复因写操作 suspend/resume，每续工一次 Mastra 就给它换一个新 threadId（见
 * `docs/mastra-delegation-threadid-churn.md`）——这是个框架 bug，会真的把工具调用炸掉。
 * B3 连续两次真实运行都失败在「条形图没抛出回调参数」，但没法判断这是 agent 本身不会连这条
 * 数据流，还是被委派链路的框架 bug 拖累的。
 *
 * B4 把委派这个变量摘掉：同一个任务，明确要求主 agent 自己直接写完，不建 Task 不委派。
 * 这本来就是系统提示词自己的判据（`sw-agent-core.md` 的判据表：「配置一个事件/一个过滤器」
 * 归在「直接写」一档），B3 里 agent 却每次都选了委派——这本身也是过度委派的一个实例。
 * B4 的 prompt 只是把 agent 自己的文档策略挑明了说一遍，不是强加一条不合理的规则。
 *
 * 两种结果都有信息量：
 * - B4 通过 → B3 的失败主要是框架 bug 的锅，不是 agent 不会连这条数据流
 * - B4 也失败在同一个地方（cbArgs 为空）→ 是 agent 本身的能力缺口，和委派与否无关，
 *   多半是 `cbArgs` 和 `callbackArgs` 这两个近义词被记混了（见 `utils.ts` 的
 *   `unrecognizedTopLevelKeys` ——这条案发后新加的警告应该能在这里派上用场，
 *   跑完看 agent 有没有自己借着警告改对）
 *
 * 判据、fixture 与 B3 完全一致，只换了抛出/消费这对组件，避免报告里两条一模一样不好区分。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent, readScreenJson, screenFiles } from "../../harness/case";

const EMITTER_ID = 4181; // 折线柱形图，抛出方（B3 用的是条形图 #4179，这里换一对避免报告里难区分）
const CONSUMER_ID = 4179; // 条形图，消费端（过滤器绑到它身上）

/** _callback_flows/{argName}.json 的形状（flow-graphs.ts 的 DataFlowEntry） */
interface CallbackFlowFile {
  emittedBy: Array<{ id: string; name: string; originField: string; onEvents: string[] }>;
  consumedBy: Array<{ filterName: string; boundTo: Array<{ id: string; name: string }> }>;
}

export const b4CallbackFlowDirect: EvalCase = {
  id: "b4-callback-flow-direct",
  title: "回调参数贯通（不委派）",
  fixture: "three-components",

  prompt:
    "在这块大屏上把一条数据流连起来：点击「折线柱形图」时把选中的那一项抛成回调参数，" +
    "再建一个数据过滤器消费这个参数，并把过滤器绑到「条形图」上，让它跟着筛选。" +
    "这是配置一个事件加一个过滤器的单点任务，请你自己直接写完，不用建 Task 委派给子 agent。",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const emitter = findComponent(ctx.screen, EMITTER_ID);
    const consumer = findComponent(ctx.screen, CONSUMER_ID);

    const flowFiles = screenFiles(ctx.workspace.screenDir).filter(
      (f) => f.startsWith("_callback_flows/") && f.endsWith(".json")
    );
    const flows = flowFiles
      .map((rel) => ({ rel, entry: readScreenJson<CallbackFlowFile>(ctx.workspace.screenDir, rel) }))
      .filter((f): f is { rel: string; entry: CallbackFlowFile } => f.entry !== undefined);

    const connected = flows.filter((f) => f.entry.emittedBy.length > 0 && f.entry.consumedBy.length > 0);
    const fromEmitter = connected.filter((f) => f.entry.emittedBy.some((e) => Number(e.id) === EMITTER_ID));
    const toConsumer = fromEmitter.filter((f) =>
      f.entry.consumedBy.some((c) => c.boundTo.some((b) => Number(b.id) === CONSUMER_ID))
    );

    const describe = (f: { rel: string; entry: CallbackFlowFile }) =>
      `${f.rel.replace("_callback_flows/", "").replace(".json", "")}：抛=${f.entry.emittedBy.map((e) => e.id).join(",") || "无"} 收=${f.entry.consumedBy.map((c) => c.filterName).join(",") || "无"}`;

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "折线柱形图抛出了回调参数",
        passed: (emitter?.cbArgs ?? []).length > 0,
        detail: emitter ? `cbArgs 有 ${(emitter.cbArgs ?? []).length} 项` : "折线柱形图不在树上"
      },
      {
        name: "建出了数据过滤器",
        passed: Object.keys(ctx.screen.dataFilterArr ?? {}).length > 0,
        detail: `过滤器：${
          Object.values(ctx.screen.dataFilterArr ?? {})
            .map((f) => f.name)
            .join(", ") || "无"
        }`
      },
      {
        name: "_callback_flows 里生成了数据流",
        passed: flows.length > 0,
        detail: flows.length > 0 ? flows.map(describe).join("；") : "目录里一个文件都没有"
      },
      {
        name: "有一条数据流两侧都有人（抛出方 + 消费方）",
        passed: connected.length > 0,
        detail:
          connected.length > 0
            ? connected.map(describe).join("；")
            : `${flows.length} 条流全是单边的：${flows.map(describe).join("；") || "无"}`
      },
      {
        name: "抛出方是折线柱形图、消费侧绑到了条形图",
        passed: toConsumer.length > 0,
        detail:
          toConsumer.length > 0
            ? toConsumer.map((f) => f.rel).join(", ")
            : `连通的流里没有 #${EMITTER_ID} → #${CONSUMER_ID} 这一条；` +
              `条形图 listenArgs = ${(consumer?.listenArgs ?? []).map((a) => a.filterName).join(",") || "空"}`
      }
    ];
  }
};
