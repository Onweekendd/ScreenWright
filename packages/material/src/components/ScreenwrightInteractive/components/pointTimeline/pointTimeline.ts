export interface TimeLineItem {
  imgX: number;
  imgY: number;
  imglinkHref: string;
  imgWidth: number;
  imgHeight: number;
  imgTransform: string;
  axialSpindleX: number;
  axialSpindleY: number;
  axialSpindleWidth: number;
  axialSpindleHeight: number;
  axialSpindleFontFamily: string;
  axialSpindleFontSize: number;
  axialSpindleLineHeight: number;
  axialSpindleLetterSpacing: number;
  axialSpindleColor: string;
  axialSpindleFontStyle: string;
  axialSpindleFontWeight: string;
  axialSpindleTextAlign: string;
  axialSpindleTransform: string;
  axialTitleX: number;
  axialTitleY: number;
  axialTitleWidth: number;
  axialTitleHeight: number;
  axialTitleFontFamily: string;
  axialTitleFontSize: number;
  axialTitleLineHeight: number;
  axialTitleLetterSpacing: number;
  axialTitleColor: string;
  axialTitleFontStyle: string;
  axialTitleFontWeight: string;
  axialTitleTextAlign: string;
  axialTitleTransform: string;
}

export interface ListDataItem {
  text: string;
  value: string;
  [key: string]: any;
}
