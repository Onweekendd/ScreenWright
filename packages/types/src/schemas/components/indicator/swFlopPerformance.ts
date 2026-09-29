import { z } from "zod";

/**
 * 翻牌器 (ftFlopPerformance)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: ftFlopPerformanceData = [
 *   { value: 12345 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swFlopPerformanceDataItemSchema = z.object({
  value: z.number().describe("数值")
});

// 数据数组 Schema
export const swFlopPerformanceDataSchema = z.array(swFlopPerformanceDataItemSchema);

export type ftFlopPerformanceData = z.infer<typeof swFlopPerformanceDataSchema>;

/**
 * 翻牌器配置选项 Schema
 */
export const swFlopPerformanceOptionSchema = z.object({
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
  type: z.string().describe("翻牌器类型，如 img、border"),
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
  color: z.string().describe("数字颜色"),
  fontLinearColor: z.string().describe("数字渐变颜色"),
  fontWeight: z.string().describe("数字字体粗细"),
  fontStyle: z.string().describe("数字字体样式"),
  textAlign: z.string().describe("数字文本对齐方式"),

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
  incrementFrequency: z.number().describe("递增频率"),
  randomRange: z.number().describe("随机波动范围"),

  // ============ 渐变色开关（渲染代码实际读取，此前 schema 缺失） ============
  setFontLinear: z.boolean().optional().describe("是否启用数字渐变色，不开启则 fontLinearColor 不生效"),
  suffixSetFontLinear: z.boolean().optional().describe("是否启用后缀渐变色，不开启则 suffixFontLinearColor 不生效"),
  suffixFontLinearColor: z.string().optional().describe("后缀渐变颜色"),

  // ============ 整页翻牌 / 阴影 / 间距 / 延迟加载（渲染代码实际读取，此前 schema 缺失） ============
  duration: z.number().optional().describe("整页翻牌（whole=true）时的动画时长"),
  shadowShow: z.boolean().optional().describe("是否显示阴影，不开启则 shadowColor 等字段不生效"),
  shadowColor: z.string().optional().describe("阴影颜色"),
  shadowX: z.number().optional().describe("阴影水平偏移"),
  shadowY: z.number().optional().describe("阴影垂直偏移"),
  shadowFuzzy: z.number().optional().describe("阴影模糊度"),
  padding: z.number().optional().describe("内边距"),
  delayLoading: z.boolean().optional().describe("是否启用延迟加载，不开启则 delayTime 不生效"),
  delayTime: z.number().optional().describe("延迟加载秒数")
});

export type ftFlopPerformanceOption = z.infer<typeof swFlopPerformanceOptionSchema>;

/**
 * 开关字段联动检查——不揉进 `swFlopPerformanceOptionSchema` 本体，只在运行时校验入口（见
 * `componentSuperRefineMap`）挂上，避免真实历史数据（比如只填了 fontLinearColor、
 * setFontLinear 干脆没这个键的旧组件）被当成"类型不对"而拖累 schema 一致性测试。
 *
 * 每条规则对应 useSwFlop.ts 里"值存在但对应开关未开，视觉上不生效"的情况：
 * fontLinearColor / setFontLinear、suffixFontLinearColor / suffixSetFontLinear、
 * shadowColor 等阴影字段 / shadowShow、delayTime / delayLoading。
 */
export function swFlopPerformanceSuperRefine(
  val: { option?: Partial<ftFlopPerformanceOption> },
  ctx: z.RefinementCtx
): void {
  const option = val.option;
  if (!option) {
    return;
  }
  if (option.fontLinearColor && !option.setFontLinear) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["option", "setFontLinear"],
      message: "配置了 fontLinearColor 但 setFontLinear 未开启，数字渐变色不会生效"
    });
  }
  if (option.suffixFontLinearColor && !option.suffixSetFontLinear) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["option", "suffixSetFontLinear"],
      message: "配置了 suffixFontLinearColor 但 suffixSetFontLinear 未开启，后缀渐变色不会生效"
    });
  }
  if (option.shadowColor && !option.shadowShow) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["option", "shadowShow"],
      message: "配置了阴影相关字段但 shadowShow 未开启，阴影不会生效"
    });
  }
  if (option.delayTime && !option.delayLoading) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["option", "delayLoading"],
      message: "配置了 delayTime 但 delayLoading 未开启，延迟加载不会生效"
    });
  }
}
