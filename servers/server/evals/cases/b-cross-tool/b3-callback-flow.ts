/**
 * B3 · 回调参数贯通
 *
 * 这条测的不是某个工具，是 agent 能不能把一条数据流从头连到尾：组件抛出一个回调参数 →
 * 过滤器消费它 → 过滤器绑到另一个组件上。三段里断掉任何一段，画布上都不会报错，只是点了
 * 没反应——这正是真实项目里最常见、也最难查的那类问题。
 *
 * 判据用 _callback_flows/{argName}.json：它把「谁抛的」和「谁消费的」并排放在一个文件里，
 * 两侧都有人才算这条流是通的。这也是 agent 自己排查数据流时读的那份索引，所以断言它
 * 顺带验证了「排查工具本身是不是可用的」。
 *
 * 不写死参数名：叫 region 还是 地区 由 agent 定，写死就变成在测它会不会复述我们给的词。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, findComponent, readScreenJson, screenFiles } from "../../harness/case";

const EMITTER_ID = 4179; // 条形图，抛出方
const CONSUMER_ID = 4180; // 双向条形图，消费端（过滤器绑到它身上）

/** _callback_flows/{argName}.json 的形状（flow-graphs.ts 的 DataFlowEntry） */
interface CallbackFlowFile {
  emittedBy: Array<{ id: string; name: string; originField: string; onEvents: string[] }>;
  consumedBy: Array<{ filterName: string; boundTo: Array<{ id: string; name: string }> }>;
}

export const b3CallbackFlow: EvalCase = {
  id: "b3-callback-flow",
  title: "回调参数贯通",
  fixture: "three-components",

  prompt:
    "在这块大屏上把一条数据流连起来：点击「条形图」时把选中的那一项抛成回调参数，" +
    "再建一个数据过滤器消费这个参数，并把过滤器绑到「双向条形图」上，让它跟着筛选",

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
        name: "条形图抛出了回调参数",
        passed: (emitter?.cbArgs ?? []).length > 0,
        detail: emitter ? `cbArgs 有 ${(emitter.cbArgs ?? []).length} 项` : "条形图不在树上"
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
      // 这条才是 B3 的正题：两侧都有人，链路才算通。
      {
        name: "有一条数据流两侧都有人（抛出方 + 消费方）",
        passed: connected.length > 0,
        detail:
          connected.length > 0
            ? connected.map(describe).join("；")
            : `${flows.length} 条流全是单边的：${flows.map(describe).join("；") || "无"}`
      },
      {
        name: "抛出方是条形图、消费侧绑到了双向条形图",
        passed: toConsumer.length > 0,
        detail:
          toConsumer.length > 0
            ? toConsumer.map((f) => f.rel).join(", ")
            : `连通的流里没有 #${EMITTER_ID} → #${CONSUMER_ID} 这一条；` +
              `双向条形图 listenArgs = ${(consumer?.listenArgs ?? []).map((a) => a.filterName).join(",") || "空"}`
      }
    ];
  }
};
