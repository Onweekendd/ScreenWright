import { IndicatorEnum, InteractiveEnum, MediaEnum, TextEnum, ThreeComponentEnum } from "@screenwright/types";

// 从 @screenwright/types 重新导出所有枚举，保持本地命名
export { TextEnum as textEnum };
export const renderTextComponentType: TextEnum[] = [
  TextEnum.CustomCollapse,
  TextEnum.FtRichtext,
  TextEnum.FtCollection,
  TextEnum.CustomTableList,
  TextEnum.FtTextWordCloud,
  TextEnum.FtMultiLine,
  TextEnum.FtText,
  TextEnum.FtProgress,
  TextEnum.FtDatetime,
  TextEnum.FtText2,
  TextEnum.FtScroll
];

// 指标组件
export { IndicatorEnum as indicatorEnum };
export const renderIndicatorComponentType: IndicatorEnum[] = [
  IndicatorEnum.RasterProgressBar,
  IndicatorEnum.IconRatio,
  IndicatorEnum.SortRatioBar,
  IndicatorEnum.FtDynamicRatio,
  IndicatorEnum.FtFlopPerformance,
  IndicatorEnum.EchartRing,
  IndicatorEnum.RankProgress
];

// 媒体组件
export { MediaEnum as mediaEnum };
export const renderMediaComponentType: MediaEnum[] = [
  MediaEnum.FtSwiperCard,
  MediaEnum.FtEmbedAudio,
  MediaEnum.FtIframe,
  MediaEnum.FtImg,
  MediaEnum.FtOpenVideo,
  MediaEnum.FtImgBorder,
  MediaEnum.FtSwiper,
  MediaEnum.FtSwiperV3,
  MediaEnum.FtVideo,
  MediaEnum.CtVideoPanel
];

// 交互组件
export { InteractiveEnum as interactiveEnum };
export const renderInteractiveComponentType: InteractiveEnum[] = [
  InteractiveEnum.FtVoiceControl,
  InteractiveEnum.FormCheckbox,
  InteractiveEnum.FormNavMenu,
  InteractiveEnum.ScrollPicker,
  InteractiveEnum.PointTimeline,
  InteractiveEnum.FormSwitch,
  InteractiveEnum.FormSlider,
  InteractiveEnum.MultiSubtabs,
  InteractiveEnum.RollSubtabs,
  InteractiveEnum.FtCascader,
  InteractiveEnum.FtSingleSelectedLegend,
  InteractiveEnum.FtDateTimePicker,
  InteractiveEnum.FtCustomSelect,
  InteractiveEnum.FtLegend,
  InteractiveEnum.FtPageQuery,
  InteractiveEnum.FtPageTurning,
  InteractiveEnum.Subtabs,
  InteractiveEnum.FtMutual,
  InteractiveEnum.FtSearch,
  InteractiveEnum.FtTimerShaft,
  InteractiveEnum.videoProgress
];

/**
 * @description 三维组件
 * TODO: 组件未添加
 */
export { ThreeComponentEnum as threeComponentEnum };
export const renderThreeComponentType: ThreeComponentEnum[] = [
  ThreeComponentEnum.MapTalks,
  ThreeComponentEnum.Threescene,
  ThreeComponentEnum.ThreeSceneIconList,
  ThreeComponentEnum.ThreeSceneTwinIconList,
  ThreeComponentEnum.ThreeSceneTwinPanelIconList,
  ThreeComponentEnum.IndustryScene,
  ThreeComponentEnum.ThreeMapMapGlIcon
];

export type component2DType = TextEnum | IndicatorEnum | MediaEnum | InteractiveEnum | ThreeComponentEnum;

export const component2DTypeList: component2DType[] = [
  ...renderTextComponentType,
  ...renderIndicatorComponentType,
  ...renderMediaComponentType,
  ...renderInteractiveComponentType,
  ...renderThreeComponentType
];
