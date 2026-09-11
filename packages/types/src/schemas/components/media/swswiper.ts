import { z } from "zod";

/**
 * 轮播图 (ftswiper)
 * 媒体
 *
 * ## 数据结构
 *
 * 数据为空数组，所有内容通过 option 中的 imagesList 配置。
 *
 * @example
 * ```typescript
 * const data: FtswiperData = [];
 * ```
 */

// 数据为空数组
export const ftswiperDataSchema = z.array(z.never());

export type FtswiperData = z.infer<typeof ftswiperDataSchema>;

// 图片文字阴影配置
const ftswiperTextShadowSchema = z.object({
  color: z.string().describe("阴影颜色"),
  x: z.number().describe("阴影X偏移"),
  y: z.number().describe("阴影Y偏移"),
  blur: z.number().describe("阴影模糊度"),
  extend: z.number().describe("阴影扩展")
});

// 图片列表项配置
const ftswiperImageItemSchema = z.object({
  name: z.string().describe("图片名称"),
  value: z.string().describe("图片路径"),
  objectFit: z.string().describe("图片适配方式"),
  borderImageWidth: z.number().describe("图片宽度"),
  borderImageHeight: z.number().describe("图片高度"),
  borderImageSize: z.string().describe("图片尺寸适配"),
  content: z.string().describe("文字内容"),
  fontColor: z.string().describe("文字颜色"),
  fontSize: z.number().describe("文字大小"),
  letterSpacing: z.number().describe("字间距"),
  fontWeight: z.boolean().describe("是否加粗"),
  fontFamily: z.string().describe("字体"),
  fontStyle: z.boolean().describe("是否斜体"),
  textAlign: z.string().describe("文字对齐"),
  imgTranslateX: z.number().describe("图片X偏移"),
  imgTranslateY: z.number().describe("图片Y偏移"),
  textTranslateX: z.number().describe("文字X偏移"),
  textTranslateY: z.number().describe("文字Y偏移"),
  isTextShadow: z.boolean().describe("是否显示文字阴影"),
  textShadow: ftswiperTextShadowSchema.describe("文字阴影配置"),
  opacity: z.number().describe("透明度")
});

// 层级样式配置
const ftswiperLayerStyleSchema = z.object({
  translateX: z.number().describe("X轴平移"),
  translateY: z.number().describe("Y轴平移"),
  scaleX: z.number().describe("X轴缩放"),
  scaleY: z.number().describe("Y轴缩放"),
  showFont: z.boolean().describe("是否显示文字")
});

// 图片排列样式配置
const ftswiperPicStyleSchema = z.object({
  firstStyle: ftswiperLayerStyleSchema.describe("第一层样式（当前图）"),
  secondStyle: ftswiperLayerStyleSchema.describe("第二层样式"),
  thirdStyle: ftswiperLayerStyleSchema.describe("第三层样式")
});

/**
 * 轮播图配置选项 Schema
 */
export const ftswiperOptionSchema = z.object({
  // ============ 基础配置 ============
  type: z.string().describe("轮播类型"),
  interval: z.number().describe("轮播间隔（毫秒）"),
  opacity: z.number().describe("第一层透明度"),
  secondOpacity: z.number().describe("第二层透明度"),
  thirdOpacity: z.number().describe("第三层透明度"),
  indicator: z.string().describe("指示器样式"),
  direction: z.string().describe("轮播方向"),
  autoplay: z.boolean().describe("是否自动播放"),
  arrow: z.string().describe("箭头显示方式"),
  arrowImg: z.string().describe("箭头图片路径"),
  isRotate: z.boolean().describe("是否旋转"),
  showSwiper: z.boolean().describe("是否显示轮播"),
  objectFit: z.string().describe("图片适配方式"),
  imageWidth: z.number().describe("图片宽度"),
  imageHeight: z.number().describe("图片高度"),

  // ============ 图片列表 ============
  imagesList: z.array(ftswiperImageItemSchema).describe("轮播图片列表"),

  // ============ 排列样式 ============
  picStyle: ftswiperPicStyleSchema.describe("层级排列样式配置")
});

export type FtswiperOption = z.infer<typeof ftswiperOptionSchema>;
