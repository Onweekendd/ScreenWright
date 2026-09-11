/**
 * 文本阴影配置
 */
export interface TextShadow {
  /** X轴偏移量 */
  x: number;
  /** Y轴偏移量 */
  y: number;
  /** 模糊半径 */
  blur: number;
  /** 阴影颜色 */
  color: string;
  /** 扩展半径 */
  extend: number;
}

/**
 * 基础样式配置对象
 */
export interface BaseStyleObj {
  /** 文本X轴平移量 */
  textTranslateX: number;
  /** 文本Y轴平移量 */
  textTranslateY: number;
  /** 是否显示边框 */
  isBorder: boolean;
  /** 边框宽度 */
  borderWidth: number;
  /** 边框颜色 */
  borderColor: string;
  /** 背景颜色 */
  backgroundColor: string;
  /** 背景图片URL */
  backgroundImage: string;
  /** 背景图片尺寸类型 */
  backgroundImageType: string;
  /** 背景类型：'color' 或 'image' */
  backgroundType: "color" | "image";
  /** 字体大小 */
  fontSize: number;
  /** 是否粗体 - 可以是boolean或CSS font-weight值 */
  fontWeight: boolean | "normal" | "bold" | number;
  /** 是否斜体 - 可以是boolean或CSS font-style值 */
  fontStyle: boolean | "normal" | "italic" | "oblique";
  /** 字体家族 */
  fontFamily: string;
  /** 字体颜色 */
  fontColor: string;
  /** 是否显示文本阴影 */
  isTextShadow: boolean;
  /** 文本阴影配置 */
  textShadow: TextShadow;
}

/**
 * 系列选项卡样式配置（当开启系列样式优先时使用）
 */
export interface SeriesTabsItem {
  /** 默认状态样式 */
  defaultObj: BaseStyleObj;
  /** 激活状态样式 */
  activeObj: BaseStyleObj;
  /** 悬停状态样式 */
  hoverObj: BaseStyleObj;
  // 其他可能的系列相关属性
  [key: string]: any;
}

/**
 * Subtabs 组件选项配置
 */
export interface SubtabsOption {
  /** 默认激活项索引 */
  active: number;
  /** 行数 */
  rows: number;
  /** 列数 */
  columns: number;
  /** 行间距 */
  rowGap: number;
  /** 列间距 */
  columnGap: number;
  /** 上内边距 */
  paddingTop: number;
  /** 下内边距 */
  paddingBottom: number;
  /** 左内边距 */
  paddingLeft: number;
  /** 右内边距 */
  paddingRight: number;
  /** 文字书写模式 */
  writingMode: "horizontal-tb" | "vertical-rl" | "vertical-lr";
  /** 垂直对齐方式 */
  alignItems: "flex-start" | "flex-end" | "center" | "baseline" | "stretch";
  /** 文本对齐方式 */
  textAlign: "left" | "right" | "center" | "justify";
  /** 是否显示播放按钮 */
  playVisible: boolean;
  /** 播放延迟（秒） */
  playDelay: number;
  /** 播放时长（秒） */
  playDuration: number;
  /** 是否显示滚动条 */
  scrollVisible: boolean;
  /** 滚动条间距 */
  scrollGap: number;
  /** 滚动条轨道颜色 */
  scrollTrack: string;
  /** 滚动条滑块颜色 */
  scrollSlide: string;
  /** 是否启用组件联动 */
  componentLink: boolean;
  /** 是否启用回调 */
  isCallback: boolean;
  /** 是否关联其他组件 */
  related: boolean;
  /** 是否隔离 */
  isIsolated: boolean;
  /** 是否允许取消选中 */
  isCancelSelected: boolean;
  /** 是否启用悬停效果 */
  isHovered: boolean;
  /** 默认状态样式配置 */
  defaultObj: BaseStyleObj;
  /** 激活状态样式配置 */
  activeObj: BaseStyleObj;
  /** 悬停状态样式配置 */
  hoverObj: BaseStyleObj;
  /** 是否设置最小高度 */
  setMinHeight?: boolean;
  /** 是否系列样式优先 */
  isSeriesFirst?: boolean;
  /** 系列选项卡样式列表 */
  seriesTabsList?: SeriesTabsItem[];
  /** 是否跟随画布滑动 */
  followCanvasSlide?: boolean;
  /** 是否固定选中项 */
  isFixedSelectedItem?: boolean;
}
