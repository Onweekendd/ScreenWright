import type { z } from "zod";

import { echartareaLineDataSchema, echartareaLineOptionSchema } from "./echart/echartareaLine";
import { echartbarDataSchema, echartbarOptionSchema } from "./echart/echartbar";
import { echartbothWayStripBarDataSchema, echartbothWayStripBarOptionSchema } from "./echart/echartbothWayStripBar";
import { echartdoubleValueLineDataSchema, echartdoubleValueLineOptionSchema } from "./echart/echartdoubleValueLine";
import { echarteffectScatterDataSchema, echarteffectScatterOptionSchema } from "./echart/echarteffectScatter";
import { echartfunnelDataSchema, echartfunnelOptionSchema } from "./echart/echartfunnel";
import { echartgraphDataSchema, echartgraphOptionSchema } from "./echart/echartgraph";
import { echartgrowthRateBarDataSchema, echartgrowthRateBarOptionSchema } from "./echart/echartgrowthRateBar";
import { echartlineDataSchema, echartlineOptionSchema } from "./echart/echartline";
import { echartlineAndBarDataSchema, echartlineAndBarOptionSchema } from "./echart/echartlineAndBar";
import { echartloopRingPieDataSchema, echartloopRingPieOptionSchema } from "./echart/echartloopRingPie";
import { echartmultiplyRankBarDataSchema, echartmultiplyRankBarOptionSchema } from "./echart/echartmultiplyRankBar";
import { echartoverlapBarDataSchema, echartoverlapBarOptionSchema } from "./echart/echartoverlapBar";
import { echartpictorialbarDataSchema, echartpictorialbarOptionSchema } from "./echart/echartpictorialbar";
import { echartpieDataSchema, echartpieOptionSchema } from "./echart/echartpie";
import { echartpluralRosePieDataSchema, echartpluralRosePieOptionSchema } from "./echart/echartpluralRosePie";
import { echartradarDataSchema, echartradarOptionSchema } from "./echart/echartradar";
import { echartrankDataSchema, echartrankOptionSchema } from "./echart/echartrank";
import { echartrankBarDataSchema, echartrankBarOptionSchema } from "./echart/echartrankBar";
import { echartsankeyDataSchema, echartsankeyOptionSchema } from "./echart/echartsankey";
import { echartscalePieDataSchema, echartscalePieOptionSchema } from "./echart/echartscalePie";
import { echartscatterDataSchema, echartscatterOptionSchema } from "./echart/echartscatter";
import { echartstripBarDataSchema, echartstripBarOptionSchema } from "./echart/echartstripBar";
import { echartthinBarDataSchema, echartthinBarOptionSchema } from "./echart/echartthinBar";
import { echartthreedBarDataSchema, echartthreedBarOptionSchema } from "./echart/echartthreedBar";
import { echartthreedBarAndLineDataSchema, echartthreedBarAndLineOptionSchema } from "./echart/echartthreedBarAndLine";
import { echartthreePieDataSchema, echartthreePieOptionSchema } from "./echart/echartthreePie";
import { echartthreeQuartersPieDataSchema, echartthreeQuartersPieOptionSchema } from "./echart/echartthreeQuartersPie";
import { echarttreemapDataSchema, echarttreemapOptionSchema } from "./echart/echarttreemap";
import { echartzebraDataSchema, echartzebraOptionSchema } from "./echart/echartzebra";
import { echartzebra2DataSchema, echartzebra2OptionSchema } from "./echart/echartzebra2";
import { echartzebraBarAndLineDataSchema, echartzebraBarAndLineOptionSchema } from "./echart/echartzebraBarAndLine";
import { swDataContainerDataSchema, swDataContainerOptionSchema } from "./extends/sw-dataContainer";
import { swDigitalHumanDataSchema, swDigitalHumanOptionSchema } from "./extends/sw-digital-human";
import { swMaskLayerDataSchema, swMaskLayerOptionSchema } from "./extends/sw-mask-layer";
import { swTopoContainerDataSchema, swTopoContainerOptionSchema } from "./extends/sw-topo-container";
import { swUnrealEngineDataSchema, swUnrealEngineOptionSchema } from "./extends/sw-unreal-engine";
import { swWeatherDataSchema, swWeatherOptionSchema } from "./extends/sw-weather";
import { fullScreenSwitchDataSchema, fullScreenSwitchOptionSchema } from "./extends/fullScreenSwitch";
import { pageReloadDataSchema, pageReloadOptionSchema } from "./extends/pageReload";
import { photoSphereViewerDataSchema, photoSphereViewerOptionSchema } from "./extends/photo-sphere-viewer";
import { simpleBarrageDataSchema, simpleBarrageOptionSchema } from "./extends/simple-barrage";
import { simpleParticleDataSchema, simpleParticleOptionSchema } from "./extends/simple-particle";
import { simpleStarDataSchema, simpleStarOptionSchema } from "./extends/simpleStar";
import { uePeerStreamingDataSchema, uePeerStreamingOptionSchema } from "./extends/ue-peer-streaming";
import { uePixelStreamingDataSchema, uePixelStreamingOptionSchema } from "./extends/ue-pixel-streaming";
import { ueVesselDataSchema, ueVesselOptionSchema } from "./extends/ue-vessel";
import { echartGaugeDataSchema, echartGaugeOptionSchema } from "./indicator/echartgauge";
import { echartLiquidFillDataSchema, echartLiquidFillOptionSchema } from "./indicator/echartliquidFill";
import { echartprogressDataSchema, echartprogressOptionSchema } from "./indicator/echartprogress";
import { echartRingDataSchema, echartRingOptionSchema } from "./indicator/echartring";
import { echartWordcloudDataSchema, echartWordcloudOptionSchema } from "./indicator/echartwordcloud";
import { ftdynamicratioDataSchema, ftdynamicratioOptionSchema } from "./indicator/swdynamicratio";
import { swFlopPerformanceDataSchema, swFlopPerformanceOptionSchema } from "./indicator/swFlopPerformance";
import { swPeriodictableDataSchema, swPeriodictableOptionSchema } from "./indicator/swPeriodictable";
import { iconRatioDataSchema, iconRatioOptionSchema } from "./indicator/iconRatio";
import { rankProgressDataSchema, rankProgressOptionSchema } from "./indicator/rank-progress";
import { rasterProgressBarDataSchema, rasterProgressBarOptionSchema } from "./indicator/rasterProgressBar";
import { sortRatioBarDataSchema, sortRatioBarOptionSchema } from "./indicator/sortRatioBar";
import { formCheckboxDataSchema, formCheckboxOptionSchema } from "./interactive/formCheckbox";
import { formNavMenuDataSchema, formNavMenuOptionSchema } from "./interactive/formNavMenu";
import { formSliderDataSchema, formSliderOptionSchema } from "./interactive/formSlider";
import { formSwitchDataSchema, formSwitchOptionSchema } from "./interactive/formSwitch";
import { swMutualDataSchema, swMutualOptionSchema } from "./interactive/sw-mutual";
import { swSearchDataSchema, swSearchOptionSchema } from "./interactive/sw-search";
import { swVoiceControlDataSchema, swVoiceControlOptionSchema } from "./interactive/sw-voice-control";
import { swCascaderDataSchema, swCascaderOptionSchema } from "./interactive/swCascader";
import { swCustomSelectDataSchema, swCustomSelectOptionSchema } from "./interactive/swCustomSelect";
import { swDateTimePickerDataSchema, swDateTimePickerOptionSchema } from "./interactive/swDateTimePicker";
import { swLegendDataSchema, swLegendOptionSchema } from "./interactive/swLegend";
import { swPageQueryDataSchema, swPageQueryOptionSchema } from "./interactive/swPageQuery";
import { swPageTurningDataSchema, swPageTurningOptionSchema } from "./interactive/swPageTurning";
import {
  swSingleSelectedLegendDataSchema,
  swSingleSelectedLegendOptionSchema
} from "./interactive/swSingleSelectedLegend";
import { swTimerShaftDataSchema, swTimerShaftOptionSchema } from "./interactive/swTimerShaft";
import { multiSubtabsDataSchema, multiSubtabsOptionSchema } from "./interactive/multi-subtabs";
import { pointTimelineDataSchema, pointTimelineOptionSchema } from "./interactive/pointTimeline";
import { rollSubtabsDataSchema, rollSubtabsOptionSchema } from "./interactive/roll-subtabs";
import { scrollPickerDataSchema, scrollPickerOptionSchema } from "./interactive/scrollPicker";
import { subtabsDataSchema, subtabsOptionSchema } from "./interactive/subtabs";
import { ctVideoPanelDataSchema, ctVideoPanelOptionSchema } from "./media/ctVideoPanel";
import { swEmbedAudioDataSchema, swEmbedAudioOptionSchema } from "./media/sw-embed-audio";
import { swOpenVideoDataSchema, swOpenVideoOptionSchema } from "./media/sw-open-video";
import { ftiframeDataSchema, ftiframeOptionSchema } from "./media/swiframe";
import { ftimgDataSchema, ftimgOptionSchema } from "./media/swimg";
import { ftswiperDataSchema, ftswiperOptionSchema } from "./media/swswiper";
import { swSwiperCardDataSchema, swSwiperCardOptionSchema } from "./media/swSwiperCard";
import { ftvideoDataSchema, ftvideoOptionSchema } from "./media/swvideo";
import { ArtifactAppPreviewDataSchema, ArtifactAppPreviewOptionSchema } from "./system/artifact-app-preview";
import { customCollapseDataSchema, customCollapseOptionSchema } from "./text/customCollapse";
import { customTableListDataSchema, customTableListOptionSchema } from "./text/customTableList";
import { ftcollectionDataSchema, ftcollectionOptionSchema } from "./text/swcollection";
import { ftdatetimeDataSchema, ftdatetimeOptionSchema } from "./text/swdatetime";
import { swMultiLineDataSchema, swMultiLineOptionSchema } from "./text/swmultiLine";
import { swProgressDataSchema, swProgressOptionSchema } from "./text/swProgress";
import { swRichtextDataSchema, swRichtextOptionSchema } from "./text/swRichtext";
import { swScrollDataSchema, swScrollOptionSchema } from "./text/swScroll";
import { swTextDataSchema, swTextOptionSchema } from "./text/swtext";
import { swText2DataSchema, swText2OptionSchema } from "./text/swText2";
import { swTextWordCloudDataSchema, swTextWordCloudOptionSchema } from "./text/swTextWordCloud";
import { customComponentDataSchema, customComponentOptionSchema } from "./third-party/custom-component";
import { datavDataSchema, datavOptionSchema } from "./third-party/datav";
import { echartcommonDataSchema, echartcommonOptionSchema } from "./third-party/echartcommon";
import { vuePartDataSchema, vuePartOptionSchema } from "./third-party/vue-part";

