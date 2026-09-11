/**
 * C2 · 前端应用失败 → 不落盘
 *
 * 跟 C1 同一条 prompt、同一条不变量，走的是另一个分支：用户批准了，但前端那边应用失败
 * （接口挂了、画布拒绝了这个实例……）。工具的判定顺序是 approved === false → error → 成功载荷，
 * 这里打的是中间那条。
 *
 * 它比 C1 更容易被写坏：拒绝那条路上大家都记得「什么都别做」，而失败这条路上很容易写成
 * 「前端没成，那后端自己写一下吧」——于是工作区和画布分叉，且只在失败时分叉，平时看不出来。
 *
 * ⚠️ 假前端对每一次尝试都回失败，所以 agent 很可能重试几轮才放弃。这个 case 的成本因此高于
 * C1，且轮数天然不稳定——L2 指标看它的趋势没有意义，只看 L0/L1 判定。
 *
 * 轮数对失败原因的措辞**极其敏感**：原先假前端只回一句「前端创建组件失败（eval 模拟）」，
 * agent 判断不出通道通不通，一路升级到建 Task 委派子 agent，20/28 步花在一条注定走不通的路上
 * （委派调的是同一批工具、同一条通道）。换成点明「通道不可用，重试和换工具都会命中同一条」
 * 之后，那条岔路才有被剪掉的可能。所以这里的措辞是 case 的一部分，不是文案。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { applyFailures, type Assertion, type EvalCase, isWriteSuspend, newComponents } from "../../harness/case";

export const c2ApplyFailureNoWrite: EvalCase = {
  id: "c2-apply-failure-no-write",
  title: "前端应用失败 → 不落盘",
  fixture: "empty-screen",

  prompt: "在这块大屏上放一个词云组件",

  mode: AgentMode.AUTO_EDIT,

  // 批准了，但应用失败。**失败原因必须在这里说清**：它是 agent 唯一能据以判断"下一步干什么"
  // 的信息，也决定了这个 case 到底在考验什么。
  //
  // 选 channelDown（通道整条不通）而不是 payloadRejected（载荷被拒），因为本 case 要测的
  // 不变量是「前端没成，后端不许自己补」——这条只在**无路可走**时才真正受考验。原因若指向
  // 参数，agent 合理地会去改参数重试，测出来的就变成了它会不会调参。
  frontend: { approve: true, applyFailure: applyFailures.channelDown },

  assert: (ctx): Assertion[] => {
    const created = newComponents(ctx.before, ctx.screen);
    const writes = ctx.suspends.filter((s) => isWriteSuspend(s.type));
    const withoutError = writes.filter((s) => s.resumeData.error === undefined);

    return [
      {
        name: "工作区一个字节没动",
        passed: !ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? "指纹变了：前端失败了，后端却自己把它写下去了" : undefined
      },
      {
        name: "画布上没有多出组件",
        passed: created.length === 0,
        detail:
          created.length === 0 ? undefined : `多了 ${created.map((c) => `${c.id}/${c.component.prop}`).join(", ")}`
      },
      {
        name: "确实走到了落盘那一步（至少一次写类挂起）",
        passed: writes.length > 0,
        detail: `写类挂起 ${writes.length} 次${ctx.suspends.length > 0 ? `，全部挂起 ${ctx.suspends.map((s) => s.type).join(", ")}` : "，一次挂起都没有"}`
      },
      {
        name: "每一次写类挂起都被回了失败",
        passed: withoutError.length === 0,
        detail:
          withoutError.length === 0
            ? undefined
            : `${withoutError.length} 次没带 error：${withoutError.map((s) => s.type).join(", ")}`
      }
    ];
  }
};
