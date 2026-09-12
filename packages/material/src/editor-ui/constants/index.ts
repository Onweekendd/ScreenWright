export const firstLabelWidth = "100";
export const secondLabelWidth = "73";
export const thirdLabelWidth = "48";
export const fourthLabelWidth = "28";

export enum commonOrientEnum {
  horizontal = "horizontal",
  vertical = "vertical"
}
export type commonOrientType = commonOrientEnum.horizontal | commonOrientEnum.vertical;
export const commonOrient: { label: string; value: commonOrientType }[] = [
  { label: "水平", value: commonOrientEnum.horizontal },
  { label: "垂直", value: commonOrientEnum.vertical }
];

export enum funnelSortEnum {
  none = "none",
  descending = "descending",
  ascending = "ascending"
}
export type funnelSortType = funnelSortEnum.none | funnelSortEnum.descending | funnelSortEnum.ascending;
export const funnelSort: { label: string; value: funnelSortType }[] = [
  { label: "无", value: funnelSortEnum.none },
  { label: "升序", value: funnelSortEnum.descending },
  { label: "降序", value: funnelSortEnum.ascending }
];

export enum textAlignEnum {
  center = "center",
  left = "left",
  right = "right"
}
export type textAlignType = textAlignEnum.center | textAlignEnum.left | textAlignEnum.right;
export const textAlign: { label: string; value: textAlignType }[] = [
  { label: "居中", value: textAlignEnum.center },
  { label: "左对齐", value: textAlignEnum.left },
  { label: "右对齐", value: textAlignEnum.right }
];

export enum seriesTypeEnum {
  bar = "bar",
  line = "line"
}
export type seriesTypeType = seriesTypeEnum.bar | seriesTypeEnum.line;
export const seriesType: { label: string; value: seriesTypeType }[] = [
  { label: "柱形", value: seriesTypeEnum.bar },
  { label: "折线", value: seriesTypeEnum.line }
];

export enum seriesSymbolEnum {
  emptyCircle = "emptyCircle",
  circle = "circle",
  rect = "rect",
  roundRect = "roundRect",
  triangle = "triangle",
  diamond = "diamond",
  pin = "pin",
  arrow = "arrow",
  image = "image"
}
export type seriesSymbolType =
  | seriesSymbolEnum.emptyCircle
  | seriesSymbolEnum.circle
  | seriesSymbolEnum.rect
  | seriesSymbolEnum.roundRect
  | seriesSymbolEnum.triangle
  | seriesSymbolEnum.diamond
  | seriesSymbolEnum.pin
  | seriesSymbolEnum.arrow
  | seriesSymbolEnum.image;
export const seriesSymbol: { label: string; value: seriesSymbolType }[] = [
  { label: "空心圆", value: seriesSymbolEnum.emptyCircle },
  { label: "圆", value: seriesSymbolEnum.circle },
  { label: "方形", value: seriesSymbolEnum.rect },
  { label: "方圆形", value: seriesSymbolEnum.roundRect },
  { label: "三角形", value: seriesSymbolEnum.triangle },
  { label: "菱形", value: seriesSymbolEnum.diamond },
  { label: "水滴形", value: seriesSymbolEnum.pin },
  { label: "箭头形", value: seriesSymbolEnum.arrow },
  { label: "自定义", value: seriesSymbolEnum.image }
];

export enum lineTypeEnum {
  solid = "solid",
  dashed = "dashed",
  dotted = "dotted"
}
export type lineTypeType = lineTypeEnum.solid | lineTypeEnum.dashed | lineTypeEnum.dotted;
export const lineType: { label: string; value: lineTypeType }[] = [
  { label: "实线", value: lineTypeEnum.solid },
  { label: "虚线", value: lineTypeEnum.dashed },
  { label: "点线", value: lineTypeEnum.dotted }
];

export enum rippleEffectBrushTypeEnum {
  fill = "fill",
  stroke = "stroke"
}
export type rippleEffectBrushTypeType = rippleEffectBrushTypeEnum.fill | rippleEffectBrushTypeEnum.stroke;
export const rippleEffectBrushType: { label: string; value: rippleEffectBrushTypeType }[] = [
  { label: "填充", value: rippleEffectBrushTypeEnum.fill },
  { label: "单纹", value: rippleEffectBrushTypeEnum.stroke }
];

