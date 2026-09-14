import { InteractiveEnum } from "@screenwright/types";

import { interactiveEnum, mediaEnum, textEnum } from "@/components/componentEntry/type";
import { extendsEnumType } from "@/views/build/components/buildRender/core/ExtendsComponents/type";
import { sceneEnumType } from "@/views/build/components/buildRender/core/SceneComponent/type";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { FolderType } from "@/views/build/components/buildRender/type";

import { ExhibitEnumType } from "../../buildRender/core/ExhibitComponent/type";
import { allowEventComponentList } from "./event";

export { Action2ComponentType, ActionList, ActionTypeEnum } from "./action";
export type {
  ActionTypeType,
  animationOutPositionType,
  animationOutType,
  animationPositionType,
  animationType,
  timingFunctionType
} from "./animation";
export {
  ActionAnimationTypeEnum,
  actionTypeOptions,
  animationList,
  animationOutList,
  animationOutPosition,
  animationOutPositionEnum,
  animationPosition,
  animationPositionEnum,
  timingFunction
} from "./animation";
export {
  ConditionCompareEnum,
  conditionCompareOptions,
  ConditionLogicTypeEnum,
  conditionLogicTypeOptions,
  ConditionTypeEnum,
  conditionTypeOptions
} from "./condition";
export {
  EncodeEvent2ComponentType,
  EncodeEventList,
  EncodeEventTypeEnum,
  Event2ComponentType,
  EventList,
  EventTypeEnum
} from "./event";

export const firstLabelWidth = "100";
export const secondLabelWidth = "73";
export const thirdLabelWidth = "48";
export const fourthLabelWidth = "28";

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

/**
 * @description 不允许拖拽到分组中的组件
 */
export const notAllowToGroup = [
  FolderType.group,
  PanelType.dynamicPanel,
  PanelType.encodePanel,
  extendsEnumType.UePeerStreaming,
  extendsEnumType.UePixelStreaming,
  extendsEnumType.UeVessel,
  extendsEnumType.FtDigitalHuman,
  sceneEnumType.MapProjection,
  sceneEnumType.Maptalks,
  sceneEnumType.EchartcommonMap,
  sceneEnumType.EchartGlmap,
  sceneEnumType.Mapmars,
  sceneEnumType.ThreeScene,
  sceneEnumType.IndustryScene
];

export const notAllowToDynamicPanel = [
  PanelType.quotePanel,
  PanelType.encodePanel,
  sceneEnumType.MapProjection,
  sceneEnumType.Maptalks,
  sceneEnumType.EchartcommonMap,
  sceneEnumType.EchartGlmap,
  sceneEnumType.Mapmars,
  sceneEnumType.ThreeScene,
  sceneEnumType.IndustryScene
];

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
  {
    label: "空心圆",
    value: seriesSymbolEnum.emptyCircle
  },
  {
    label: "圆",
    value: seriesSymbolEnum.circle
  },
  {
    label: "方形",
    value: seriesSymbolEnum.rect
  },
  {
    label: "方圆形",
    value: seriesSymbolEnum.roundRect
  },
  {
    label: "三角形",
    value: seriesSymbolEnum.triangle
  },
  {
    label: "菱形",
    value: seriesSymbolEnum.diamond
  },
  {
    label: "水滴形",
    value: seriesSymbolEnum.pin
  },
  {
    label: "箭头形",
    value: seriesSymbolEnum.arrow
  },
  {
    label: "自定义",
    value: seriesSymbolEnum.image
  }
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

export enum lineLabelPositionEnum {
  start = "start",
  middle = "middle",
  end = "end"
}
export type lineLabelPositionType =
  | lineLabelPositionEnum.start
  | lineLabelPositionEnum.middle
  | lineLabelPositionEnum.end;
