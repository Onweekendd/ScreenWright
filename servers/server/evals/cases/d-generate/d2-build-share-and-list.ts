/**
 * D2 · 带占比图与明细表的大屏
 *
 * 与 D1 的分工：D1 用一句极粗的需求（「帮我做一个电力监控大屏」）测**收敛能力**，
 * 内容清单由模型自己定，跑出来是什么组件全看它。代价是覆盖不稳——实测连着几轮
 * 都没生成饼图和表格，而恰恰这两类是最容易出问题的。
 *
 * 所以这条反过来：**把内容形态钉死在 prompt 里**，换一个业务域（零售），
 * 逼出 `share`（占比）和 `list`（明细表）两种内容。它们各自对应一个已知的坑：
 *
 * - **占比 → 选型陷阱**：组件库里 `echartring`（环形图）是**进度环**，schema 是
 *   `{value, total}` 单项，不是饼图。检索词里出现「环形图」会让它盖过 `echartpie`，
 *   模型只好拿进度环去凑五条占比数据，渲染出来是错的。
 * - **明细表 → 列驱动**：表格类组件的数据键由 `option.column` 各列的 `alias` 定义，`dataRemark` 里那份
 *   只是模板默认列。不设 column 就沿用默认列，跟自造的数据键对不上，表格渲染成空。
 *   这类组件的 zod schema 是自由键值对，键集校验对它天然放行，只能单独兜。
 *
 * 断言的重点也因此不同：D1 断结构（不重叠、在画布内），这条断**字段能不能渲染出来**。
 * 那是结构断言看不见的一层——布局完美、数据是真业务数据，却因为字段名对不上而一片空白。
 */

import { AgentMode } from "@/mastra/types/bi-chat";

import { type Assertion, type EvalCase, flattenLayers, withinCanvas } from "../../harness/case";
import { dataMatchesSchema, groupsAreOuter, kpiHasLabel } from "./field-assertions";

export const d2BuildShareAndList: EvalCase = {
  id: "d2-build-share-and-list",
  title: "带占比图与明细表的大屏",
  fixture: "empty-screen",

  // 内容形态说死，业务域留给模型发挥（造数据的质量仍然在考察范围内）。
  // 换成零售也是有意的：D1 是电力，两条合起来才能说明造数据不是只会一个领域。
  prompt: "做一个零售销售分析大屏：要有各品类的销售额占比、最新订单的明细列表，再放几个关键指标",

  mode: AgentMode.AUTO_EDIT,

  assert: (ctx): Assertion[] => {
    const all = flattenLayers(ctx.screen.layers);
    const leaves = all.filter((c) => c.component.prop !== "sw-folder");
    const outside = leaves.filter((c) => !withinCanvas(c, ctx.screen));

    return [
      {
        name: "工作区发生了变更",
        passed: ctx.fingerprintChanged,
        detail: ctx.fingerprintChanged ? undefined : "整屏指纹与起点一致，agent 什么都没落盘"
      },
      {
        name: "画布上建出了组件",
        passed: leaves.length >= 3,
        detail: `内容组件 ${leaves.length} 个：${leaves.map((c) => `${c.id}/${c.component.prop}`).join(", ") || "无"}`
      },
      {
        name: "所有组件都在画布内",
        passed: outside.length === 0,
        detail:
          outside.length === 0
            ? `画布 ${ctx.screen.detail.width}×${ctx.screen.detail.height}`
            : outside.map((c) => `${c.id} ${c.left},${c.top} ${c.component.width}×${c.component.height}`).join("；")
      },
      // 这两条才是本 case 的重点，见文件头注释
      ...dataMatchesSchema(ctx.screen),
      ...kpiHasLabel(ctx.screen),
      ...groupsAreOuter(ctx.screen)
    ];
  }
};
