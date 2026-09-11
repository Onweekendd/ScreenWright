/**
 * 自定义表格列中按条件触发的样式配置
 */
export interface StyleAssignItem {
  /** 触发条件对应的数据值 */
  styleAssignKeyValue: string;
  /** 条件满足时应用的宽度（字段保留原拼写） */
  styleAssignWdith: number;
  /** 条件满足时应用的高度 */
  styleAssignHeight: number;
  /** 背景图片地址 */
  styleAssignBgImg?: string;
  /** 文本字体 */
  styleAssignFontFamily?: string;
  /** 文本字号 */
  styleAssignFontSize?: number;
  /** 文本行高 */
  styleAssignLineHeight?: number;
  /** 文本字间距 */
  styleAssignLetterSpacing?: number;
  /** 文本颜色 */
  styleAssignColor?: string;
  /** 字体样式 */
  styleAssignFontStyle?: string;
  /** 字体粗细 */
  styleAssignFontWeight?: string | number;
  /** 相对左边距 */
  styleAssignMarginLeft?: number;
  /** 条件运算符（=、> 等） */
  styleAssignConditions?: string;
  /** 额外扩展字段 */
  [key: string]: any;
}

/**
 * 列在不同状态（默认/悬停/激活）下的视觉配置
 */
export interface ColumnVisualState {
  /** 背景填充类型 */
  backgroundType?: "color" | "custom" | string;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 背景图片地址 */
  backgroundImage?: string;
  /** 背景图片展示方式 */
  backgroundImageType?: "contain" | "cover" | string;
  /** 边框颜色 */
  borderColor?: string;
  /** 边框线条类型 */
  borderLineType?: string;
  /** 边框宽度 */
  borderWidth?: number;
  /** 是否展示按钮边框 */
  btnBorderShow?: boolean;
  /** 内阴影模糊度 */
  btnShadowInBlur?: number;
  /** 内阴影颜色 */
  btnShadowInColor?: string;
  /** 内阴影 X 轴偏移 */
  btnShadowInX?: number;
  /** 内阴影 Y 轴偏移 */
  btnShadowInY?: number;
  /** 外阴影模糊度 */
  btnShadowOutBlur?: number;
  /** 外阴影颜色 */
  btnShadowOutColor?: string;
  /** 外阴影 X 轴偏移 */
  btnShadowOutX?: number;
  /** 外阴影 Y 轴偏移 */
  btnShadowOutY?: number;
  /** 是否展示阴影 */
  btnShadowShow?: boolean;
  /** 是否启用文字阴影 */
  isTextShadow?: boolean;
  /** 文字颜色 */
  seriesYColor?: string;
  /** 文字字体 */
  seriesYFontFamily?: string;
  /** 文字字号 */
  seriesYFontSize?: number;
  /** 文字字体样式 */
  seriesYFontStyle?: string;
  /** 文字粗细 */
  seriesYFontWeight?: string | number;
  /** 文字字间距 */
  seriesYLetterSpacing?: number;
  /** 文字行高 */
  seriesYLineHeight?: number;
  /** 条件样式列表 */
  styleAssignList?: StyleAssignItem[];
  /** 文本阴影模糊度 */
  textShadowBlur?: number;
  /** 文本阴影颜色 */
  textShadowColor?: string;
  /** 文本阴影 X 轴偏移 */
  textShadowX?: number;
  /** 文本阴影 Y 轴偏移 */
  textShadowY?: number;
  /** 文本 X 轴平移 */
  textTranslateX?: number;
  /** 文本 Y 轴平移 */
  textTranslateY?: number;
}

/**
 * 自定义表格列配置
 */
export interface ColumnConfig {
  /** 列展示内容类型 */
  seriesYContentType: "btn" | "image" | "switch" | "word";
  /** 列原始字段名 */
  name?: string;
  /** 列别名 */
  alias?: string;
  /** 列唯一标识 */
  id?: string | number;
  /** 列宽度 */
  width?: number;
  /** 列高度 */
  height?: number;
  /** X 轴偏移 */
  offsetX?: number;
  /** Y 轴偏移 */
  offsetY?: number;
  /** Z 轴层级 */
  zIndex?: number;
  /** Y 轴位置（可为百分比/像素） */
  seriesYOffsetY?: string | number;
  /** X 轴位置 */
  seriesYOffsetX?: number;
  /** 层级顺序 */
  seriesYZIndex?: number;
  /** 内容区域宽度 */
  seriesYOffsetWidth?: number;
  /** 内容区域高度 */
  seriesYOffsetHeight?: number;
  /** 是否使用映射数据 */
  seriesYIsMapping?: boolean;
  /** 所属页签名称 */
  seriesYTabsName?: string;
  /** 条件样式配置 */
  styleAssignList?: StyleAssignItem[];

  /** 默认状态样式 */
  defaultObj?: ColumnVisualState;
  /** 悬停状态样式 */
  hoverObj?: ColumnVisualState;
  /** 激活状态样式 */
  activeObj?: ColumnVisualState;

  /** 按钮显示文本 */
  btnWord?: string;
  /** 是否处于 hover 状态 */
  btnIsHovered?: boolean;

  /** 图片地址 */
  icon?: string;

