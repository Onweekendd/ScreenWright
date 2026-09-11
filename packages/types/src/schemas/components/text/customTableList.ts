import { z } from "zod";

/**
 * 自定义列表 (customTableList)
 * 文字
 *
 * ## 数据结构
 *
 * 数据为动态键值对记录，键由 column 配置中的 alias 字段定义。
 *
 * @example
 * ```typescript
 * const data: CustomTableListData = [
 *   { id: "1", 姓名: "张三", 性别: "男", 岗位: "保安", 电话: 13265555444, 考勤班组: "班组1", 状态: "正常" }
 * ];
 * ```
 */

// 单个数据项的 Schema（动态键值对）
const customTableListDataItemSchema = z.record(z.string(), z.union([z.string(), z.number()]));

// 数据数组 Schema
export const customTableListDataSchema = z.array(customTableListDataItemSchema);

export type CustomTableListData = z.infer<typeof customTableListDataSchema>;

// 状态样式对象 Schema（defaultObj/hoverObj/activeObj 共用）
// 字段全部 optional，因为不同列的状态对象可能缺失部分字段
const stateStyleObjSchema = z.object({
  backgroundColor: z.string().nullable().optional(),
  backgroundImage: z.string().optional(),
  backgroundImageType: z.string().optional(),
  backgroundType: z.string().optional(),
  borderColor: z.string().optional(),
  borderLineType: z.string().nullable().optional(),
  borderWidth: z.number().optional(),
  btnBorderShow: z.boolean().optional(),
  btnShadowInBlur: z.number().optional(),
  btnShadowInColor: z.string().nullable().optional(),
  btnShadowInX: z.number().optional(),
  btnShadowInY: z.number().optional(),
  btnShadowOutBlur: z.number().optional(),
  btnShadowOutColor: z.string().nullable().optional(),
  btnShadowOutX: z.number().optional(),
  btnShadowOutY: z.number().optional(),
  btnShadowShow: z.boolean().optional(),
  isTextShadow: z.boolean().optional(),
  seriesYColor: z.string().optional(),
  seriesYFontFamily: z.string().optional(),
  seriesYFontSize: z.number().optional(),
  seriesYFontStyle: z.string().nullable().optional(),
  seriesYFontWeight: z.string().nullable().optional(),
  seriesYLetterSpacing: z.number().optional(),
  seriesYLineHeight: z.number().optional(),
  styleAssignList: z.array(z.any()).nullable().optional(),
  textShadowBlur: z.number().optional(),
  textShadowColor: z.string().optional(),
  textShadowX: z.number().optional(),
  textShadowY: z.number().optional(),
  textTranslateX: z.number().nullable().optional(),
  textTranslateY: z.number().nullable().optional()
});

// 列（内容元素）定义 Schema
const customTableListColumnSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  alias: z.string(),
  icon: z.string().optional(),
  word: z.string().optional(),
  seriesYContentType: z.string(),
  seriesYZIndex: z.number(),
  seriesYOffsetWidth: z.number(),
  seriesYOffsetY: z.number(),
  seriesYOffsetX: z.number(),
  seriesYOffsetHeight: z.number(),
  seriesYFontFamily: z.string(),
  seriesYFontSize: z.number(),
  seriesYColor: z.string(),
  seriesYFontStyle: z.string(),
  seriesYFontWeight: z.string(),
  seriesYTextWritingMode: z.union([z.string(), z.null()]).optional(),
  seriesYLineHeight: z.number(),
  seriesYLetterSpacing: z.number(),
  seriesYTabsName: z.string(),
  seriesYIsMapping: z.boolean().optional(),
  seriesYOverFlow: z.string().optional(),
  seriesYTextAlign: z.string().optional(),
  styleAssignList: z.array(z.any()).nullable().optional(),
  defaultObj: stateStyleObjSchema.optional(),
  hoverObj: stateStyleObjSchema.optional(),
  activeObj: stateStyleObjSchema.optional()
});

// 全局配置 Schema
const globalConfigSchema = z.object({
  globalBgShow: z.boolean(),
  globalRowCount: z.number(),
  globalRowLineMarginBottom: z.number(),
  animationShow: z.boolean(),
  globalScroll: z.boolean(),
  globalScrollTime: z.number(),
  scrollYBarShow: z.boolean(),
  globalScrollYTrackWidth: z.number(),
  globalScrollYTrackBackground: z.string(),
  globalScrollYThumbWidth: z.number(),
  globalScrollYThumbBackground: z.string(),
  globalBgType: z.string(),
  globalBgImage: z.string(),
  globalScrollYTrackBorderRadius: z.number(),
  globalScrollYThumbBorderRadius: z.number(),
  globalBgColor: z.string(),
  translateX: z.number(),
  translateY: z.number(),
  globalTranslateX: z.number(),
  globalTranslateY: z.number()
});

// 行配置 Schema
const rowConfigSchema = z.object({
  listRowWidth: z.number(),
  listRowHeight: z.number(),
  listRowBgType: z.string(),
  listRowBgColor: z.string(),
  listRowBgImage: z.string(),
  selectedShow: z.boolean(),
  selectedBgType: z.string(),
  selectedBgColor: z.string(),
  selectedBgImage: z.string(),
  hoverShow: z.boolean(),
  hoverBgType: z.string(),
  hoverBgColor: z.string(),
  listRowStatusShow: z.boolean(),
  seriesXTabsName: z.array(z.string()),
  listRowStatusList: z.array(z.any()),
  listRowMappingKey: z.string()
});

/**
 * 自定义列表配置选项 Schema
 */
export const customTableListOptionSchema = z.object({
  // ============ 列（内容元素）定义 ============
  column: z.array(customTableListColumnSchema),

  // ============ 全局配置 ============
  globalConfig: globalConfigSchema,

  // ============ 行配置 ============
  rowConfig: rowConfigSchema,

  // ============ 其他配置 ============
  refresh: z.boolean(),
  columns: z.number()
});

export type CustomTableListOption = z.infer<typeof customTableListOptionSchema>;