export const lineLabelPosition: { label: string; value: lineLabelPositionType }[] = [
  { label: "起始点", value: lineLabelPositionEnum.start },
  { label: "中点", value: lineLabelPositionEnum.middle },
  { label: "结束点", value: lineLabelPositionEnum.end }
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

export enum xAxisTypeEnum {
  category = "category",
  time = "time"
}
export type xAxisTypeType = xAxisTypeEnum.category | xAxisTypeEnum.time;
export const xAxisType: { label: string; value: xAxisTypeType; disabled?: boolean }[] = [
  { label: "类目型", value: xAxisTypeEnum.category },
  { label: "时间型", value: xAxisTypeEnum.time, disabled: true }
];

export const xAxisTimeType = [
  {
    label: "2020, 2021, ...",
    value: "{yyyy}"
  },
  {
    label: "00-99",
    value: "{yy}"
  },
  {
    label: "1, 2, 3, 4",
    value: "{Q}"
  },
  {
    label: "一月、二月、……",
    value: "{MMMM}"
  },
  {
    label: "1月、2月、……",
    value: "{MMM}"
  },
  {
    label: "01-12",
    value: "{MM}"
  },
  {
    label: "1-12",
    value: "{M}"
  },
  {
    label: "01-31",
    value: "{dd}"
  },
  {
    label: "1-31",
    value: "{d}"
  },
  {
    label: "星期日、星期一、星期二、星期三、星期四、星期五、星期六",
    value: "{eeee}"
  },
  {
    label: "日、一、二、三、四、五、六",
    value: "{ee}"
  },
  {
    label: "1-54",
    value: "{e}"
  },
  {
    label: "00-23",
    value: "{HH}"
  },
  {
    label: "0-23",
    value: "{H}"
  },
  {
    label: "01-12",
    value: "{hh}"
  },
  {
    label: "1-12",
    value: "{h}"
  },
  {
    label: "00-59",
    value: "{mm}"
  },
  {
    label: "0-59",
    value: "{m}"
  },
  {
    label: "00-59",
    value: "{ss}"
  },
  {
    label: "0-59",
    value: "{s}"
  },
  {
    label: "000-999",
    value: "{SSS}"
  },
  {
    label: "0-999",
    value: "{S}"
  }
];

export type radarShapeType = "polygon" | "circle";
export const radarShape: { label: string; value: radarShapeType }[] = [
  { label: "多边形", value: "polygon" },
  { label: "圆环", value: "circle" }
];

export enum VisibleTypeEnum {
  Show = "show",
  Hide = "hide"
}
export type VisibleType = VisibleTypeEnum.Show | VisibleTypeEnum.Hide;

// 显示类型
export const visibleTypeOptions: { label: string; value: VisibleType }[] = [
  { label: "显示", value: VisibleTypeEnum.Show },
  { label: "隐藏", value: VisibleTypeEnum.Hide }
];

export enum MessageTypeEnum {
  String = "string",
  Json = "json"
}
export type MessageType = MessageTypeEnum.String | MessageTypeEnum.Json;

// 消息相关
export const messageTypeOptions: { label: string; value: MessageType }[] = [
  { label: "字符串", value: MessageTypeEnum.String },
  { label: "JSON", value: MessageTypeEnum.Json }
];

export enum UeMessageTypeEnum {
  Default = "default"
}
export type UeMessageType = UeMessageTypeEnum.Default;

export const ueMessageTypeOptions: { label: string; value: UeMessageType }[] = [
  { label: "不作处理", value: UeMessageTypeEnum.Default }
];

export enum CustomTableListEnum {
  Click = "click"
}
export type CustomTableList = CustomTableListEnum.Click;

// 表格相关
export const customTableListOptions: { label: string; value: CustomTableList }[] = [
  { label: "鼠标点击", value: CustomTableListEnum.Click }
];

// TCP/UDP相关
export enum tcpudpDataTypeEnum {
  None = "",
  TCP = "1",
  UDP = "2",
  WebSocket = "3"
}
export type tcpudpDataType =
  | tcpudpDataTypeEnum.None
  | tcpudpDataTypeEnum.TCP
  | tcpudpDataTypeEnum.UDP
  | tcpudpDataTypeEnum.WebSocket;

export const tcpudpDataTypeOptions: { label: string; value: tcpudpDataType }[] = [
  { label: "TCP", value: tcpudpDataTypeEnum.TCP },
  { label: "UDP", value: tcpudpDataTypeEnum.UDP },
  { label: "WebSocket", value: tcpudpDataTypeEnum.WebSocket }
];

export enum UDPSendtypeEnum {
  Unicast = "unicast",
  Broadcasting = "broadcasting"
}
export type UDPSendtype = UDPSendtypeEnum.Unicast | UDPSendtypeEnum.Broadcasting;

export const UDPSendtypeListOptions: { label: string; value: UDPSendtype }[] = [
  { label: "单播", value: UDPSendtypeEnum.Unicast },
  { label: "广播", value: UDPSendtypeEnum.Broadcasting }
];

export enum ParameterTypeEnum {
  Default = "default",
  Custom = "custom"
}
export type ParameterType = ParameterTypeEnum.Default | ParameterTypeEnum.Custom;

// 参数类型
export const parameterTypeOptions: { label: string; value: ParameterType }[] = [
  { label: "默认", value: ParameterTypeEnum.Default },
  { label: "自定义", value: ParameterTypeEnum.Custom }
];

export enum ComponentScopeEnum {
  Current = "current",
  All = "all"
}
export type ComponentScope = ComponentScopeEnum.Current | ComponentScopeEnum.All;

export const componentScopeOptions: { label: string; value: ComponentScope }[] = [
  { label: "当前", value: ComponentScopeEnum.Current },
  { label: "全局", value: ComponentScopeEnum.All }
];
export enum CustomActionTypeEnum {
  Component = "component",
  Message = "message",
  StatusAnimation = "statusAnimation"
}
export type CustomActionType =
  | CustomActionTypeEnum.Component
  | CustomActionTypeEnum.Message
  | CustomActionTypeEnum.StatusAnimation;

export const customActionTypeOptions: { label: string; value: CustomActionType }[] = [
  { label: "组件", value: CustomActionTypeEnum.Component },
  { label: "通信", value: CustomActionTypeEnum.Message },
  { label: "状态动画", value: CustomActionTypeEnum.StatusAnimation }
];

export const buildRenderIgnore = [
  ".build-menu",
  ".drag_item",
  ".build-config",
  ".menu__item",
  ".sw-select-dropdown",
  ".popper-sw-single-color-picker",
  ".action-item",
  ".tox-toolbar__overflow",
  ".operation-item",
  ".el-color-picker__panel",
  ".fcolorpicker",
  ".data-interface-dialog",
  ".sw-message-box",
  ".sw-tooltip",
  ".el-autocomplete-suggestion",
  ".tox-tinymce-aux",
  ".build-render-ignore",
  ".status-animation-main",
  ".el-popover",
  // 数字人形象下拉框
  ".digital-human-image-select",
  ".el-dialog__body",
  ".el-dialog__header",
  ".sw-select-dropdown",
  ".el-radio__original",
  ".el-radio__label",
  ".is-drawer"
];

export const eventList = allowEventComponentList;

export enum originPointEnum {
  Center = "center",
  Bottom = "bottom"
}
export type originPointType = originPointEnum.Center | originPointEnum.Bottom;

export const originPoint: { label: string; value: originPointType }[] = [
  { label: "中心", value: originPointEnum.Center },
  { label: "正下方", value: originPointEnum.Bottom }
];

export enum followCameraEnum {
  All = "all",
  Horizontal = "horizontal",
  None = "none"
}
export type followCameraType = followCameraEnum.All | followCameraEnum.Horizontal | followCameraEnum.None;

export const followCamera: { label: string; value: followCameraType }[] = [
  { label: "同步相机视角", value: followCameraEnum.All },
  { label: "仅水平同步相机", value: followCameraEnum.Horizontal },
  { label: "不同步相机视角", value: followCameraEnum.None }
];

export enum mixBlendModeEnum {
  Normal = "normal",
  Multiply = "multiply",
  Screen = "screen",
  Overlay = "overlay",
  Darken = "darken",
  Lighten = "lighten",
  ColorDodge = "color-dodge",
  ColorBurn = "color-burn",
  HardLight = "hard-light",
  SoftLight = "soft-light",
  Difference = "difference",
  Exclusion = "exclusion",
  Hue = "hue",
  Saturation = "saturation",
  Color = "color",
  Luminosity = "luminosity"
}
export type mixBlendModeType =
  | mixBlendModeEnum.Normal
  | mixBlendModeEnum.Multiply
  | mixBlendModeEnum.Screen
  | mixBlendModeEnum.Overlay
  | mixBlendModeEnum.Darken
  | mixBlendModeEnum.Lighten
  | mixBlendModeEnum.ColorDodge
  | mixBlendModeEnum.ColorBurn
  | mixBlendModeEnum.HardLight
  | mixBlendModeEnum.SoftLight
  | mixBlendModeEnum.Difference
  | mixBlendModeEnum.Exclusion
  | mixBlendModeEnum.Hue
  | mixBlendModeEnum.Saturation
  | mixBlendModeEnum.Color
  | mixBlendModeEnum.Luminosity;

export const mixBlendMode: { label: string; value: mixBlendModeType }[] = [
  { label: "正常", value: mixBlendModeEnum.Normal },
  { label: "正片叠底", value: mixBlendModeEnum.Multiply },
  { label: "滤色", value: mixBlendModeEnum.Screen },
  { label: "叠加", value: mixBlendModeEnum.Overlay },
  { label: "变暗", value: mixBlendModeEnum.Darken },
  { label: "变亮", value: mixBlendModeEnum.Lighten },
  { label: "颜色减淡", value: mixBlendModeEnum.ColorDodge },
  { label: "颜色加深", value: mixBlendModeEnum.ColorBurn },
  { label: "强光", value: mixBlendModeEnum.HardLight },
  { label: "柔光", value: mixBlendModeEnum.SoftLight },
  { label: "差值", value: mixBlendModeEnum.Difference },
  { label: "排除", value: mixBlendModeEnum.Exclusion },
  { label: "色相", value: mixBlendModeEnum.Hue },
  { label: "饱和度", value: mixBlendModeEnum.Saturation },
  { label: "颜色", value: mixBlendModeEnum.Color },
  { label: "亮度", value: mixBlendModeEnum.Luminosity }
];

export enum iconContentEnum {
  Text = "text",
  Icon = "icon"
}
export type iconContentType = iconContentEnum.Text | iconContentEnum.Icon;

export const iconContent: { label: string; value: iconContentType }[] = [
  { label: "文字", value: iconContentEnum.Text },
  { label: "图标", value: iconContentEnum.Icon }
];

export enum iconSizeEnum {
  Fix = "fix",
  Real = "real"
}
export type iconSizeType = iconSizeEnum.Fix | iconSizeEnum.Real;

export const iconSize: { label: string; value: iconSizeType }[] = [
  { label: "固定大小", value: iconSizeEnum.Fix },
  { label: "真实大小", value: iconSizeEnum.Real }
];

export enum SceneObjectExplosionType {
  Explode = "explode",
  Restore = "restore"
}
export type sceneObjectExplosionType = SceneObjectExplosionType.Explode | SceneObjectExplosionType.Restore;

export const sceneObjectExplosionTypeOptions: { label: string; value: sceneObjectExplosionType }[] = [
  { label: "爆炸", value: SceneObjectExplosionType.Explode },
  { label: "恢复", value: SceneObjectExplosionType.Restore }
];

export enum TwinPanelIconCorrelationEnum {
  Default = "default",
  ExplodedTag = "explodedTag",
  ExplodedBackground = "explodedBackground"
}
export type twinPanelIconCorrelationType =
  | TwinPanelIconCorrelationEnum.Default
  | TwinPanelIconCorrelationEnum.ExplodedTag
  | TwinPanelIconCorrelationEnum.ExplodedBackground;

export const twinPanelIconCorrelation: { label: string; value: TwinPanelIconCorrelationEnum }[] = [
  { label: "默认", value: TwinPanelIconCorrelationEnum.Default },
  { label: "爆炸图标签", value: TwinPanelIconCorrelationEnum.ExplodedTag },
  { label: "爆炸图背景", value: TwinPanelIconCorrelationEnum.ExplodedBackground }
];

export const excludeDataConfig = [
  PanelType.artifactAppPreview,
  textEnum.FtDatetime,
  interactiveEnum.FtVoiceControl,
  textEnum.FtRichtext,
  sceneEnumType.MapProjection,
  sceneEnumType.Maptalks,
  sceneEnumType.Mapmars,
  sceneEnumType.ThreeScene,
  sceneEnumType.IndustryScene,
  PanelType.dynamicPanel,
  PanelType.encodePanel,
  extendsEnumType.PageReload,
  extendsEnumType.FtMaskLayer,
  extendsEnumType.SimpleParticle,
  extendsEnumType.SimpleStar,
  extendsEnumType.FullScreenSwitch,
  mediaEnum.FtImgBorder,
  PanelType.quotePanel,
  ExhibitEnumType.FtFilter,
  ExhibitEnumType.verticalCard,
  mediaEnum.FtSwiperCard,
  InteractiveEnum.videoProgress
];