export enum showEffectOnEnum {
  render = "render",
  emphasis = "emphasis"
}
export type showEffectOnType = showEffectOnEnum.render | showEffectOnEnum.emphasis;
export const showEffectOn: { label: string; value: showEffectOnType }[] = [
  { label: "绘制后", value: showEffectOnEnum.render },
  { label: "高亮时", value: showEffectOnEnum.emphasis }
];

export enum graphLineColorTypeEnum {
  source = "source",
  target = "target"
}
export type graphLineColorTypeType = graphLineColorTypeEnum.source | graphLineColorTypeEnum.target;
export const graphLineColorType: { label: string; value: graphLineColorTypeType }[] = [
  { label: "源节点", value: graphLineColorTypeEnum.source },
  { label: "目标节点", value: graphLineColorTypeEnum.target }
];

export enum labelPositionEnum {
  top = "top",
  bottom = "bottom",
  left = "left",
  right = "right",
  inside = "inside"
}
export type labelPositionType =
  | labelPositionEnum.top
  | labelPositionEnum.bottom
  | labelPositionEnum.left
  | labelPositionEnum.right
  | labelPositionEnum.inside;
export const labelPosition: { label: string; value: labelPositionType }[] = [
  { label: "上", value: labelPositionEnum.top },
  { label: "下", value: labelPositionEnum.bottom },
  { label: "左", value: labelPositionEnum.left },
  { label: "右", value: labelPositionEnum.right },
  { label: "中间", value: labelPositionEnum.inside }
];

export enum extremeTypeEnum {
  max = "max",
  min = "min"
}
export type extremeTypeType = extremeTypeEnum.max | extremeTypeEnum.min;
export const extremeType: { label: string; value: extremeTypeType }[] = [
  { label: "最大值", value: extremeTypeEnum.max },
  { label: "最小值", value: extremeTypeEnum.min }
];

export enum markLineDataTypeEnum {
  min = "min",
  max = "max",
  average = "average",
  median = "median",
  custom = "custom"
}
export type markLineDataTypeType =
  | markLineDataTypeEnum.min
  | markLineDataTypeEnum.max
  | markLineDataTypeEnum.average
  | markLineDataTypeEnum.median
  | markLineDataTypeEnum.custom;
export const markLineDataType: { label: string; value: markLineDataTypeType }[] = [
  { label: "最小值", value: markLineDataTypeEnum.min },
  { label: "最大值", value: markLineDataTypeEnum.max },
  { label: "平均值", value: markLineDataTypeEnum.average },
  { label: "中位数", value: markLineDataTypeEnum.median },
  { label: "自定义值", value: markLineDataTypeEnum.custom }
];

export enum markLineLabelPositionEnum {
  start = "start",
  middle = "middle",
  end = "end"
}
export type markLineLabelPositionType =
  | markLineLabelPositionEnum.start
  | markLineLabelPositionEnum.middle
  | markLineLabelPositionEnum.end;
export const markLineLabelPosition: { label: string; value: markLineLabelPositionType }[] = [
  { label: "起始点", value: markLineLabelPositionEnum.start },
  { label: "中点", value: markLineLabelPositionEnum.middle },
  { label: "结束点", value: markLineLabelPositionEnum.end }
];

export type radarShapeType = "polygon" | "circle";
export const radarShape: { label: string; value: radarShapeType }[] = [
  { label: "多边形", value: "polygon" },
  { label: "圆环", value: "circle" }
];

// 时间函数（从 app buildConfig/constants/animation 下沉）
export type timingFunctionType = "none" | "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
export const timingFunction: { label: string; value: timingFunctionType }[] = [
  { label: "无", value: "none" },
  { label: "匀速", value: "linear" },
  { label: "慢快慢", value: "ease" },
  { label: "慢速开始", value: "ease-in" },
  { label: "慢速结束", value: "ease-out" },
  { label: "慢速开始和结束", value: "ease-in-out" }
];
