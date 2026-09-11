/**
 * C5 · ASK 模式每次改动前都问过
 *
 * ASK 是 thread metadata 的默认模式（bi-chat-turn-stream.ts:65），也就是线上绝大多数会话
 * 走的那一条。它要求每个写工具在动手前先弹审批框——工具侧的实现是 `mode === ASK_BEFORE_EDIT`
 * 时挂 ask_approval_ 那个变体，否则挂 AUTO 变体。漏判一处的症状是「这个操作怎么没问我就做了」，
 * 而且只在那一个工具上出现，人工很难成体系地发现。
 *
 * 所以断言反着写：**流水账里不许出现任何 AUTO 写变体**。哪个工具漏读了 mode，它挂的就是
 * AUTO 那个类型，会被这条直接点名。
 *
 * 和 C1/C4 不同，这条要走完正向路径——审批全部通过，组件必须真的建出来。只断言「问过了」
 * 而不管结果，会漏掉「问了但后面没做成」这种半截状态。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, isAutoWriteSuspend, isWriteSuspend, newComponents } from "../../harness/case";

export const c5AskMode: EvalCase = {
  id: "c5-ask-mode",
  title: "ASK 模式每次改动前都问过",
  fixture: "empty-screen",

  prompt: "在这块大屏上放一个词云组件",

  mode: AgentMode.ASK_BEFORE_EDIT,

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const writes = ctx.suspends.filter((s) => isWriteSuspend(s.type));
    const sneaked = writes.filter((s) => isAutoWriteSuspend(s.type));

    return [
      {
        name: "组件还是建出来了",
        passed: created.length > 0 && ctx.fingerprintChanged,
        detail: `新增 ${created.length} 个：${created.map((c) => `${c.id}/${c.component.prop}`).join(", ") || "无"}`
      },
      {
        name: "改动前问过（至少一次写类挂起）",
        passed: writes.length > 0,
        detail: `写类挂起 ${writes.length} 次：${writes.map((s) => `${s.toolName}/${s.type}`).join(", ") || "无"}`
      },
      // 漏读 mode 的工具会挂 AUTO 变体，等于绕过审批直接动手。
      {
        name: "没有任何一次写操作走了 AUTO 变体",
        passed: sneaked.length === 0,
        detail:
          sneaked.length === 0
            ? undefined
            : `${sneaked.length} 次偷跑：${sneaked.map((s) => `${s.toolName}/${s.type}`).join(", ")}`
      }
    ];
  }
};
