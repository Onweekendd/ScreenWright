export interface IconItem {
  iconImgSrc: string;
  iconImgWidth: number;
  iconImgHeight: number;
  iconTranslateX: number;
  iconTranslateY: number;
  iconFontFamily: string;
  iconFontSize: number;
  iconLineHeight: number;
  iconLetterSpacing: number;
  iconColor: string;
  iconFontStyle: string;
  iconFontWeight: string | number;
  iconKeyValue: string;
}

export interface FlopOption {
  decimals?: number;
  whole?: boolean;
  type?: string;
  span?: number;
  useGrouping?: boolean;
  autoplay?: boolean;
  intervalTime?: number;
  duration?: number;
  makeComplete?: boolean;
  completeCount?: number;
  backgroundColor?: string;
  // ... 其他选项属性
}

export interface FlopDataItem {
  value: number;
  formatter?: () => string;
  backgroundColor?: string;
  prefixText?: string;
  suffixText?: string;
  data?: any;
}
