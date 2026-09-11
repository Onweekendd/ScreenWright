export interface DirectionOption {
  label: string;
  value: number;
}

interface CommonStyleProps {
  /** 遮罩层透明度 0-100 */
  markOpacity: number;
  /** 容器宽度 */
  width: number;
  /** 容器高度 */
  height: number;
  /** 是否显示标题 */
  titleShow: boolean;
  /** 标题宽度 */
  titleWidth: number;
  /** 标题高度 */
  titleHeight: number;
  /** 标题字体族 */
  titleFontFamily: string;
  /** 标题字体大小 */
  titleFontSize: number;
  /** 标题行高 */
  titleLineHeight: number;
  /** 标题字间距 */
  titleLetterSpacing: number;
  /** 标题颜色 */
  titleColor: string;
  /** 标题字体样式 */
  titleFontStyle: string;
  /** 标题字体粗细 */
  titleFontWeight: string;
  /** 标题左偏移量 */
  titleOffsetLeft: number;
  /** 标题顶部偏移量 */
  titleOffsetTop: number;
  /** 是否显示文本 */
  textShow: boolean;
  /** 文本宽度 */
  textWidth: number;
  /** 文本高度 */
  textHeight: number;
  /** 文本字体族 */
  textFontFamily: string;
  /** 文本字体大小 */
  textFontSize: number;
  /** 文本行高 */
  textLineHeight: number;
  /** 文本字间距 */
  textLetterSpacing: number;
  /** 文本颜色 */
  textColor: string;
  /** 文本字体样式 */
  textFontStyle: string;
  /** 文本字体粗细 */
  textFontWeight: string;
  /** 文本左偏移量 */
  textOffsetLeft: number;
  /** 文本顶部偏移量 */
  textOffsetTop: number;
}

export interface CardItem {
  /** 标签名称 */
  tabsName: string;
  /** 标题内容 */
  titleContent: string;
  /** 文本内容 */
  textContent: string;
  /** 背景图片路径 */
  backgroundImg: string;
  /** 默认状态样式配置 */
  defaultObj: CommonStyleProps;
  /** 激活状态样式配置 */
  activeObj: CommonStyleProps;
  coverImg: string;
}

/** 坐标选项类型 */
export interface CoordinateItem {
  /** 显示的标签文本 */
  label: string;
  /** 对应的值 */
  value: "defaultObj" | "activeObj";
}

export type CardStyleType = "defaultObj" | "activeObj";
