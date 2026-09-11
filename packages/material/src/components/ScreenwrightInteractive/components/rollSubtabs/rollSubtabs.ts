export interface RollSubtabsOption {
  active: string;
  arrowShow: boolean;
  arrowWidth: number;
  arrowHeight: number;
  imgLeft: string;
  imgRight: string;
  columnGap: number;
  rowGap: number;
  direction: string;
  directionNum: number;
  isHovered: boolean;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  writingMode: string;
  alignItems: string;
  isFixedSelectedItem: boolean;
  isCancelSelected: boolean;
  related: boolean;
  playVisible: boolean;
  playDuration: number;
  isSeriesFirst: boolean;
  seriesTabsList: Array<{
    defaultObj: StyleObject;
    activeObj: StyleObject;
    hoverObj: StyleObject;
  }>;
  defaultObj: StyleObject;
  activeObj: StyleObject;
  hoverObj: StyleObject;
}

export interface StyleObject {
  fontColor: string;
  fontSize: number;
  fontWeight: boolean;
  fontFamily: string;
  fontStyle: boolean;
  isTextShadow: boolean;
  textShadow: {
    color: string;
    x: number;
    y: number;
    blur: number;
  };
  textTranslateX: number;
  textTranslateY: number;
  isBorder: boolean;
  borderWidth: number;
  borderColor: string;
  backgroundType: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundImageType: string;
}

export interface ChartDataItem {
  label: string;
  value: string;
  disabled?: boolean;
}
