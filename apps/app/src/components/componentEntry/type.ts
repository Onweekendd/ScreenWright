import { IndicatorEnum, InteractiveEnum, MediaEnum, TextEnum, ThreeComponentEnum } from "@screenwright/types";

// 从 @screenwright/types 重新导出所有枚举，保持本地命名
export { TextEnum as textEnum };
export const renderTextComponentType: TextEnum[] = [
  TextEnum.CustomCollapse,
  TextEnum.SwRichtext,
  TextEnum.SwCollection,
  TextEnum.CustomTableList,
  TextEnum.SwTextWordCloud,
  TextEnum.SwMultiLine,
  TextEnum.SwText,
  TextEnum.SwProgress,
  TextEnum.SwDatetime,
  TextEnum.SwText2,
  TextEnum.SwScroll
];

// 指标组件
export { IndicatorEnum as indicatorEnum };
export const renderIndicatorComponentType: IndicatorEnum[] = [
  IndicatorEnum.RasterProgressBar,
  IndicatorEnum.IconRatio,
  IndicatorEnum.SortRatioBar,
  IndicatorEnum.SwDynamicRatio,
  IndicatorEnum.SwFlopPerformance,
  IndicatorEnum.EchartRing,
  IndicatorEnum.RankProgress
];

// 媒体组件
export { MediaEnum as mediaEnum };
export const renderMediaComponentType: MediaEnum[] = [
  MediaEnum.SwSwiperCard,
  MediaEnum.SwEmbedAudio,
  MediaEnum.SwIframe,
  MediaEnum.SwImg,
  MediaEnum.SwOpenVideo,
  MediaEnum.SwImgBorder,
  MediaEnum.SwSwiper,
  MediaEnum.SwSwiperV3,
  MediaEnum.SwVideo,
  MediaEnum.CtVideoPanel
];

// 交互组件
export { InteractiveEnum as interactiveEnum };
export const renderInteractiveComponentType: InteractiveEnum[] = [
  InteractiveEnum.SwVoiceControl,
  InteractiveEnum.FormCheckbox,
  InteractiveEnum.FormNavMenu,
  InteractiveEnum.ScrollPicker,
  InteractiveEnum.PointTimeline,
  InteractiveEnum.FormSwitch,
  InteractiveEnum.FormSlider,
  InteractiveEnum.MultiSubtabs,
  InteractiveEnum.RollSubtabs,
  InteractiveEnum.SwCascader,
  InteractiveEnum.SwSingleSelectedLegend,
  InteractiveEnum.SwDateTimePicker,
  InteractiveEnum.SwCustomSelect,
  InteractiveEnum.SwLegend,
  InteractiveEnum.SwPageQuery,
  InteractiveEnum.SwPageTurning,
  InteractiveEnum.Subtabs,
  InteractiveEnum.SwMutual,
  InteractiveEnum.SwSearch,
  InteractiveEnum.SwTimerShaft,
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
