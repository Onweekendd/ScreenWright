import type { z } from "zod";

import { swFlopPerformanceSuperRefine } from "./indicator/swFlopPerformance";
import type { ComponentProp } from "./propSchemaMap";
import { swScrollSuperRefine } from "./text/swScroll";

type SuperRefineFn = (
  val: { data?: unknown; option?: Record<string, unknown>; component?: { width?: number; height?: number } },
  ctx: z.RefinementCtx
) => void;

/**
 * 组件专属的跨字段业务规则（开关联动、数组长度一致性……），按 prop 注册。
 *
 * 这些规则刻意不写进各自的 `xxxOptionSchema` 本体——写进去会导致
 * `component-schema.test.ts` 那类"真实 fixture 必须零错误通过 schema"的回归测试失败，
 * 因为真实历史数据经常不满足这些业务约束（比如只填了 fontLinearColor、setFontLinear
 * 干脆没这个键），但那仍是合法的、已经渲染过的组件，不该被当成类型错误。
 *
 * 只有 `validateComponentContent`（运行时对 agent 编辑结果的校验）这条路径会用到这个
 * registry，走的是"只警告不阻断"的 warnings 通道，见该函数注释。
 */
export const componentSuperRefineMap: Partial<Record<ComponentProp, SuperRefineFn>> = {
  swFlopPerformance: swFlopPerformanceSuperRefine,
  swScroll: swScrollSuperRefine
};
