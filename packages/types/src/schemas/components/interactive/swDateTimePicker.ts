import { z } from "zod";

/**
 * 时间范围选择器 (ftDateTimePicker)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `startTime` - 开始时间
 * - `endTime` - 结束时间
 *
 * @example
 * ```typescript
 * const data: ftDateTimePickerData = [
 *   { startTime: "2023-01-01 00:00:00", endTime: "2023-02-01 00:00:00" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const swDateTimePickerDataItemSchema = z.object({
  startTime: z.string().describe("开始时间"),
  endTime: z.string().describe("结束时间")
});

export const swDateTimePickerDataSchema = z.array(swDateTimePickerDataItemSchema);
export type ftDateTimePickerData = z.infer<typeof swDateTimePickerDataSchema>;

/**
 * 时间范围选择器配置选项 Schema
 */
export const swDateTimePickerOptionSchema = z.object({
  type: z.string().describe("选择器类型"),
  fontFamily: z.string().describe("字体族"),
  fontSize: z.number().describe("字体大小"),
  color: z.string().describe("字体颜色"),
  fontStyle: z.string().describe("字体样式"),
  fontWeight: z.string().describe("字体粗细"),
  letterSpacing: z.number().describe("字间距"),
  lineHeight: z.number().describe("行高"),
  dateFormat: z.string().describe("日期格式"),
  timeFormat: z.string().describe("时间格式"),
  startTime: z.string().describe("默认开始时间"),
  endTime: z.string().describe("默认结束时间"),
  textAlign: z.string().describe("文本对齐"),
  rangeSeparator: z.string().describe("范围分隔符"),
  backgroundType: z.string().describe("背景类型"),
  backgroundColor: z.string().describe("背景颜色"),
  backgroundColorOpacity: z.number().describe("背景颜色透明度"),
  backgroundImageType: z.string().describe("背景图片类型"),
  backgroundImage: z.string().describe("背景图片"),
  borderColor: z.string().describe("边框颜色"),
  borderWidth: z.number().describe("边框宽度"),
  borderRadius: z.number().describe("边框圆角"),
  calendarShow: z.boolean().describe("是否显示日历"),
  calendarPosition: z.string().describe("日历位置"),
  spacing: z.number().describe("间距"),
  calendarHeight: z.number().describe("日历高度"),
  calendarBackgroundColor: z.string().describe("日历背景颜色"),
  calendarFontFamily: z.string().describe("日历字体族"),
  calendarFontSize: z.string().describe("日历字体大小"),
  calendarColor: z.string().describe("日历字体颜色"),
  calendarFontStyle: z.string().describe("日历字体样式"),
  calendarFontWeight: z.string().describe("日历字体粗细"),
  lineDecorativeColor: z.string().describe("线条装饰颜色"),
  buttonFontFamily: z.string().describe("按钮字体族"),
  buttonFontSize: z.string().describe("按钮字体大小"),
  buttonColor: z.string().describe("按钮字体颜色"),
  buttonFontStyle: z.string().describe("按钮字体样式"),
  buttonFontWeight: z.string().describe("按钮字体粗细")
});

export type ftDateTimePickerOption = z.infer<typeof swDateTimePickerOptionSchema>;