  /** 开关类型 */
  switchType?: "default" | "icon" | "image";
  /** 开关激活背景色 */
  switchActiveColor?: string;
  /** 开关未激活背景色 */
  switchInactiveColor?: string;
  /** 开关激活文本 */
  switchActiveText?: string;
  /** 开关未激活文本 */
  switchInactiveText?: string;
  /** 开关激活图标 */
  switchActiveIcon?: string;
  /** 开关未激活图标 */
  switchInactiveIcon?: string;
  /** 开关激活图片 */
  switchActiveImage?: string;
  /** 开关未激活图片 */
  switchInactiveImage?: string;
  /** 开关轨道尺寸 */
  switchPointSize?: number;
  /** 开关文本字号 */
  switchFontSize?: number;
  /** 开关文本颜色 */
  switchFontColor?: string;
  /** 开关文本是否加粗 */
  switchFontWeight?: boolean;
  /** 开关文本字体 */
  switchFontFamily?: string;
  /** 开关文本样式 */
  switchFontStyle?: boolean;
  /** 开关文本字间距 */
  switchLetterSpacing?: number;
  /** 是否启用开关文本阴影 */
  switchIsTextShadow?: boolean;
  /** 开关文本阴影颜色 */
  switchTextShadowColor?: string;
  /** 开关文本阴影 X 轴偏移 */
  switchTextShadowX?: number;
  /** 开关文本阴影 Y 轴偏移 */
  switchTextShadowY?: number;
  /** 开关文本阴影模糊度 */
  switchTextShadowBlur?: number;
  /** 指示点颜色 */
  pointColor?: string;

  /** 文本内容 */
  word?: string;
  /** 文本值类型 */
  wordValueType?: "string" | "number";
  /** 文本单位 */
  wordUnit?: string;
  /** 文本溢出处理方式 */
  seriesYOverFlow?: "ellipsis" | "carousel" | string;
  /** 文本行高 */
  seriesYLineHeight?: number;
  /** 文本对齐方式 */
  seriesYTextAlign?: "left" | "center" | "right" | string;
  /** 文本字体 */
  seriesYFontFamily?: string;
  /** 文本字号 */
  seriesYFontSize?: number;
  /** 文本字间距 */
  seriesYLetterSpacing?: number;
  /** 文本颜色 */
  seriesYColor?: string;
  /** 文本字体样式 */
  seriesYFontStyle?: string;
  /** 文本粗细 */
  seriesYFontWeight?: string | number;
  /** 文本书写方向 */
  seriesYTextWritingMode?: string;

  /** 额外扩展字段 */
  [key: string]: any;
}

/**
 * 自定义表格全局配置
 */
export interface CustomTableListGlobalConfig {
  /** 是否显示全局背景 */
  globalBgShow: boolean;
  /** 行数量 */
  globalRowCount: number;
  /** 行间距 */
  globalRowLineMarginBottom: number;
  /** 是否启用动画 */
  animationShow: boolean;
  /** 是否启用滚动 */
  globalScroll: boolean;
  /** 滚动时长（秒） */
  globalScrollTime: number;
  /** 是否展示滚动条 */
  scrollYBarShow: boolean;
  /** 滚动条轨道宽度 */
  globalScrollYTrackWidth: number;
  /** 滚动条轨道颜色 */
  globalScrollYTrackBackground: string;
  /** 滚动条滑块宽度 */
  globalScrollYThumbWidth: number;
  /** 滚动条滑块颜色 */
  globalScrollYThumbBackground: string;
  /** 背景类型 */
  globalBgType: "color" | "custom" | string;
  /** 背景图片 */
  globalBgImage: string;
  /** 滚动条轨道圆角 */
  globalScrollYTrackBorderRadius: number;
  /** 滚动条滑块圆角 */
  globalScrollYThumbBorderRadius: number;
  /** 背景颜色 */
  globalBgColor: string;
  /** 元素整体 X 轴偏移 */
  translateX: number;
  /** 元素整体 Y 轴偏移 */
  translateY: number;
  /** 全局 X 轴偏移 */
  globalTranslateX: number;
  /** 全局 Y 轴偏移 */
  globalTranslateY: number;
  /** 全局列数量 */
  globalColCount: number;
}

/**
 * 自定义表格行配置
 */
export interface CustomTableListRowConfig {
  /** 行背景 */
  background: string;
  /** 行宽度（px） */
  width: string;
  /** 行高度（px） */
  height: string;
  /** 行宽度 */
  listRowWidth: number;
  /** 行高度 */
  listRowHeight: number;
  /** 行背景类型 */
  listRowBgType: "color" | "custom" | string;
  /** 行背景颜色 */
  listRowBgColor: string;
  /** 行背景图片 */
  listRowBgImage: string;
  /** 是否展示选中态 */
  selectedShow: boolean;
  /** 选中态背景类型 */
  selectedBgType: "color" | "custom" | string;
  /** 选中态背景颜色 */
  selectedBgColor: string;
  /** 选中态背景图片 */
  selectedBgImage: string;
  /** 是否展示 hover 状态 */
  hoverShow: boolean;
  /** hover 背景类型 */
  hoverBgType: "color" | "custom" | string;
  /** hover 背景颜色 */
  hoverBgColor: string;
  /** hover 背景图片 */
  hoverBgImage: string;
  /** 是否展示行状态 */
  listRowStatusShow: boolean;
  /** X 轴系列名称列表 */
  seriesXTabsName: string[];
  /** 行状态配置列表 */
  listRowStatusList: unknown[];
  /** 行映射字段 */
  listRowMappingKey: string;
}

/**
 * 自定义表格整体数据结构
 */
export interface Option {
  /** 列配置集合 */
  column: ColumnConfig[];
  /** 全局样式配置 */
  globalConfig: CustomTableListGlobalConfig;
  /** 行样式配置 */
  rowConfig: CustomTableListRowConfig;
  /** 是否触发刷新 */
  refresh: boolean;
  /** 列数量 */
  columns: number;
}
