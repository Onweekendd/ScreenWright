/**
 * C1 · 前端拒绝 → 不落盘
 *
 * 跟 A1 是同一条 prompt，只把假前端换成「用户点了取消」。一正一反，把延迟落盘这套机制钉住：
 * 工具必须先 suspend 拿到前端回执，后端才写工作区。哪个工具偷偷在 suspend 之前就写了盘，
 * 这里的指纹就会变。
 *
 * 这是 C 类里最便宜的一个——agent 走到第一次挂起就够了，后面的轮次根本不会发生。TODO 里
 * 「建议每个 case 都跑一遍拒绝版本」说的就是这条路。
 *
 * ⚠️ 已知会红：create-event-template.ts 的 insertTo 在 suspend() 之前就 applyComponentEdit 了，
 * 是延迟落盘改造漏下的最后一处。这条 case 走的是 create_component 那条路，碰不到它；
 * 等哪天有一个「拒绝配事件」的 case，那处会被钉在墙上。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, isWriteSuspend, newComponents } from "../../harness/case";

export const c1RejectNoWrite: EvalCase = {
  id: "c1-reject-no-write",
  title: "前端拒绝 → 不落盘",
  fixture: "empty-screen",

  prompt: "在这块大屏上放一个词云组件",

  mode: AgentMode.AUTO_EDIT,

  // 用户点了取消。拒绝也必须 resume——真前端 resolveSuspend 返回 null 时流会挂着等超时，
  // 那是另一条路，不是这里要测的。
  frontend: { approve: false },

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const writes = ctx.suspends.filter((s) => isWriteSuspend(s.type));
    const notRejected = writes.filter((s) => s.resumeData.approved !== false);

    return [
      {
        name: "工作区一个字节没动",
        passed: !ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? "指纹变了，说明有工具在拿到前端回执之前就写了盘" : undefined
      },
      {
        name: "画布上没有多出组件",
        passed: created.length === 0,
        detail:
          created.length === 0 ? undefined : `多了 ${created.map((c) => `${c.id}/${c.component.prop}`).join(", ")}`
      },
      // 没有这条，一个什么都没干的 agent 也能让上面两条全绿——那样这个 case 就什么都没测到。
      // 它不是在断言「用了哪个工具」，而是在确认这一趟真的走到了落盘那道关口。
      {
        name: "确实走到了落盘那一步（至少一次写类挂起）",
        passed: writes.length > 0,
        detail: `写类挂起 ${writes.length} 次${ctx.suspends.length > 0 ? `，全部挂起 ${ctx.suspends.map((s) => s.type).join(", ")}` : "，一次挂起都没有"}`
      },
      {
        name: "每一次写类挂起都被回了拒绝",
        passed: notRejected.length === 0,
        detail:
          notRejected.length === 0
            ? undefined
            : `${notRejected.length} 次没走拒绝分支：${notRejected.map((s) => s.type).join(", ")}`
      }
    ];
  }
};
