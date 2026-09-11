import type { ComponentType, ParsedLargeScreenInfo } from "@screenwright/types";

import { type Assertion, flattenLayers } from "../../harness/case";

/**
 * 「组件建出来了，但数据渲染不出来」这一类的断言。
 *
 * 单独提出来是因为它抓的东西**从结构断言里看不见**：组件在画布内、不重叠、数据也不是
 * 「类目1」这种占位词——却因为字段名对不上而整块渲染成空。实测踩过一整轮：
 * 布局完美、数据是真·电力数据（白鹤滩水电站 8450MW），但 echartareaLine 拿到的是
 * `{time, load, output}` 而它只读 `{name, seriesName, value}`，屏上就是一片空白。
 *
 * 判据取组件自带的 `dataRemark`——它来自 Module 模板、没人改得动，声明了该组件真正读哪些键，
 * 与 `componentPropSchemaMap` 同源。拿它当断言依据，比在 case 里手写一份字段表可靠得多。
 */

interface DataRemarkEntry {
  key?: string;
}

const dataRowsOf = (c: ComponentType): Array<Record<string, unknown>> => {
  const data = (c as unknown as { data?: unknown }).data;
  return Array.isArray(data)
    ? (data.filter((r) => r !== null && typeof r === "object") as Array<Record<string, unknown>>)
    : [];
};

const optionOf = (c: ComponentType): Record<string, unknown> =>
  ((c as unknown as { option?: Record<string, unknown> }).option ?? {}) as Record<string, unknown>;

const remarkKeysOf = (c: ComponentType): string[] => {
  const remark = (c as unknown as { dataRemark?: DataRemarkEntry[] }).dataRemark;
  return Array.isArray(remark) ? remark.map((r) => r.key).filter((k): k is string => typeof k === "string") : [];
};

/**
 * 列驱动组件的实际列定义。
 *
 * 键名以 `componentPropSchemaMap` 里的 zod schema 为准，别照直觉写：是 **`option.column`
 * （单数）**，每列是 `{ name: 显示名, alias: 数据字段名, icon? }`——**数据键在 `alias` 上**。
 * 这里猜错过两轮（columns/key、field），而两次的表现方向相反、都不好查：
 *
 * - 猜的键名 data 侧有 → 拿到一堆对不上的名字，把**完全正确**的 ftScroll 判成失败（误报）
 * - 猜的键名一个都取不到 → 得到空数组，空集合一比对必然通过（**漏报**，更糟）
 *
 * 所以取不到 alias 时必须返回错误而不是空数组：列定义存在却没有一个合法 alias，
 * 本身就说明模型编了键名，那张表是渲染不出来的。
 */
type ColumnCheck = { kind: "none" } | { kind: "bad"; detail: string } | { kind: "ok"; aliases: string[] };

const columnAliasesOf = (c: ComponentType): ColumnCheck => {
  const column = optionOf(c).column;
  if (!Array.isArray(column)) {
    return { kind: "none" };
  }
  const aliases = column.map((col) => (col as { alias?: unknown } | null)?.alias);
  const bad = aliases.filter((a) => typeof a !== "string" || a.length === 0);
  if (bad.length > 0) {
    return {
      kind: "bad",
      detail: `${bad.length}/${aliases.length} 列没有合法的 alias（每列应为 { name: 显示名, alias: 数据字段名 }），实得 ${JSON.stringify(column[0])}`
    };
  }
  return { kind: "ok", aliases: aliases as string[] };
};

/** 有 data、有 dataRemark 的业务组件；容器与没数据的装饰件不参与 */
const dataBearing = (screen: ParsedLargeScreenInfo): ComponentType[] =>
  flattenLayers(screen.layers).filter((c) => dataRowsOf(c).length > 0 && remarkKeysOf(c).length > 0);

/**
 * 每个组件的 data 键必须与它自己声明的字段对齐。
 *
 * 列驱动组件（表格类）走另一条路：以 `option.column` 里各列的 `alias` 为准——不设 column
 * 就是沿用模板默认列，跟自造的数据键对不上，表格渲染成空，所以「没设 column」本身就算失败。
 */
