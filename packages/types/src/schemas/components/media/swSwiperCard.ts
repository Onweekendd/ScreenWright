import { z } from "zod";

/**
 * 轮播卡片 (ftSwiperCard)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据为空数组，所有内容通过 option 中的 cardList 配置。
 * 数据映射字段：title（标题）、text（内容）、url（背景图）。
 *
 * @example
 * ```typescript
 * const data: FtSwiperCardData = [];
 * ```
 */

// 数据为空数组
export const swSwiperCardDataSchema = z.array(z.never());

export type FtSwiperCardData = z.infer<typeof swSwiperCardDataSchema>;

// 卡片标题/文字样式配置（defaultObj 和 activeObj 共用）
const swSwiperCardTextStyleSchema = z.object({
  markOpacity: z.number().describe("遮罩透明度"),
  width: z.number().describe("宽度"),
  height: z.number().describe("高度"),
  titleShow: z.boolean().describe("是否显示标题"),
  titleWidth: z.number().describe("标题宽度"),
  titleHeight: z.number().describe("标题高度"),
  titleFontFamily: z.string().describe("标题字体"),
  titleFontSize: z.number().describe("标题字号"),
  titleLineHeight: z.number().describe("标题行高"),
  titleLetterSpacing: z.number().describe("标题字间距"),
  titleColor: z.string().describe("标题颜色"),
  titleFontStyle: z.string().describe("标题字体风格"),
  titleFontWeight: z.string().describe("标题字体粗细"),
  titleOffsetLeft: z.number().describe("标题左边距"),
  titleOffsetTop: z.number().describe("标题上边距"),
  textShow: z.boolean().describe("是否显示正文"),
  textWidth: z.number().describe("正文宽度"),
  textHeight: z.number().describe("正文高度"),
  textFontFamily: z.string().describe("正文字体"),
  textFontSize: z.number().describe("正文字号"),
  textLineHeight: z.number().describe("正文行高"),
  textLetterSpacing: z.number().describe("正文字间距"),
  textColor: z.string().describe("正文颜色"),
  textFontStyle: z.string().describe("正文字体风格"),
  textFontWeight: z.string().describe("正文字体粗细"),
  textOffsetLeft: z.number().describe("正文左边距"),
  textOffsetTop: z.number().describe("正文上边距")
});

// 单个卡片配置
const swSwiperCardItemSchema = z.object({
  tabsName: z.string().describe("卡片标签名"),
  titleContent: z.string().describe("标题内容"),
  textContent: z.string().describe("正文内容"),
  backgroundImg: z.string().describe("背景图片路径"),
  defaultObj: swSwiperCardTextStyleSchema.describe("默认状态样式配置"),
  activeObj: swSwiperCardTextStyleSchema.describe("激活状态样式配置")
});

// 全局配置
const swSwiperCardGlobalConfigSchema = z.object({
  cameraPositionX: z.number().describe("摄像机X坐标"),
  cameraPositionY: z.number().describe("摄像机Y坐标"),
  cameraPositionZ: z.number().describe("摄像机Z坐标"),
  roateRadius: z.number().describe("旋转半径"),
  layoutMethod: z.string().describe("布局方式"),
  transitionTime: z.number().describe("过渡时间（秒）"),
  hoverPause: z.boolean().describe("悬停是否暂停"),
  autoPlay: z.boolean().describe("是否自动播放"),
  intervalTime: z.number().describe("轮播间隔时间（秒）"),
  rotateDirection: z.number().describe("旋转方向"),
  perspective: z.number().describe("透视距离"),
  cameraRotateX: z.number().describe("摄像机X旋转角度"),
  cameraRotateY: z.number().describe("摄像机Y旋转角度"),
  cameraRotateZ: z.number().describe("摄像机Z旋转角度"),
  controlBtnWidth: z.number().describe("控制按钮宽度"),
  controlBtnHeight: z.number().describe("控制按钮高度"),
  controlBtnShow: z.boolean().describe("是否显示控制按钮"),
  controlBtnRBg: z.string().describe("右控制按钮背景图"),
  controlBtnLBg: z.string().describe("左控制按钮背景图"),
  controlBtnOffsetLeftOrRight: z.number().describe("控制按钮左右偏移"),
  controlBtnOffsetTop: z.number().describe("控制按钮上下偏移")
});

/**
 * 轮播卡片配置选项 Schema
 */
export const swSwiperCardOptionSchema = z.object({
  // ============ 全局配置 ============
  globalConfig: swSwiperCardGlobalConfigSchema.describe("全局相机与轮播配置"),

  // ============ 卡片列表 ============
  cardList: z.array(swSwiperCardItemSchema).describe("轮播卡片列表"),

  // ============ 刷新配置 ============
  refresh: z.boolean().describe("是否启用刷新")
});

export type FtSwiperCardOption = z.infer<typeof swSwiperCardOptionSchema>;
