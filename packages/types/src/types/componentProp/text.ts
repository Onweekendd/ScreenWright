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
  FtRichtext = "swRichtext",
  /** 集合组件 */
  FtCollection = "swcollection",
  /** 自定义表格列表 */
  CustomTableList = "customTableList",
  /** 文本词云 */
  FtTextWordCloud = "swTextWordCloud",
  /** 多行文本 */
  FtMultiLine = "swmultiLine",
  /** 基础文本 */
  FtText = "swtext",
  /** 进度条 */
  FtProgress = "swProgress",
  /** 日期时间 */
  FtDatetime = "swdatetime",
  /** 文本2 */
  FtText2 = "swText2",
  /** 滚动文本 */
  FtScroll = "swScroll"
}

/** @deprecated 使用 TextEnum 代替 */
export const textEnum = TextEnum;
