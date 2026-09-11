import { z } from "zod";

/**
 * 图标占比图 (iconRatio)
 * 指标
 *
 * ## 数据结构
 *
 * 数据字段:
 * - `name` - 图标标识键值
 * - `value` - 占比值
 *
 * @example
 * ```typescript
 * const data: IconRatioData = [
 *   { name: "men", value: 0.57 },
 *   { name: "women", value: 0.43 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const iconRatioDataItemSchema = z.object({
  name: z.string().describe("图标标识键值"),
  value: z.number().describe("占比值")
});

// 数据数组 Schema（最终导出的类型）
export const iconRatioDataSchema = z.array(iconRatioDataItemSchema);

export type IconRatioData = z.infer<typeof iconRatioDataSchema>;

// 图标列表项的 Schema
const iconListItemSchema = z.object({
  iconKeyValue: z.string().describe("图标对应的键值，与数据name字段匹配"),
  iconFontFamily: z.string().describe("图标字体名称"),
  iconFontSize: z.number().describe("图标字体大小"),
  iconFontStyle: z.string().describe("图标字体样式"),
  iconFontWeight: z.string().describe("图标字体粗细"),
  iconLetterSpacing: z.number().describe("图标字间距"),
  iconColor: z.string().describe("图标颜色"),
  iconLineHeight: z.number().describe("图标行高"),
  iconImgSrc: z.string().describe("图标图片地址"),
  iconImgWidth: z.number().describe("图标图片宽度"),
  iconImgHeight: z.number().describe("图标图片高度"),
  iconTranslateX: z.number().describe("图标X轴偏移"),
  iconTranslateY: z.number().describe("图标Y轴偏移"),
  iconTabsName: z.string().describe("图标标签页名称")
});

// 全局配置的 Schema
const globalConfigSchema = z.object({
  decimalPlace: z.number().describe("小数位数"),
  positionX: z.number().describe("X轴位置偏移"),
  positionY: z.number().describe("Y轴位置偏移"),
  colNum: z.number().describe("列数"),
  rowNum: z.number().describe("行数")
});

/**
 * 图标占比图配置选项 Schema
 */
export const iconRatioOptionSchema = z.object({
  // ============ 全局配置 ============
  globalConfig: globalConfigSchema.describe("全局布局配置"),

  // ============ 图标列表配置 ============
  iconList: z.array(iconListItemSchema).describe("图标列表，每项对应一个数据系列")
});

export type IconRatioOption = z.infer<typeof iconRatioOptionSchema>;