export const componentPropSchemaMap = {
  "artifact-app-preview": {
    data: ArtifactAppPreviewDataSchema,
    option: ArtifactAppPreviewOptionSchema
  },
  ctVideoPanel: { data: ctVideoPanelDataSchema, option: ctVideoPanelOptionSchema },
  customCollapse: { data: customCollapseDataSchema, option: customCollapseOptionSchema },
  customTableList: { data: customTableListDataSchema, option: customTableListOptionSchema },
  ftcollection: { data: ftcollectionDataSchema, option: ftcollectionOptionSchema },
  ftdatetime: { data: ftdatetimeDataSchema, option: ftdatetimeOptionSchema },
  ftmultiLine: { data: swMultiLineDataSchema, option: swMultiLineOptionSchema },
  ftProgress: { data: swProgressDataSchema, option: swProgressOptionSchema },
  ftRichtext: { data: swRichtextDataSchema, option: swRichtextOptionSchema },
  ftScroll: { data: swScrollDataSchema, option: swScrollOptionSchema },
  ftText2: { data: swText2DataSchema, option: swText2OptionSchema },
  fttext: { data: swTextDataSchema, option: swTextOptionSchema },
  ftTextWordCloud: { data: swTextWordCloudDataSchema, option: swTextWordCloudOptionSchema },
  echartareaLine: { data: echartareaLineDataSchema, option: echartareaLineOptionSchema },
  echartbar: { data: echartbarDataSchema, option: echartbarOptionSchema },
  echartbothWayStripBar: { data: echartbothWayStripBarDataSchema, option: echartbothWayStripBarOptionSchema },
  echartdoubleValueLine: { data: echartdoubleValueLineDataSchema, option: echartdoubleValueLineOptionSchema },
  echarteffectScatter: { data: echarteffectScatterDataSchema, option: echarteffectScatterOptionSchema },
  echartfunnel: { data: echartfunnelDataSchema, option: echartfunnelOptionSchema },
  echartgraph: { data: echartgraphDataSchema, option: echartgraphOptionSchema },
  echartgrowthRateBar: { data: echartgrowthRateBarDataSchema, option: echartgrowthRateBarOptionSchema },
  echartline: { data: echartlineDataSchema, option: echartlineOptionSchema },
  echartlineAndBar: { data: echartlineAndBarDataSchema, option: echartlineAndBarOptionSchema },
  echartloopRingPie: { data: echartloopRingPieDataSchema, option: echartloopRingPieOptionSchema },
  echartmultiplyRankBar: { data: echartmultiplyRankBarDataSchema, option: echartmultiplyRankBarOptionSchema },
  echartoverlapBar: { data: echartoverlapBarDataSchema, option: echartoverlapBarOptionSchema },
  echartpictorialbar: { data: echartpictorialbarDataSchema, option: echartpictorialbarOptionSchema },
  echartpie: { data: echartpieDataSchema, option: echartpieOptionSchema },
  echartpluralRosePie: { data: echartpluralRosePieDataSchema, option: echartpluralRosePieOptionSchema },
  echartradar: { data: echartradarDataSchema, option: echartradarOptionSchema },
  echartrank: { data: echartrankDataSchema, option: echartrankOptionSchema },
  echartrankBar: { data: echartrankBarDataSchema, option: echartrankBarOptionSchema },
  echartsankey: { data: echartsankeyDataSchema, option: echartsankeyOptionSchema },
  echartscalePie: { data: echartscalePieDataSchema, option: echartscalePieOptionSchema },
  echartscatter: { data: echartscatterDataSchema, option: echartscatterOptionSchema },
  echartstripBar: { data: echartstripBarDataSchema, option: echartstripBarOptionSchema },
  echartthinBar: { data: echartthinBarDataSchema, option: echartthinBarOptionSchema },
  echartthreedBar: { data: echartthreedBarDataSchema, option: echartthreedBarOptionSchema },
  echartthreedBarAndLine: { data: echartthreedBarAndLineDataSchema, option: echartthreedBarAndLineOptionSchema },
  echartthreePie: { data: echartthreePieDataSchema, option: echartthreePieOptionSchema },
  echartthreeQuartersPie: { data: echartthreeQuartersPieDataSchema, option: echartthreeQuartersPieOptionSchema },
  echarttreemap: { data: echarttreemapDataSchema, option: echarttreemapOptionSchema },
  echartzebra: { data: echartzebraDataSchema, option: echartzebraOptionSchema },
  echartzebra2: { data: echartzebra2DataSchema, option: echartzebra2OptionSchema },
  echartzebraBarAndLine: { data: echartzebraBarAndLineDataSchema, option: echartzebraBarAndLineOptionSchema },
  "rank-progress": { data: rankProgressDataSchema, option: rankProgressOptionSchema },
  rasterProgressBar: { data: rasterProgressBarDataSchema, option: rasterProgressBarOptionSchema },
  "sw-embed-audio": { data: swEmbedAudioDataSchema, option: swEmbedAudioOptionSchema },
  ftiframe: { data: ftiframeDataSchema, option: ftiframeOptionSchema },
  ftimg: { data: ftimgDataSchema, option: ftimgOptionSchema },
  ftOpenVideo: { data: swOpenVideoDataSchema, option: swOpenVideoOptionSchema },
  ftSwiperCard: { data: swSwiperCardDataSchema, option: swSwiperCardOptionSchema },
  ftswiper: { data: ftswiperDataSchema, option: ftswiperOptionSchema },
  ftvideo: { data: ftvideoDataSchema, option: ftvideoOptionSchema },
  sortRatioBar: { data: sortRatioBarDataSchema, option: sortRatioBarOptionSchema },
  echartgauge: { data: echartGaugeDataSchema, option: echartGaugeOptionSchema },
  echartliquidFill: { data: echartLiquidFillDataSchema, option: echartLiquidFillOptionSchema },
  echartring: { data: echartRingDataSchema, option: echartRingOptionSchema },
  echartwordcloud: { data: echartWordcloudDataSchema, option: echartWordcloudOptionSchema },
  iconRatio: { data: iconRatioDataSchema, option: iconRatioOptionSchema },
  echartprogress: { data: echartprogressDataSchema, option: echartprogressOptionSchema },
  ftFlopPerformance: { data: swFlopPerformanceDataSchema, option: swFlopPerformanceOptionSchema },
  ftdynamicratio: { data: ftdynamicratioDataSchema, option: ftdynamicratioOptionSchema },
  ftPeriodictable: { data: swPeriodictableDataSchema, option: swPeriodictableOptionSchema },
  "custom-component": { data: customComponentDataSchema, option: customComponentOptionSchema },
  datav: { data: datavDataSchema, option: datavOptionSchema },
  echartcommon: { data: echartcommonDataSchema, option: echartcommonOptionSchema },
  "vue-part": { data: vuePartDataSchema, option: vuePartOptionSchema },
  // 交互组件
  formCheckbox: { data: formCheckboxDataSchema, option: formCheckboxOptionSchema },
  formNavMenu: { data: formNavMenuDataSchema, option: formNavMenuOptionSchema },
  formSlider: { data: formSliderDataSchema, option: formSliderOptionSchema },
  formSwitch: { data: formSwitchDataSchema, option: formSwitchOptionSchema },
  ftCascader: { data: swCascaderDataSchema, option: swCascaderOptionSchema },
  ftCustomSelect: { data: swCustomSelectDataSchema, option: swCustomSelectOptionSchema },
  ftDateTimePicker: { data: swDateTimePickerDataSchema, option: swDateTimePickerOptionSchema },
  ftLegend: { data: swLegendDataSchema, option: swLegendOptionSchema },
  "sw-mutual": { data: swMutualDataSchema, option: swMutualOptionSchema },
  ftPageQuery: { data: swPageQueryDataSchema, option: swPageQueryOptionSchema },
  ftPageTurning: { data: swPageTurningDataSchema, option: swPageTurningOptionSchema },
  "sw-search": { data: swSearchDataSchema, option: swSearchOptionSchema },
  ftSingleSelectedLegend: { data: swSingleSelectedLegendDataSchema, option: swSingleSelectedLegendOptionSchema },
  ftTimerShaft: { data: swTimerShaftDataSchema, option: swTimerShaftOptionSchema },
  "sw-voice-control": { data: swVoiceControlDataSchema, option: swVoiceControlOptionSchema },
  "multi-subtabs": { data: multiSubtabsDataSchema, option: multiSubtabsOptionSchema },
  pointTimeline: { data: pointTimelineDataSchema, option: pointTimelineOptionSchema },
  "roll-subtabs": { data: rollSubtabsDataSchema, option: rollSubtabsOptionSchema },
  scrollPicker: { data: scrollPickerDataSchema, option: scrollPickerOptionSchema },
  subtabs: { data: subtabsDataSchema, option: subtabsOptionSchema },
  // 扩展组件
  "sw-dataContainer": { data: swDataContainerDataSchema, option: swDataContainerOptionSchema },
  "sw-digital-human": { data: swDigitalHumanDataSchema, option: swDigitalHumanOptionSchema },
  "sw-mask-layer": { data: swMaskLayerDataSchema, option: swMaskLayerOptionSchema },
  "sw-topo-container": { data: swTopoContainerDataSchema, option: swTopoContainerOptionSchema },
  "sw-unreal-engine": { data: swUnrealEngineDataSchema, option: swUnrealEngineOptionSchema },
  "sw-weather": { data: swWeatherDataSchema, option: swWeatherOptionSchema },
  fullScreenSwitch: { data: fullScreenSwitchDataSchema, option: fullScreenSwitchOptionSchema },
  pageReload: { data: pageReloadDataSchema, option: pageReloadOptionSchema },
  "photo-sphere-viewer": { data: photoSphereViewerDataSchema, option: photoSphereViewerOptionSchema },
  "simple-barrage": { data: simpleBarrageDataSchema, option: simpleBarrageOptionSchema },
  "simple-particle": { data: simpleParticleDataSchema, option: simpleParticleOptionSchema },
  simpleStar: { data: simpleStarDataSchema, option: simpleStarOptionSchema },
  "ue-peer-streaming": { data: uePeerStreamingDataSchema, option: uePeerStreamingOptionSchema },
  "ue-pixel-streaming": { data: uePixelStreamingDataSchema, option: uePixelStreamingOptionSchema },
  "ue-vessel": { data: ueVesselDataSchema, option: ueVesselOptionSchema }
} as const;

export type ComponentProp = keyof typeof componentPropSchemaMap;

export type ComponentPropSchemas = {
  [K in ComponentProp]: {
    data: z.ZodType;
    option: z.ZodType;
  };
};
