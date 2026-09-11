import type { CSSProperties } from "vue";

export interface VideoItem {
  name: string;
  url: string;
  type?: string;
}
export enum TextPosition {
  top = "top",
  bottom = "bottom"
}
export interface VideoOption {
  rows: number;
  columns: number;
  showPage?: boolean;
  showVideoIcon?: boolean;
  textPosition?: TextPosition;
  objectFit?: string;
  padding?: number[];
  pagerTime?: number;
  isCarousel?: boolean;
  carousel?: CarouselOption;
  seriesList?: any[];
  videoBoxWidth?: number;
  videoBoxHeight?: number;
}

export type arrowType = "always" | "never" | "hover";
export type directionType = "horizontal" | "vertical";
export type indicatorType = "" | "none" | "outside";
export interface CarouselOption {
  interval: number;
  arrow: arrowType;
  arrowImg: string;
  isRotate: boolean;
  type: "" | "card";
  direction: directionType;
  indicator: indicatorType;
}
export interface StyleConfig {
  defaultItem: CSSProperties;
  itemLi: CSSProperties;
  videoTitle: CSSProperties;
  pager: CSSProperties;
  pageIcon: CSSProperties;
  pagerfont: CSSProperties;
  totalfont: CSSProperties;
  defaultIcon: CSSProperties;
  [key: string]: CSSProperties;
}
export interface TitleTextStyle {
  show: boolean;
  color?: string;
  fontSize?: string;
  fontWeight?: string | number;
  [key: string]: any;
}

export interface SpinnerItem {
  isNullVal?: boolean;
  markOpacity: number;
  titleStyle: TitleTextStyle;
  textStyle: TitleTextStyle;
  [key: string]: any;
}

export interface DataItem {
  title?: string;
  text?: string;
}

export interface CardItem {
  titleContent: string;
  textContent: string;
  backgroundImg: string;
}
