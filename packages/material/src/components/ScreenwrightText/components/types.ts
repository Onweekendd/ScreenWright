export const renderTextComponentType = [
  "customCollapse",
  "swRichtext",
  "swcollection",
  "customTableList",
  "swTextWordCloud",
  "swmultiLine",
  "swtext",
  "swProgress",
  "swdatetime",
  "swText2",
  "swScroll"
];

export interface TextOption {
  type?: "link" | "text";
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  textAlignVertical?: "top" | "center" | "bottom";
  lineHeight2?: number;
  iswrap?: boolean;
  scroll?: boolean;
  speed?: number;
  step?: number;
  split?: number;
  linkHref?: string;
  linkTarget?: string;
  pointerEvents?: boolean;
  textAnimationType?: "typingEffect" | "opacityIn";
  textAnimationTiming?: number;
  textAnimationDelay?: number;
  shadowShow?: boolean;
  shadowColor?: string;
  shadowX?: number;
  shadowY?: number;
  shadowFuzzy?: number;
  selectedTextType?: "normal" | "gradient";
  selectedTextColor?: string;
  writingMode?: string;
  textOrientation?: string;
}

export interface ProgressTableRow {
  _idx: number;
  id: number;
  [key: string]: any;
}

export interface TableGlobalConfig {
  globalScroll: boolean;
  globalRowCount: number;
  globalColCount?: number;
  globalScrollTime?: number;
  globalTranslateY: number;
  globalTranslateX: number;
  globalBgType: string;
  globalBgColor: string;
  globalBgImage: string;
}

export interface TableRowConfig {
  background: string;
  width: string;
  height: string;
  listRowHeight: number;
  listRowMarginBottom: number;
}

export interface TableColumnConfig {
  seriesYContentType: "button" | "image" | "switch" | "word";
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  zIndex: number;
  [x: string]: any;
  // 其他字段根据实际情况添加
}

export interface TableOptions {
  option: {
    globalConfig: TableGlobalConfig;
    rowConfig: TableRowConfig;
    column: TableColumnConfig[];
  };
  dataChart: any[];
  isBuild: boolean;
}

export interface Attrs {
  [key: string]: any;
}

export interface Component {
  height: number;
  width: number;
  name: string;
  prop: string;
  minWidth?: number;
  style?: any;
}

export interface Option {
  [x: string]: any;
}
export interface DataItem {
  [x: string]: any;
}
