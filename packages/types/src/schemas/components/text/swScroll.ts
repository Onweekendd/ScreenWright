import { z } from "zod";

/**
 * 轮播表格 (ftScroll)
 * 文字
 *
 * ## 数据结构
 *
 * 数据为动态键值对记录，键由 column 配置定义。
 *
 * @example
 * ```typescript
 * const data: FtScrollData = [
 *   { accidentType: "car", status: "已解决", time: "07:33:40", content: "左侧OBU无响应" }
 * ];
 * ```
 */

// 单个数据项的 Schema（动态键值对，isSelected 为内部选中状态标记）
const swScrollDataItemSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

// 数据数组 Schema
export const swScrollDataSchema = z.array(swScrollDataItemSchema);

export type FtScrollData = z.infer<typeof swScrollDataSchema>;

// 列定义 Schema
const swScrollColumnSchema = z.object({
  name: z.string(),
  alias: z.string(),
  icon: z.string().optional()
});

// 进度条配置 Schema
const swScrollProgressYConfigItemSchema = z.object({
  type: z.string(),
  "text-inside": z.boolean(),
  status: z.string(),
  indeterminate: z.boolean(),
  duration: z.number(),
  showText: z.boolean(),
  "stroke-linecap": z.string(),
  striped: z.boolean(),
  color: z.string(),
  outerBgColor: z.string(),
  linearGradientColor: z.string(),
  fontFamily: z.string(),
  fontSize: z.number(),
  fontColor: z.string(),
  fontStyle: z.string(),
  fontWeight: z.string(),
  borderRadius: z.number(),
  commonColor: z.string()
});

/**
 * 轮播表格配置选项 Schema
 */
export const swScrollOptionSchema = z.object({
  // ============ 基础配置 ============
  refresh: z.boolean(),
  columnShow: z.boolean(),
  columnViews: z.boolean(),
  animationShow: z.boolean(),
  cursorShow: z.boolean(),
  textStyleShow: z.boolean(),
  align: z.string(),
  header: z.boolean(),
  scroll: z.boolean(),
  scrollTime: z.number(),
  scrollTimeType: z.boolean().optional(),
  scrollSingleTime: z.number().optional(),
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
  borderShow: z.boolean(),
  backgroundType: z.string(),
  backgroundImage: z.string(),
  headerletterSpacing: z.number(),
  headerFontStyle: z.string(),
  headerFontWeight: z.string(),
  headerBackground: z.string(),
  headerColor: z.string(),
  activeKeys: z.string().optional(),
  headerShow: z.boolean(),
  headerTextAlign: z.string(),

  // ============ 列定义 ============
  column: z.array(swScrollColumnSchema),

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
  styleAssignKeyValue: z.array(z.array(z.string())),
  styleAssignFontFamily: z.array(z.array(z.string())),
  styleAssignFontSize: z.array(z.array(z.number())),
  styleAssignHeight: z.array(z.array(z.number())),
  styleAssignletterSpacing: z.array(z.array(z.number())),
  styleAssignColor: z.array(z.array(z.string())),
  styleAssignFontStyle: z.array(z.array(z.string())),
  styleAssignFontWeight: z.array(z.array(z.string())),
  styleAssignName: z.array(z.array(z.string())),
  styleAssignBgImg: z.array(z.array(z.string())),
  styleAssignBgWdith: z.array(z.array(z.number())),
  styleAssignBgHeight: z.array(z.array(z.number())),
  styleAssignBgLeft: z.array(z.array(z.number())),

  // ============ 全局滚动条配置（可选，旧版数据可能缺失） ============
  globalScrollYTrackWidth: z.number().optional(),
  globalScrollYTrackBackground: z.string().optional(),
  globalScrollYTrackBorderRadius: z.number().optional(),
  globalScrollYThumbWidth: z.number().optional(),
  globalScrollYThumbBackground: z.string().optional(),
  globalScrollYThumbBorderRadius: z.number().optional(),

  // ============ 进度条配置 ============
  progressYConfig: z.array(swScrollProgressYConfigItemSchema)
});

export type FtScrollOption = z.infer<typeof swScrollOptionSchema>;
