/**
 * 文本组件类型
 * @description 文本类组件的类型标识
 */

/**
 * 文本组件枚举
 * @description 各种文本组件的类型标识
 */
export enum TextEnum {
  /** 自定义折叠面板 */
  CustomCollapse = "customCollapse",
  /** 富文本 */
  SwRichtext = "swRichtext",
  /** 集合组件 */
  SwCollection = "swcollection",
  /** 自定义表格列表 */
  CustomTableList = "customTableList",
  /** 文本词云 */
  SwTextWordCloud = "swTextWordCloud",
  /** 多行文本 */
  SwMultiLine = "swmultiLine",
  /** 基础文本 */
  SwText = "swtext",
  /** 进度条 */
  SwProgress = "swProgress",
  /** 日期时间 */
  SwDatetime = "swdatetime",
  /** 文本2 */
  SwText2 = "swText2",
  /** 滚动文本 */
  SwScroll = "swScroll"
}

/** @deprecated 使用 TextEnum 代替 */
export const textEnum = TextEnum;