export const dataMatchesSchema = (screen: ParsedLargeScreenInfo): Assertion[] => {
  const components = dataBearing(screen);
  const problems: string[] = [];

  for (const c of components) {
    const prop = c.component.prop;
    const present = new Set(dataRowsOf(c).flatMap((row) => Object.keys(row)));
    const column = columnAliasesOf(c);

    // 表格类：模板默认列与自造数据必然对不上，必须自己声明列
    if (column.kind === "bad") {
      problems.push(`${c.id}/${prop} 的 option.column 列定义不合法：${column.detail}`);
      continue;
    }
    if (column.kind === "ok") {
      const missing = column.aliases.filter((k) => !present.has(k));
      if (missing.length > 0) {
        problems.push(`${c.id}/${prop} 的 option.column 声明了 ${missing.join("、")}，data 里没有`);
      }
      continue;
    }

    const expected = remarkKeysOf(c);
    // 模板默认列存在、组件却是表格形态（data 键与默认列完全不沾边）时，说明该设 column 没设
    const missing = expected.filter((k) => !present.has(k));
    const extra = [...present].filter((k) => !expected.includes(k));
    if (missing.length > 0 || extra.length > 0) {
      problems.push(
        `${c.id}/${prop} 期望 [${expected.join("、")}]，实得 [${[...present].join("、")}]` +
          (missing.length > 0 ? `（缺 ${missing.join("、")}）` : "")
      );
    }
  }

  return [
    {
      name: "组件数据的字段与各自 schema 对齐",
      passed: problems.length === 0,
      detail: problems.length === 0 ? `${components.length} 个带数据的组件全部对齐` : problems.join("；")
    }
  ];
};

/**
 * 每个分组都必须 `isOuter: true`。
 *
 * 这个字段只在**渲染时**起作用，工作区里看不出任何异常——所以它是 harness 最容易漏掉的一类：
 *
 *     Group.vue: left: item.left - (groupData.isOuter ? groupData.left : 0)
 *
 * 分组里子组件的 left/top 存的是画布绝对坐标；`isOuter` 为 false 时渲染不减分组偏移，
 * 而分组容器本身已经绝对定位，绝对坐标被再叠一次，整组内容偏出一个分组左上角。
 * 实测就是这么错的：磁盘上分组与子组件的 left/top/宽高逐字段一致、全部等于求解值，
 * 断言也全绿，画布上却是「分组位置对、里面的组件全偏」。
 *
 * 判据取产品自己导出的分组（`fixtures/a-group.json` 里 4177 是 `isOuter: true`），
 * 而 Module 模板（moduleId 75）的默认值是 false——照模板建就会踩中。
 */
export const groupsAreOuter = (screen: ParsedLargeScreenInfo): Assertion[] => {
  const groups = flattenLayers(screen.layers).filter((c) => c.component.prop === "sw-folder");
  if (groups.length === 0) {
    return [];
  }
  const bad = groups.filter((c) => (c as unknown as { isOuter?: boolean }).isOuter !== true);

  return [
    {
      name: "分组都标了 isOuter（否则子组件渲染时会整体偏移）",
      passed: bad.length === 0,
      detail:
        bad.length === 0
          ? `${groups.length} 个分组都是 isOuter: true`
          : `${bad.map((c) => `${c.id}/${c.name}`).join("、")} 的 isOuter 不是 true`
    }
  ];
};

/**
 * 单值指标类组件（data 只有一个 `value`）必须在 option 里给出文字标签。
 *
 * 抓的是实测过的一个哑失败：翻牌器的 schema 只有 `{ value }`，标签得写进 option 的
 * 前后缀文本；模型只改了颜色没写标签，于是一排 KPI 卡渲染成三个光秃秃的数字，
 * 结构断言全绿、数据断言也全绿，但没人知道那些数字是什么。
 */
export const kpiHasLabel = (screen: ParsedLargeScreenInfo): Assertion[] => {
  const kpis = dataBearing(screen).filter((c) => {
    const keys = remarkKeysOf(c);
    return keys.length === 1 && keys[0] === "value";
  });

  if (kpis.length === 0) {
    return [];
  }

  const naked = kpis.filter((c) => {
    const o = optionOf(c);
    return !Object.entries(o).some(
      ([k, v]) => /text|title|name|unit/iu.test(k) && typeof v === "string" && v.trim().length > 0
    );
  });

  return [
    {
      name: "单值指标都带文字标签",
      passed: naked.length === 0,
      detail:
        naked.length === 0
          ? `${kpis.length} 个单值指标都配了标签`
          : `${naked.map((c) => `${c.id}/${c.component.prop}`).join("、")} 只有裸数字，option 里没有任何文字`
    }
  ];
};
