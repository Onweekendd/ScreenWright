import { z } from "zod";

/**
 * 进度条表格 (ftProgress)
 * 文字
 *
 * ## 数据结构
 *
 * 数据为动态键值对记录，键由 column 配置定义，数值列通常为 0~1 之间的小数。
 *
 * @example
 * ```typescript
 * const data: FtProgressData = [
 *   { 地区: "深圳", 小学: 0.089, 初中: 0.441, "高中（含中专）": 0.239, "大学及以上（含大专）": 0.176 }
 * ];
 * ```
 */

// 单个数据项的 Schema（动态键值对）
const swProgressDataItemSchema = z.record(z.string(), z.union([z.string(), z.number()]));

// 数据数组 Schema
export const swProgressDataSchema = z.array(swProgressDataItemSchema);

export type FtProgressData = z.infer<typeof swProgressDataSchema>;

// 列定义 Schema
const swProgressColumnSchema = z.object({
  name: z.string(),
  alias: z.string(),
  icon: z.string().optional()
});

/**
 * 进度条表格配置选项 Schema
 */
export const swProgressOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean(),
  columnShow: z.boolean(),
  columnViews: z.boolean(),
  animationShow: z.boolean(),
  cursorShow: z.boolean(),
  align: z.string(),
  header: z.boolean(),
  scroll: z.boolean(),
  scrollTime: z.number(),
  fontSize: z.number(),
  count: z.number(),
  lineMarginBottom: z.number(),
  index: z.boolean(),
  scrollCount: z.number(),

  // ============ 表头配置 ============
  headerHeight: z.number(),
  headerFontSize: z.number(),
  headerFontFamily: z.string(),
  headerlineHeight: z.number(),
  backgroundType: z.string(),
  backgroundImage: z.string(),
  headerletterSpacing: z.number(),
  headerFontStyle: z.string(),
  headerFontWeight: z.string(),
  headerBackground: z.string(),
  headerColor: z.string(),
  headerShow: z.boolean(),
  headerTextAlign: z.string(),

  // ============ 列定义 ============
  column: z.array(swProgressColumnSchema),

  // ============ 选中配置 ============
  selectedShow: z.boolean(),
  selectedFontSize: z.number(),
  selectedFontFamily: z.string(),
  selectedletterSpacing: z.number(),
  selectedFontStyle: z.string(),
  selectedFontWeight: z.string(),
  selectedColor: z.string(),
  selectedlineHeight: z.number(),
  selectedMode: z.string(),
  selectedBgType: z.string(),
  selectedBgColor: z.string(),
  selectedBgOpacity: z.number(),
  selectedBgImage: z.string(),

  // ============ 阴影配置 ============
  shadowShow: z.boolean(),
  shadowColor: z.string(),
  shadowX: z.number(),
  shadowY: z.number(),
  shadowFuzzy: z.number(),
  shadowExtension: z.number(),

  // ============ 行序号配置 ============
  rowName: z.array(z.string()),
  rowTitle: z.string(),
  initialValue: z.number(),
  rowWidth: z.number(),
  rowSpace: z.number(),
  rowAlign: z.string(),
  rowKey: z.array(z.string()),
  rowOffsetX: z.array(z.number()),
  rowOffsetY: z.array(z.number()),
  rowBgWidth: z.array(z.number()),
  rowBgHeight: z.array(z.number()),
  rowBgType: z.array(z.string()),
  rowBgColor: z.array(z.string()),
  rowBgOpacity: z.array(z.number()),
  rowBgImage: z.array(z.string()),
  rowFontSize: z.array(z.number()),
  rowFontFamily: z.array(z.string()),
  rowletterSpacing: z.array(z.number()),
  rowFontStyle: z.array(z.string()),
  rowFontWeight: z.array(z.string()),
  rowColor: z.array(z.string()),
  rowlineHeight: z.array(z.number()),
  rowShow: z.boolean(),

  // ============ 主体配置 ============
  bodyBackground: z.string(),
  bodyColor: z.string(),
  borderColor: z.string(),
  bodyTextAlign: z.string(),
  nthColor: z.string(),
  othColor: z.string(),

  // ============ 行样式(X轴) ============
  seriesXTabsName: z.array(z.string()),
  seriesXbackgroundType: z.array(z.string()),
  seriesXbackgroundImage: z.array(z.string()),
  seriesXBackground: z.array(z.string()),
  seriesXBorderColor: z.array(z.string()),
  seriesXBorderWidth: z.array(z.number()),
  seriesXRadius: z.array(z.number()),
  seriesXOffsetX: z.array(z.number()),

  // ============ 列样式(Y轴) ============
  seriesYWidth: z.array(z.number()),
  seriesYMarginLeft: z.array(z.number()),
  seriesYbackgroundImage: z.array(z.string()),
  seriesYBackground: z.array(z.string()),
  seriesYBorderColor: z.array(z.string()),
  seriesYBorderWidth: z.array(z.number()),
  seriesYFontSize: z.array(z.number()),
  seriesYFontFamily: z.array(z.string()),
  seriesYletterSpacing: z.array(z.number()),
  seriesYFontStyle: z.array(z.string()),
  seriesYFontWeight: z.array(z.string()),
  seriesYColor: z.array(z.string()),
  seriesYContentType: z.array(z.string()),
  seriesYTextAlign: z.array(z.string()),
  seriesYOverFlow: z.array(z.string()),
  seriesYlineHeight: z.array(z.number()),
  seriesYOffsetX: z.array(z.number()),
  seriesYOffsetY: z.array(z.number()),
  seriesYTabsName: z.array(z.string()),

  // ============ 列图片配置 ============
  maskImage: z.array(z.string()),
  imageWidth: z.array(z.number()),
  imageHeight: z.array(z.number()),

  // ============ 进度条特有配置 ============
  percentageShow: z.array(z.boolean()),
  decimalSave: z.array(z.number()),

  // ============ 后缀配置 ============
  suffixShow: z.array(z.boolean()),
  thousandSplit: z.array(z.boolean()),
  suffixFontSize: z.array(z.number()),
  suffixFontFamily: z.array(z.string()),
  suffixletterSpacing: z.array(z.number()),
  suffixFontStyle: z.array(z.string()),
  suffixFontWeight: z.array(z.string()),
  suffixColor: z.array(z.string()),
  suffixlineHeight: z.array(z.number()),
  suffixOffsetX: z.array(z.number()),
  suffixOffsetY: z.array(z.number()),
  suffixContent: z.array(z.string()),

  // ============ 状态图标配置 ============
  statusConfigValue: z.array(z.array(z.string())),
  statusConfigImg: z.array(z.array(z.string())),
  statusConfigWidth: z.array(z.array(z.number())),
  statusConfigHeight: z.array(z.array(z.number())),
  statusConfigName: z.array(z.array(z.string())),

  // ============ 样式指定配置 ============
  styleAssignKeyValue: z.array(z.array(z.string())).optional(),
  styleAssignFontFamily: z.array(z.array(z.string())).optional(),
  styleAssignFontSize: z.array(z.array(z.number())).optional(),
  styleAssignHeight: z.array(z.array(z.number())).optional(),
  styleAssignletterSpacing: z.array(z.array(z.number())).optional(),
  styleAssignColor: z.array(z.array(z.string())).optional(),
  styleAssignFontStyle: z.array(z.array(z.string())).optional(),
  styleAssignFontWeight: z.array(z.array(z.string())).optional(),
  styleAssignName: z.array(z.array(z.string())).optional(),
  styleAssignBgImg: z.array(z.array(z.string())).optional(),
  styleAssignBgWdith: z.array(z.array(z.number())).optional(),
  styleAssignBgHeight: z.array(z.array(z.number())).optional(),
  styleAssignBgLeft: z.array(z.array(z.number())).optional()
});

export type FtProgressOption = z.infer<typeof swProgressOptionSchema>;
