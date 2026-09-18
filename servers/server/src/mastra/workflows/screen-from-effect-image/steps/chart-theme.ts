/**
 * 图表落地前的两处「代码兜底」，都是模型造数据时**填不对也不该让它填**的字段：
 *
 * 1. **系列名对齐**：echarts 类组件的图例/系列色是按下标跟 `dataSeriesName[i]` 对应的
 *    （`Echartline.ts`：`seriesName[idx] = option.seriesTabsName[index].value`），模型只改 data 里的
 *    `seriesName`，`seriesTabsName` 还是模板默认的「系列一」，图例就露馅（screen_23 三张图全中）。
 *    这里按 data 实际出现的系列重写这三个数组，单系列顺手把图例关掉——效果图里单系列图都没图例。
 * 2. **配色**：模板默认蓝紫渐变，和青色系的效果图放一起每张图都在打架。vision 从效果图取的
 *    palette 由这里写进各 prop 的系列色字段——颜色对象（渐变 + picker 字符串成对）结构太琐碎，
 *    让模型填只会填错一半，代码按 prop 写死映射。
 *
 * 3. **形态开关**：vision 读到的平滑/数值标签/图例（`ChartSpec`）也是布尔数组按系列下标存的，模型更填不对，这里写。
 *
 * 翻牌器额外把 `prefixText` 清空：卡片标题已经是独立富文本，再显示「翻牌器标题」就是两行标题。
 */
import type { ChartSpec } from "../types";

type OptionPatch = Record<string, unknown>;
type DataRow = Record<string, unknown>;

/** 渐变终点比起点亮多少（往白色混），与模板默认渐变的明暗差大致相当 */
const GRADIENT_LIGHTEN = 0.45;

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16)
];

