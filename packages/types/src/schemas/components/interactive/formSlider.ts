import { z } from "zod";

/**
 * 滑块 (formSlider)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 名称
 * - `value` - 数值
 *
 * @example
 * ```typescript
 * const data: formSliderData = [
 *   { label: "音量", value: 20 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const formSliderDataItemSchema = z.object({
  label: z.string().describe("名称"),
  value: z.number().describe("数值")
});

export const formSliderDataSchema = z.array(formSliderDataItemSchema);
export type formSliderData = z.infer<typeof formSliderDataSchema>;

/**
 * 滑块配置选项 Schema
 */
export const formSliderOptionSchema = z.object({
  size: z.number().describe("滑块轨道大小"),
  min: z.number().describe("最小值"),
  max: z.number().describe("最大值"),
  step: z.number().describe("步长"),
  changeType: z.string().describe("变化类型"),
  pointSize: z.number().describe("滑块按钮大小"),
  pointColor: z.string().describe("滑块按钮颜色"),
  paddingTop: z.number().describe("上内边距"),
  paddingLeft: z.number().describe("左内边距"),
  backgroundImage: z.string().describe("背景图片"),
  backgroundSize: z.string().describe("背景图片大小"),
  showLabel: z.boolean().describe("是否显示标签"),
  showValue: z.boolean().describe("是否显示数值"),
  showStops: z.boolean().describe("是否显示间断点"),
  vertical: z.boolean().describe("是否垂直方向"),
  disabled: z.boolean().describe("是否禁用"),
  range: z.boolean().describe("是否范围选择"),
  activeColor: z.string().describe("激活颜色"),
  defaultColor: z.string().describe("默认颜色"),
  fontColor: z.string().describe("字体颜色"),
  fontSize: z.number().describe("字体大小"),
  letterSpacing: z.number().describe("字间距"),
  fontWeight: z.boolean().describe("字体加粗"),
  fontFamily: z.string().describe("字体族"),
  fontStyle: z.boolean().describe("字体斜体"),
  textTranslateX: z.number().describe("文本X偏移"),
  textTranslateY: z.number().describe("文本Y偏移"),
  isTextShadow: z.boolean().describe("是否显示文本阴影"),
  textShadow: z.object({
    color: z.string(),
    x: z.number(),
    y: z.number(),
    blur: z.number(),
    extend: z.number()
  }).passthrough().optional().describe("文本阴影配置"),
  fontPaddingTop: z.number().describe("字体上内边距"),
  fontPaddingLeft: z.number().describe("字体左内边距"),
  seriesBgColor: z.string().describe("轨道背景色"),
  seriesOpacity: z.number().describe("轨道透明度"),
  highlightArea: z.string().describe("高亮区域"),
  borderRadius: z.number().describe("轨道圆角"),
  pointBorderColor: z.string().describe("滑块按钮边框颜色"),
  pointType: z.string().describe("滑块按钮类型"),
  pointImage: z.string().describe("滑块按钮图片")
});

export type formSliderOption = z.infer<typeof formSliderOptionSchema>;
