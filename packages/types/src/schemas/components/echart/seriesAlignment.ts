import { z } from "zod";

/**
 * 图表类组件的系列匹配检查——跨 `data`/`option` 两个独立 schema，任何一个 per-prop schema
 * 单独看都看不到，所以不写进某一个具体图表的 option schema 里，而是作为通用规则，在
 * `data`/`option` 合并成同一个 schema 后用 `.superRefine(seriesAlignmentSuperRefine)` 挂上去。
 *
 * 20 余个 echart 组件（EchartlineAndBar/Echartbar/EchartRadar/Echartpie...）的渲染代码都是
 * 同一套写法：先从 `data[].seriesName` 收集出实际存在的系列名，再用 `option.dataSeriesName[i]`
 * 逐个去 `indexOf` 匹配、取到下标后才去读 `seriesType[i]`/`seriesBarColor[i]` 等一整批样式数组
 * （`option.dataUnitName` 配 tooltip 单位是同一个模式）。
 *
 * 配不上（字符串不完全相等，大小写/多余空格都算不等）不会报错——`indexOf` 返回 -1 直接跳过，
 * 那个系列的样式/单位悄悄留空；渲染时要么退回硬编码默认色，要么因为 `seriesType[idx]` 是
 * undefined，既不等于 "bar" 也不等于 "line"，被 `list.filter(item => item)` 整个过滤掉——
 * agent 对此毫无感知。`option.seriesType` 数组长度还会反过来截断 data 里的系列数
 * （`optionData.splice(seriesType.length)`），数组短了，多出来的系列直接被砍掉不渲染。
 *
 * 字段名（`data[].seriesName` / `option.dataSeriesName` / `option.seriesType` /
 * `option.dataUnitName`）是这批组件共享的约定，不属于任何一个组件独有，因此这里做纯运行时的
 * 鸭子类型检查，而不依赖某个具体组件的 data/option 类型。
 */
export function seriesAlignmentSuperRefine(
  val: { data?: unknown; option?: Record<string, unknown> },
  ctx: z.RefinementCtx
): void {
  const { data, option } = val;
  if (!Array.isArray(data) || !option) {
    return;
  }

  const seriesNamesInData = new Set(
    data
      .map((item) => (item as Record<string, unknown> | undefined)?.seriesName)
      .filter((name): name is string => typeof name === "string")
  );
  if (seriesNamesInData.size === 0) {
    return;
  }

  if (Array.isArray(option.dataSeriesName)) {
    option.dataSeriesName.forEach((name: unknown, index: number) => {
      if (typeof name === "string" && !seriesNamesInData.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["option", "dataSeriesName", index],
          message: `dataSeriesName[${index}]="${name}" 在 data 里找不到匹配的 seriesName（data 中实际的系列：${[
            ...seriesNamesInData
          ].join("、")}），该系列的样式配置不会生效，甚至可能被整体裁掉不渲染`
        });
      }
    });
    if (Array.isArray(option.seriesType) && option.seriesType.length < seriesNamesInData.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["option", "seriesType"],
        message: `seriesType 长度（${option.seriesType.length}）小于 data 中的系列数（${seriesNamesInData.size}），多出的系列会被截断、不会渲染`
      });
    }
  }

  if (Array.isArray(option.dataUnitName)) {
    option.dataUnitName.forEach((name: unknown, index: number) => {
      if (typeof name === "string" && !seriesNamesInData.has(name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["option", "dataUnitName", index],
          message: `dataUnitName[${index}]="${name}" 在 data 里找不到匹配的 seriesName，对应的 tooltip 单位不会生效`
        });
      }
    });
  }
}
