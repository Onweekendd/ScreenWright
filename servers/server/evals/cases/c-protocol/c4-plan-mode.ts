/**
 * C4 · PLAN 模式全程不落盘
 *
 * 计划模式的全部价值就是「先想清楚再动手」。它一旦漏了口子，用户就会在以为只是在讨论方案的
 * 时候被改了大屏——这类信任一旦破了很难修回来，所以这条比 A 类任何一条都值得守。
 *
 * prompt 故意给一个会引出一大堆写操作的任务：真有口子的话，三个组件里总有一个会漏出去。
 *
 * 判据靠挂起流水账，而不是去翻录制档案数工具名——因为**所有写路径都要先 suspend**（延迟落盘），
 * 所以流水账就是写操作的完整清单。指纹是第二道，两条一起才说得清「没写盘」是因为没试过写，
 * 还是试了但被拦住了。
 *
 * 假前端对 submit_plan 一律回 keep_plan：批准就等于退出计划模式，那之后的写操作不再受它约束，
 * 测的就不是这件事了。「批准计划后照计划执行」是另一个 case。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, isWriteSuspend, newComponents } from "../../harness/case";

export const c4PlanMode: EvalCase = {
  id: "c4-plan-mode",
  title: "PLAN 模式全程不落盘",
  fixture: "empty-screen",

  prompt: "给这块大屏做一个销售看板：顶部放标题，左边放一个词云，右边放一个条形图",

  mode: AgentMode.PLAN,

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const writes = ctx.suspends.filter((s) => isWriteSuspend(s.type));

    return [
      {
        name: "工作区一个字节没动",
        passed: !ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? "计划模式下大屏被改了" : undefined
      },
      {
        name: "画布上没有多出组件",
        passed: created.length === 0,
        detail:
          created.length === 0 ? undefined : `多了 ${created.map((c) => `${c.id}/${c.component.prop}`).join(", ")}`
      },
      {
        name: "全程没有一次写类挂起",
        passed: writes.length === 0,
        detail:
          writes.length === 0
            ? `挂起 ${ctx.suspends.length} 次，全是非写类：${ctx.suspends.map((s) => s.type).join(", ") || "无"}`
            : `${writes.length} 次写类挂起：${writes.map((s) => s.type).join(", ")}`
      },
      // 防空过：进程崩在第一轮时上面三条也会全绿。这条不看 agent 干了什么，只确认它确实跑起来了。
      {
        name: "agent 确实跑起来了",
        passed: Object.keys(ctx.run.chunkCounts).length > 0 && !ctx.run.error && !ctx.run.timedOut,
        detail: ctx.run.error
          ? ctx.run.error.message
          : `${ctx.run.timedOut ? "超时；" : ""}chunk 类型 ${Object.keys(ctx.run.chunkCounts).length} 种`
      }
    ];
  }
};
