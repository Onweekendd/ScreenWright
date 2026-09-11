import { z } from "zod";

/**
 * 多选选项卡 (multi-subtabs)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `label` - 标签
 * - `value` - 值
 *
 * @example
 * ```typescript
 * const data: multiSubtabsData = [
 *   { label: "Tab A", value: 1 },
 *   { label: "Tab B", value: 2 }
 * ];
 * ```
 */

// 单个数据项的 Schema
const multiSubtabsDataItemSchema = z.object({
  label: z.string().describe("标签名称"),
  value: z.union([z.string(), z.number()]).describe("标签值")
});

export const multiSubtabsDataSchema = z.array(multiSubtabsDataItemSchema);
export type multiSubtabsData = z.infer<typeof multiSubtabsDataSchema>;

// 文本阴影 Schema
const textShadowSchema = z.object({
  x: z.number(),
  y: z.number(),
  blur: z.number(),
  color: z.string(),
  extend: z.number()
}).passthrough();

// 选项卡状态样式 Schema
const tabStyleSchema = z.object({
  textTranslateX: z.number(),
  textTranslateY: z.number(),
  isBorder: z.boolean(),
  borderWidth: z.number(),
  borderColor: z.string(),
  backgroundColor: z.string(),
  backgroundImage: z.string(),
  backgroundImageType: z.string(),
  backgroundType: z.string(),
  fontSize: z.number(),
  fontWeight: z.union([z.boolean(), z.string()]),
  fontStyle: z.union([z.boolean(), z.string()]),
  fontFamily: z.string(),
  fontColor: z.string(),
  isTextShadow: z.boolean(),
  textShadow: textShadowSchema.optional()
}).passthrough();

// 系列配置 Schema
const seriesTabSchema = z.object({
  name: z.string(),
  activeObj: tabStyleSchema,
  hoverObj: tabStyleSchema,
  defaultObj: tabStyleSchema
}).passthrough();

/**
 * 多选选项卡配置选项 Schema
 */
export const multiSubtabsOptionSchema = z.object({
  active: z.string().describe("激活的选项（逗号分隔）"),
  rows: z.number().describe("行数"),
  columns: z.number().describe("列数"),
  rowGap: z.number().describe("行间距"),
  columnGap: z.number().describe("列间距"),
  paddingTop: z.number().describe("上内边距"),
  paddingBottom: z.number().describe("下内边距"),
  paddingLeft: z.number().describe("左内边距"),
  paddingRight: z.number().describe("右内边距"),
  writingMode: z.string().describe("书写模式"),
  alignItems: z.string().describe("对齐方式"),
  textAlign: z.string().describe("文本对齐"),
  playVisible: z.boolean().describe("是否显示播放按钮"),
  playDelay: z.number().describe("播放延迟"),
  playDuration: z.number().describe("播放时长"),
  scrollVisible: z.boolean().describe("是否显示滚动条"),
  scrollGap: z.number().describe("滚动间距"),
  scrollTrack: z.string().describe("滚动轨道颜色"),
  scrollSlide: z.string().describe("滚动滑块颜色"),
  componentLink: z.boolean().describe("是否组件联动"),
  isCallback: z.boolean().describe("是否触发回调"),
  related: z.boolean().describe("是否关联"),
  isCancelSelected: z.boolean().describe("是否可取消选中"),
  isHovered: z.boolean().describe("是否启用悬停效果"),
  defaultObj: tabStyleSchema.describe("默认样式"),
  activeObj: tabStyleSchema.describe("激活样式"),
  hoverObj: tabStyleSchema.describe("悬停样式"),
  isSeriesFirst: z.boolean().describe("是否优先使用系列配置"),
  seriesTabsList: z.array(seriesTabSchema).describe("系列样式列表")
});

export type multiSubtabsOption = z.infer<typeof multiSubtabsOptionSchema>;
