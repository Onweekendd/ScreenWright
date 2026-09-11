import { z } from "zod";

/**
 * 文本框/跑马灯/超链接 (fttext)
 * 文字
 *
 * 通过 option.type 区分三种模式:
 * - "text" — 文本框（静态文本展示）
 * - "marquee" — 跑马灯（文字滚动）
 * - "link" — 超链接（可点击跳转）
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `value` - 文本内容
 *
 * @example
 * ```typescript
 * const data: FtTextData = [
 *   { value: "大屏标题文字" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swTextDataItemSchema = z.object({
  value: z.string().describe("文本内容")
});

// 数据数组 Schema
export const swTextDataSchema = z.array(swTextDataItemSchema);

export type FtTextData = z.infer<typeof swTextDataSchema>;

// ==================== Option Schema ====================

// 渐变色对象（与 lineargradientHandle 的 LinearGradient 结构一致）
const linearGradientSchema = z.object({
  type: z.string().describe("渐变类型(linear-gradient)"),
  angle: z.string().describe("渐变角度(deg)"),
  colors: z
    .array(
      z.object({
        color: z.string().describe("色标颜色"),
        per: z.number().describe("色标位置(0-100)")
      })
    )
    .describe("色标列表")
});

// 多渐变色项（与 SwMultiGradient/TextMultiGradient 的 GradientItem 结构一致）
const multiGradientItemSchema = z.object({
  id: z.string().describe("图层唯一标识"),
  color: z.string().describe("图层颜色/背景值"),
  opacity: z.number().describe("图层透明度(0-100)"),
  isShowColor: z.boolean().describe("是否显示该图层")
});

/**
 * 文本框/跑马灯/超链接配置选项 Schema
 */
export const swTextOptionSchema = z
  .object({
    // ============ 类型配置 ============
    type: z.enum(["text", "marquee", "link"]).describe("组件类型(text文本框/marquee跑马灯/link超链接)").optional(),

    // ============ 超链接配置 ============
    link: z.boolean().describe("是否为超链接").optional(),
    linkHref: z.string().describe("链接地址").optional(),
    linkTarget: z.string().describe("链接打开方式(_self/_blank)").optional(),
    pointerEvents: z.boolean().describe("是否响应鼠标事件").optional(),

    // ============ 排版配置 ============
    writingMode: z.string().describe("书写模式(horizontal-tb/vertical-rl/vertical-lr)").optional(),
    textOrientation: z.string().describe("文本方向").optional(),
    iswrap: z.boolean().describe("是否换行").optional(),

    // ============ 字体配置 ============
    fontFamily: z.string().describe("字体").optional(),
    fontSize: z.number().describe("字号").optional(),
    color: z.string().describe("字体颜色").optional(),
    fontWeight: z.coerce.string().describe("字重").optional(),
    fontStyle: z.string().describe("字体样式").optional(),
    lineHeight: z.number().describe("行高(px)").optional(),

    // ============ 选中文字配置 ============
    selectedTextType: z
      .enum(["normal", "gradient", "multiGradient"])
      .describe("选中文字类型(normal纯色/gradient渐变/multiGradient多渐变)")
      .optional(),
    selectedTextColor: z
      .union([z.string(), linearGradientSchema])
      .describe("选中文字颜色(纯色/渐变字符串/渐变对象)")
      .optional(),
    selectedTextOpacity: z.number().describe("选中文字透明度(0-100)").optional(),
    multiGradientColors: z
      .array(multiGradientItemSchema)
      .describe("多渐变图层列表(selectedTextType=multiGradient 时生效)")
      .optional(),

    // ============ 布局配置 ============
    textAlign: z.string().describe("水平对齐(left/center/right)").optional(),
    textAlignVertical: z.string().describe("垂直对齐(top/center/bottom)").optional(),
    split: z.number().describe("字间距").optional(),
    backgroundColor: z.string().describe("背景颜色").optional(),

    // ============ 文字阴影配置 ============
    shadowShow: z.boolean().describe("文字阴影开关").optional(),
    shadowColor: z.string().describe("阴影颜色").optional(),
    shadowX: z.number().describe("阴影X偏移").optional(),
    shadowY: z.number().describe("阴影Y偏移").optional(),
    shadowFuzzy: z.number().describe("阴影模糊度").optional(),
    shadowExtension: z.number().describe("阴影扩展").optional(),

    // ============ 透明度与变换 ============
    opacity: z.number().describe("透明度(0-1)").optional(),
    rotateX: z.number().describe("X轴旋转").optional(),
    rotateY: z.number().describe("Y轴旋转").optional(),
    rotateZ: z.number().describe("Z轴旋转").optional()
  })
  .strict();

export type FtTextOption = z.infer<typeof swTextOptionSchema>;
