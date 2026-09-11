import { z } from "zod";

/**
 * 翻牌器v2 (ft-countup-v2)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: ftCountupV2Data = [
 *   { value: 12345 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swCountupV2DataItemSchema = z.object({
  value: z.number().describe("数值")
});

// 数据数组 Schema
export const swCountupV2DataSchema = z.array(swCountupV2DataItemSchema);

export type ftCountupV2Data = z.infer<typeof swCountupV2DataSchema>;

/**
 * 翻牌器v2配置选项 Schema
 */
export const swCountupV2OptionSchema = z.object({
  // ============ 播放配置 ============
  autoplay: z.boolean().describe("是否自动播放翻牌动画"),
  intervalTime: z.number().describe("翻牌动画间隔时间"),
  whole: z.boolean().describe("是否整页翻牌"),
  decimals: z.number().describe("小数位数"),
  span: z.number().describe("翻牌间隔"),
  splitx: z.number().describe("水平分割间距"),
  splity: z.number().describe("垂直分割间距"),
  letterSpace: z.number().describe("字间距"),
  useGrouping: z.boolean().describe("是否使用千分位分组"),
  makeComplete: z.boolean().describe("是否补齐位数"),
  completeCount: z.number().describe("补齐后的总位数"),

  // ============ 类型与边框配置 ============
  type: z.string().describe("翻牌器类型，如 border、img"),
  pointSize: z.number().describe("小数点大小"),
  borderColor: z.string().describe("边框颜色"),
  borderTopWidth: z.number().describe("上边框宽度"),
  borderBottomWidth: z.number().describe("下边框宽度"),
  borderLeftWidth: z.number().describe("左边框宽度"),
  borderRightWidth: z.number().describe("右边框宽度"),
  backgroundBorder: z.string().describe("背景边框图片"),
  backgroundColor: z.string().describe("背景颜色"),
  backgroundImage: z.string().describe("背景图片"),

  // ============ 字体配置 ============
  fontFamily: z.string().describe("数字字体"),
  fontSize: z.number().describe("数字字体大小"),
  spanWidth: z.number().describe("单个数字宽度"),
  spanHeight: z.number().describe("单个数字高度"),
  spanMangin: z.number().describe("数字间距"),
  color: z.string().describe("数字颜色"),
  fontLinearColor: z.string().describe("数字渐变颜色"),
  fontWeight: z.string().describe("数字字体粗细"),
  fontStyle: z.string().describe("数字字体样式"),

  // ============ 前缀配置 ============
  prefixInline: z.string().describe("前缀显示方式，如 block、inline-block"),
  prefixText: z.string().describe("前缀文本内容"),
  prefixTextAlign: z.string().describe("前缀文本对齐方式"),
  prefixSplitx: z.number().describe("前缀水平间距"),
  prefixSplity: z.number().describe("前缀垂直间距"),
  prefixFontFamily: z.string().describe("前缀字体"),
  prefixFontSize: z.number().describe("前缀字体大小"),
  prefixColor: z.string().describe("前缀颜色"),
  prefixFontWeight: z.string().describe("前缀字体粗细"),
  prefixFontStyle: z.string().describe("前缀字体样式"),

  // ============ 后缀配置 ============
  suffixInline: z.string().describe("后缀显示方式，如 block、inline-block"),
  suffixText: z.string().describe("后缀文本内容"),
  suffixTextAlign: z.string().describe("后缀文本对齐方式"),
  suffixSplitx: z.number().describe("后缀水平间距"),
  suffixSplity: z.number().describe("后缀垂直间距"),
  suffixFontFamily: z.string().describe("后缀字体"),
  suffixFontSize: z.number().describe("后缀字体大小"),
  suffixColor: z.string().describe("后缀颜色"),
  suffixFontWeight: z.string().describe("后缀字体粗细"),
  suffixFontStyle: z.string().describe("后缀字体样式"),

  // ============ 自增配置 ============
  autoIncrement: z.boolean().describe("是否启用自动递增"),
  incrementTotal: z.number().describe("递增总数"),
  incrementFrequency: z.number().describe("递增频率"),
  randomRange: z.number().describe("随机波动范围")
});

export type ftCountupV2Option = z.infer<typeof swCountupV2OptionSchema>;
