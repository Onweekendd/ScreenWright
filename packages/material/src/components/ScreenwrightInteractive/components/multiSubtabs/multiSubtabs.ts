export interface TabItem {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface TextShadow {
  color: string;
  x?: number;
  y?: number;
  blur: number;
}

export interface StyleObject {
  fontColor?: string;
  fontSize?: number;
  fontWeight?: boolean;
  fontFamily?: string;
  fontStyle?: boolean;
  isTextShadow?: boolean;
  textShadow?: TextShadow;
  textTranslateX?: number;
  textTranslateY?: number;
  isBorder?: boolean;
  borderWidth?: number;
  borderColor?: string;
  backgroundType?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundImageType?: string;
}

export interface SeriesTabItem {
  defaultObj: StyleObject;
  activeObj: StyleObject;
  hoverObj?: StyleObject;
}

export interface MultiSubtabsOption {
  rows: number;
  columns: number;
  rowGap: number;
  columnGap: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  writingMode: string;
  alignItems: string;
  defaultObj: StyleObject;
  activeObj: StyleObject;
  hoverObj?: StyleObject;
  isHovered: boolean;
  active: string;
  setMinHeight: boolean;
  isSeriesFirst: boolean;
  seriesTabsList: SeriesTabItem[];
}

export interface MultiSubtabsProps {
  element: {
    option: MultiSubtabsOption;
    data: TabItem[];
    [key: string]: any;
  };
}

export interface Event {
  trigger: string;
  [key: string]: any;
}

export interface Encode {
  [key: string]: any;
}
