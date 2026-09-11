import { z } from "zod";

/**
 * 点状时间轴 (pointTimeline)
 * 交互
 *
 * ## 数据结构
 * 数据字段:
 * - `text` - 标题（时间点）
 * - `value` - 文本内容
 *
 * @example
 * ```typescript
 * const data: pointTimelineData = [
 *   { text: "2002.07", value: "Screenwright总部创立于广州" }
 * ];
 * ```
 */

// 单个数据项的 Schema
const pointTimelineDataItemSchema = z.object({
  text: z.string().describe("标题（时间点）"),
  value: z.string().describe("文本内容")
});

export const pointTimelineDataSchema = z.array(pointTimelineDataItemSchema);
export type pointTimelineData = z.infer<typeof pointTimelineDataSchema>;

// 节点样式 Schema
const pointNodeStyleSchema = z.object({
  axialPointImgSrc: z.string(),
  axialPointWidth: z.number(),
  axialPointHeight: z.number(),
  axialPointTranslateX: z.number(),
  axialPointTranslateY: z.number(),
  axialSpindleWidth: z.number(),
  axialSpindleTextFontFamily: z.string(),
  axialSpindleTextFontSize: z.number(),
  axialSpindleTextLetterSpacing: z.number(),
  axialSpindleTextColor: z.string(),
  axialSpindleTextFontStyle: z.string(),
  axialSpindleTextFontWeight: z.string(),
  axialSpindleTextLineHeight: z.number(),
  axialSpindleTextAlign: z.string(),
  axialSpindleTranslateX: z.number(),
  axialSpindleTranslateY: z.number(),
  axialTitleWidth: z.number(),
  axialTitleTextFontFamily: z.string(),
  axialTitleTextFontSize: z.number(),
  axialTitleTextLetterSpacing: z.number(),
  axialTitleTextColor: z.string(),
  axialTitleTextFontStyle: z.string(),
  axialTitleTextFontWeight: z.string(),
  axialTitleTextLineHeight: z.number(),
  axialTitleTextAlign: z.string(),
  axialTitleTranslateX: z.number(),
  axialTitleTranslateY: z.number()
}).passthrough();

/**
 * 点状时间轴配置选项 Schema
 */
export const pointTimelineOptionSchema = z.object({
  globalConfig: z.object({
    defaultExpansion: z.boolean().describe("是否默认展开"),
    crossDisplay: z.boolean().describe("是否交叉显示"),
    initMargin: z.number().describe("初始边距"),
    shaftMargin: z.number().describe("轴线边距"),
    centralAxisMargin: z.number().describe("中轴边距"),
    defaultSelected: z.number().describe("默认选中索引"),
    axisColor: z.string().describe("轴线颜色"),
    axisWidth: z.number().describe("轴线宽度"),
    arrangementDirection: z.string().describe("排列方向")
  }).passthrough().describe("全局配置"),
  timeLineConfig: z.object({
    defaultObj: pointNodeStyleSchema.describe("默认节点样式"),
    activeObj: pointNodeStyleSchema.describe("激活节点样式")
  }).passthrough().describe("时间线配置"),
  animationConfig: z.object({
    loop: z.boolean().describe("是否循环播放"),
    loopInterval: z.number().describe("循环间隔（秒）"),
    animateTranstion: z.number().describe("动画过渡时间（秒）")
  }).passthrough().describe("动画配置")
});

export type pointTimelineOption = z.infer<typeof pointTimelineOptionSchema>;