const rgbToHex = ([r, g, b]: [number, number, number]): string =>
  `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

const lighten = (hex: string, amount: number): string =>
  rgbToHex(hexToRgb(hex).map((c) => c + (255 - c) * amount) as [number, number, number]);

const rgba = (hex: string): string => `rgba(${hexToRgb(hex).join(",")},1)`;

/** 模板里渐变是「对象 + 同款 css 字符串」成对存的（对象给渲染用，字符串给取色器回显），两个都得写 */
const gradientPair = (hex: string, angle: "0" | "90") => {
  const light = lighten(hex, GRADIENT_LIGHTEN);
  return {
    object: {
      type: "linear-gradient",
      angle,
      colors: [
        { color: rgba(hex), per: 0 },
        { color: rgba(light), per: 100 }
      ]
    },
    picker: `linear-gradient(${angle}.0deg,${hex} 0.0,${light} 100.0%)`
  };
};

const colorAt = (palette: string[], i: number): string => palette[i % palette.length];

/** data 里出现过的系列名，按首次出现顺序（图例顺序 = 模型造数据的顺序） */
export const distinctSeriesNames = (data: DataRow[]): string[] => {
  const seen = new Set<string>();
  for (const row of data) {
    const name = row.seriesName;
    if (typeof name === "string" && name) {
      seen.add(name);
    }
  }
  return [...seen];
};

/** 模板里 `legendShow` 是全局布尔的图表；饼图模板默认关图例且图例形态特殊，只在 spec 明说时才动 */
const ECHARTS_WITH_LEGEND = new Set([
  "echartline",
  "echartareaLine",
  "echartbar",
  "echartstripBar",
  "echartscatter",
  "echartradar",
  "echartfunnel"
]);
/** 平滑 / 数值标签按系列下标存布尔数组的图表 */
const LINE_LIKE = new Set(["echartline", "echartareaLine"]);

const seriesNamePatch = (prop: string, data: DataRow[], spec: ChartSpec | undefined): OptionPatch => {
  const names = distinctSeriesNames(data);
  if (names.length === 0) {
    return {};
  }
  const legendShow = spec?.showLegend ?? names.length > 1;
  const touchLegend = ECHARTS_WITH_LEGEND.has(prop) || (prop === "echartpie" && spec?.showLegend !== undefined);
  return {
    dataSeriesName: names,
    seriesName: names,
    seriesTabsName: names.map((value, i) => ({ name: `系列${i + 1}`, value })),
    ...(touchLegend ? { legendShow } : {})
  };
};

const shapePatch = (prop: string, data: DataRow[], spec: ChartSpec | undefined): OptionPatch => {
  if (!spec || !LINE_LIKE.has(prop)) {
    return {};
  }
  const n = Math.max(distinctSeriesNames(data).length, 1);
  const fill = (v: boolean) => Array.from({ length: n }, () => v);
  return {
    ...(spec.smooth !== undefined ? { seriesSmoothShow: fill(spec.smooth) } : {}),
    ...(spec.showLabel !== undefined ? { seriesLabelShow: fill(spec.showLabel) } : {})
  };
};

const colorPatch = (prop: string, data: DataRow[], palette: string[]): OptionPatch => {
  const seriesCount = Math.max(distinctSeriesNames(data).length, 1);
  const seriesColors = Array.from({ length: seriesCount }, (_, i) => colorAt(palette, i));
  switch (prop) {
    case "echartline": {
      const pairs = seriesColors.map((c) => gradientPair(c, "0"));
      return {
        seriesLineColor: seriesColors,
        seriesItemColor: seriesColors,
        seriesColor: pairs.map((p) => p.object),
        seriesColorpicker: pairs.map((p) => p.picker)
      };
    }
    case "echartareaLine": {
      // 面积图的 seriesColor 是 echarts 原生 linear 对象（与折线图不同形），不碰；线/点/面积填充三个字段够定色
      const pairs = seriesColors.map((c) => gradientPair(c, "0"));
      return {
        seriesLineColor: seriesColors,
        seriesItemColor: seriesColors,
        seriesAreaColor: pairs.map((p) => p.object)
      };
    }
    case "echartscatter":
      return { seriesColor: seriesColors };
    case "echartradar":
      return {
        seriesLineColor: seriesColors.map(rgba),
        seriesItemColor: seriesColors.map(rgba),
        seriesAreaColor: seriesColors.map((c) => `rgba(${hexToRgb(c).join(",")},0.2)`)
      };
    case "echartfunnel":
      // 漏斗一行数据一层，seriesColor 按行给
      return { seriesColor: data.map((_, i) => colorAt(palette, i)) };
    case "echartbar":
    case "echartstripBar": {
      // 柱状图渐变从下往上、条形图从左往右，与模板默认的 angle 保持一致
      const pairs = seriesColors.map((c) => gradientPair(c, prop === "echartbar" ? "0" : "90"));
      return { seriesColor: pairs.map((p) => p.object), seriesColorpicker: pairs.map((p) => p.picker) };
    }
    case "echartpie":
      // 饼图一行数据一个扇区，seriesColor 按行给
      return { seriesColor: data.map((_, i) => colorAt(palette, i)) };
    case "swFlopPerformance":
      return { color: rgba(palette[0]), suffixColor: rgba(palette[0]) };
    default:
      return {};
  }
};

/**
 * 返回要**叠加**到模型输出 option 上的补丁（下游 `assembleScreen` 再把它合并进模板）。
 * 后写的键覆盖前面的：模型给的 → 系列名对齐 → 形态开关 → 配色，模型对这几件事的意见不作数。
 */
export const chartThemePatch = (
  prop: string,
  data: DataRow[],
  palette: string[] | undefined,
  spec?: ChartSpec
): OptionPatch => ({
  ...seriesNamePatch(prop, data, spec),
  ...shapePatch(prop, data, spec),
  ...(palette && palette.length > 0 ? colorPatch(prop, data, palette) : {}),
  ...(prop === "swFlopPerformance" ? { prefixText: "" } : {})
});
