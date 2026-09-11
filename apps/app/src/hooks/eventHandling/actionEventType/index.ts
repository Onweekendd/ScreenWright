import type { EventTypeEnum } from "@screenwright/types";
import { type ExtendsEnum } from "@screenwright/types";

import type { interactiveEnum, mediaEnum, textEnum } from "@/components/componentEntry/type";
import type {
  BarEchartType,
  lineEchartsType,
  pieEchartType,
  projectEchartType,
  scatterEchartType
} from "@/views/build/components/buildRender/core/BaseComponent/type";
import type { EquipmentEnumType } from "@/views/build/components/buildRender/core/EquipmentComponent/type";
import type { ExhibitEnumType } from "@/views/build/components/buildRender/core/ExhibitComponent/type";
import type { extendsEnumType } from "@/views/build/components/buildRender/core/ExtendsComponents/type";
import type { sceneEnumType } from "@/views/build/components/buildRender/core/SceneComponent/type";
import type { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { ThirdPartEnumType } from "@/views/build/components/buildRender/core/ThirdParty/type";
import type { LayerInfo, SceneObjectExplosion } from "@/views/build/components/buildRender/type";

/**
 * 组件属性映射事件
 */
interface DynamicPanelEvents {
  [key: `${PanelType.dynamicPanel}-${string}`]: {
    /**
     * 动态面板切换状态方法
     */
    changeStatus: (targetStatusId: string) => Promise<void>;

    /**
     * 动态面板切换状态方法
     */
    toPrevStatus: () => Promise<void>;

    /**
     * 动态面板切换状态方法
     */
    toNextStatus: () => Promise<void>;
    /**
     * 设置巡检方法
     */
    setupPatrolAction: (type: "turnOnPatrol" | "pausePatrol" | "restartPatrol" | "pauseScroll" | "startScroll") => void;
  };
}

interface ThreeSceneEvents {
  [key: `${sceneEnumType.ThreeScene}-${number}`]: {
    /**
     * 场景面板切换场景状态方法
     */
    updateSceneStatusIndex: (index: number) => void;
    updateSceneObjectVisible: (index: string | string[], visible: boolean) => void;
    updateSceneChildComponentVisible: (index: any[], visible: boolean) => void;
    setMapBoxBom: (element: HTMLElement, index: string, boxOffsetX: number, boxOffsetY: number) => void;
    handleSceneFunction: (func: string) => void;
    setAnimationPlay: (animation: string) => void;
    setAnimationPause: (animation: string) => void;
    setStateAnimationPlay: (animation: string, state: number) => void;
    handleSceneObjectExplosion: (sceneObjectExplosion: SceneObjectExplosion) => void;
  };
}
interface IndustrySceneEvents {
  [key: `${sceneEnumType.IndustryScene}-${number}`]: {
    /**
     * 场景面板切换场景状态方法
     */
    updateSceneStatusIndex: (index: number) => void;
    updateSceneObjectVisible: (index: string | string[], visible: boolean) => void;
    updateSceneChildComponentVisible: (index: any[], visible: boolean) => void;
    setMapBoxBom: (element: HTMLElement, index: string, boxOffsetX: number, boxOffsetY: number) => void;
    handleSceneFunction: (func: string) => void;
    setAnimationPlay: (animation: string) => void;
    setAnimationPause: (animation: string) => void;
    setStateAnimationPlay: (animation: string, state: number) => void;
    switchSceneLevel: (sceneLevelId: number) => void;
  };
}

interface CitySceneEvents {
  [key: `${sceneEnumType.Maptalks}-${number}`]: {
    /**
     * 场景面板切换场景状态方法
     */
    updateSceneStatusIndex: (index: number) => void;
    updateSceneObjectVisible: (index: string | string[], visible: boolean) => void;
    /** 切换城市模板视角（0-based） */
    switchSceneRoamIndex: (index: number) => void;
    handleSceneFunction: (func: string) => void;
    updateFocusBIMLayer: (layerInfo: LayerInfo) => void;
  };
}

interface SubtabsEvents {
  [key: `${interactiveEnum.Subtabs}-${string}`]: {
    /**
     * @description 点击事件
     * @param info - 组件数据
     * @param isExecuteOnlyConditionSatisfied - 是否仅执行满足条件的事件，默认false
     */
    handleClick: (
      info: any,
      option?: { isExecuteOnlyConditionSatisfied?: boolean; triggerType?: EventTypeEnum }
    ) => void;
  };
}

interface MultiSubtabsEvents {
  [key: `${interactiveEnum.MultiSubtabs}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface RollSubtabsEvents {
  [key: `${interactiveEnum.RollSubtabs}-${string}`]: {
    /**
     * @description 点击事件
     * @param info - 组件数据
     * @param isExecuteOnlyConditionSatisfied - 是否仅执行满足条件的事件，默认false
     */
    handleClick: (
      info: any,
      option?: { isExecuteOnlyConditionSatisfied?: boolean; triggerType?: EventTypeEnum }
    ) => void;
  };
}

interface FtMutualEvents {
  [key: `${interactiveEnum.FtMutual}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtIntegrationMutualEvents {
  [key: `${interactiveEnum.FtIntegrationMutual}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtLegendEvents {
  [key: `${interactiveEnum.FtLegend}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtSearchEvents {
  [key: `${interactiveEnum.FtSearch}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtCustomSelectEvents {
  [key: `${interactiveEnum.FtCustomSelect}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtVoiveControlEvents {
  [key: `${interactiveEnum.FtVoiceControl}-${string}`]: {
    /**
     * @description 点击事件
     */
    upodateVoiceState: (value?: any) => void;
  };
}

interface FtPageQueryEvents {
  [key: `${interactiveEnum.FtPageQuery}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    handleBeforOrAfterClick: (type: string) => void;
  };
}

interface FtCascaderEvents {
  [key: `${interactiveEnum.FtCascader}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtSingleSelectedLegendEvents {
  [key: `${interactiveEnum.FtSingleSelectedLegend}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FormNavMenuEvents {
  [key: `${interactiveEnum.FormNavMenu}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtTimerShaftEvents {
  [key: `${interactiveEnum.FtTimerShaft}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface PointTimelineEvents {
  [key: `${interactiveEnum.PointTimeline}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    setupPatrolAction: (type: string) => void;
  };
}

interface FtPageTurningEvents {
  [key: `${interactiveEnum.FtPageTurning}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtDateTimePickerEvents {
  [key: `${interactiveEnum.FtDateTimePicker}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtProgressEvents {
  [key: `${textEnum.FtProgress}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtTextWordCloudEvents {
  [key: `${textEnum.FtTextWordCloud}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface CtVideoPanelEvents {
  [key: `${mediaEnum.CtVideoPanel}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    handleNextClick: () => void;
    handlePrevClick: () => void;
  };
}

interface FtScrollEvents {
  [key: `${textEnum.FtScroll}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtSwiperCardEvents {
  [key: `${mediaEnum.FtSwiperCard}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    handleEvensChangeActiveSpinnerIndex: (actionSelect: string) => void;
  };
}

interface CustomTableListEvents {
  [key: `${textEnum.CustomTableList}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtSlidecardV1Events {
  [key: `${ExhibitEnumType.FtSlidecardV1}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    handlePrevClick: () => void;
    handleNextClick: () => void;
  };
}

interface FtTurnPageEvents {
  [key: `${ExhibitEnumType.FtTurnPage}-${string}`]: {
    /**
     * @description 点击事件
     */
    handlePrevClick: () => void;
    handleNextClick: () => void;
  };
}

interface EchartcommonMapEvents {
  [key: `${sceneEnumType.EchartcommonMap}-${string}`]: {
    /**
     * @description 点击事件
     * @param info - 组件数据
     * @param isExecuteOnlyConditionSatisfied - 是否仅执行满足条件的事件，默认false
     */
    handleClick: (info: any, isExecuteOnlyConditionSatisfied?: boolean) => void;
  };
}

interface EchartGlMapEvents {
  [key: `${sceneEnumType.EchartGlmap}-${string}`]: {
    /**
     * @description 点击事件
     */
    // handleClick: (info: any) => void;
    /**
     *
     * @description 显隐子组件事件
     */
    updateMapChildComponentVisible: (index: any[], visible: boolean) => void;
    /**
     *
     * @description 设置地图盒子bom
     */
    setMapBoxBom: (componentRootDoms: Element, componentId: string, boxOffsetX: number, boxOffsetY: number) => void;
    /**
     * @description 抬升指定 2.5D 地图地块
     */
    liftRegionByAdcode: (adcode: string, options?: { height?: number; duration?: number }) => void;
    setMapGlIconActive: (options: {
      childId?: string;
      field?: string;
      value?: unknown;
      action?: "select" | "unselect" | "toggle";
      exclusive?: boolean;
      clearWhenMiss?: boolean;
    }) => boolean;
    /**
     * @description 播放 2.5D 地图场景管理里的视角漫游
     */
    playSceneRoam: (sceneId: string) => void | Promise<void>;
    /**
     * @description 停止 2.5D 地图视角漫游
     */
    stopSceneRoam: () => void;
  };
}

interface ftParticlesEvents {
  /**
   * 空间粒子init方法
   */
  [key: `${ExhibitEnumType.FtParticles}-${number}`]: {
    particlesReStart: () => void;
  };
}
/**
 * ECharts 柱状图组件事件接口
 */
interface EchartbarEvents {
  [key: `${BarEchartType.echartbar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartstripBarEvents {
  [key: `${BarEchartType.echartstripBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartbothWayStripBarEvents {
  [key: `${BarEchartType.echartbothWayStripBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartlineAndBarEvents {
  [key: `${BarEchartType.echartlineAndBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartpictorialbarEvents {
  [key: `${BarEchartType.echartpictorialbar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartrankEvents {
  [key: `${BarEchartType.echartrank}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * ECharts 折线图组件事件接口
 */
interface EchartlineEvents {
  [key: `${lineEchartsType.echartline}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartareaLineEvents {
  [key: `${lineEchartsType.echartareaLine}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * ECharts 饼图组件事件接口
 */
interface EchartpieEvents {
  [key: `${pieEchartType.echartpie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartloopRingPieEvents {
  [key: `${pieEchartType.echartloopRingPie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartpluralRosePieEvents {
  [key: `${pieEchartType.echartpluralRosePie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartthreePieEvents {
  [key: `${pieEchartType.echartthreePie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * ECharts 散点图组件事件接口
 */
interface EchartscatterEvents {
  [key: `${scatterEchartType.echartscatter}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * ECharts 项目图表组件事件接口
 */
interface EchartzebraEvents {
  [key: `${projectEchartType.echartzebra}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface Echartzebra2Events {
  [key: `${projectEchartType.echartzebra2}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartrankBarEvents {
  [key: `${projectEchartType.echartrankBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartthreeQuartersPieEvents {
  [key: `${projectEchartType.echartthreeQuartersPie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartthinBarEvents {
  [key: `${projectEchartType.echartthinBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartscalePieEvents {
  [key: `${projectEchartType.echartscalePie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface FtUnrealEngineEvents {
  [key: `${extendsEnumType.FtUnrealEngine}-${string}`]: {
    setupBlueprintData: (throwValue: any) => void;
    sendMessageToUe: (funName: string, data: any) => void;
    switchBlueprintTab: (key: string, info: any) => void;
  };
}

interface FtVideoEvents {
  [key: `${mediaEnum.FtVideo}-${string}`]: {
    handleClick: (throwValue: any) => void;
    /**
     * 视频播放
     */
    videoToPlay: () => Promise<void>;
    /**
     * 视频暂停
     */
    videoToPause: () => void;
    /**
     * 视频停止
     */
    videoToStop: () => void;
    /**
     * 视频重播
     */
    videoToRestart: () => Promise<void>;
    /**
     * 视频静音切换
     */
    videoToMuted: (value?: boolean) => void;
    /**
     * 视频音量增加
     */
    videoToAudioUp: () => void;
    /**
     * 视频音量减少
     */
    videoToAudioDown: () => void;
    /**
     * 视频快进
     */
    videoToFastin: (timeFastIn: number, info?: { value: number }) => void;
    /**
     * 视频快退
     */
    videoToRewind: (timeRewind: number) => void;
    /**
     * 视频切换
     */
    videoToSwitch: (value: string) => Promise<void>;
    /**
     * 视频全屏
     */
    videoToFullscreen: () => void;
    /**
     * 视频播放区间
     */
    videoToPlayRange: (videoStartTime: number, videoEndTime: number) => void;
  };
}
// 数字人自定义事件
interface ftDigitalHumanEvents {
  [key: `${extendsEnumType.FtDigitalHuman}-${number}`]: {
    sendMsgToHuman: (message: string, type: "chat" | "echo") => void;
    startWebRTC: (toStart: boolean) => void;
  };
}

interface ftVuePartEvents {
  // [key: `${ThirdPartEnumType.VuePart}-${number}`]: {
  //   handleClick: (data: any) => void
  // }

  [key: `${ThirdPartEnumType.VuePart}-${number}`]: {
    handleClick: (info: any) => void;
  };
}

interface FtSimpleBarrageEvents {
  [key: `${ExtendsEnum.SimpleBarrage}-${number}`]: {
    onSignaturePadSave: ({ imageUrl }: { imageUrl: string }) => void;
    handleClick: () => void;
  };
}

interface PageReloadEvents {
  [key: `${extendsEnumType.PageReload}-${number}`]: {
    handleClick: () => void;
  };
}

// pdf事件
interface pdfEvents {
  [key: `${ExhibitEnumType.PdfjsViewer}-${number}`]: {
    handlePrevClick: (type: string) => void;
    handleNextClick: (type: string) => void;
    handlePageChange: (currentPage: number) => void;
  };
}
interface scrollPickerEvents {
  [key: `${interactiveEnum.ScrollPicker}-${number}`]: {
    handleClick: (actionSelect: { label: string; value: string; s: string }) => void;
  };
}

interface ImagesList3dEvents {
  [key: `${ExhibitEnumType.ImagesList3d}-${number}`]: {
    handleEvensChangeActiveSpinnerIndex: (actionSelect: string) => void;
  };
}

interface FtSignaturePad {
  [key: `${ExhibitEnumType.FtSignaturePad}-${number}`]: {
    onExport: () => void;
    onClear: () => void;
    onRedo: () => void;
    onUndo: () => void;
    onTranslateImage: () => void;
  };
}

interface IotMutualEvent {
  [key: `${EquipmentEnumType.IotMutual}-${number}`]: {
    handleClick: () => void;
  };
}
interface videoProgressEvents {
  [key: `${interactiveEnum.videoProgress}-${string}`]: {
    /**
     * @description 设置视频总时长事件
     * @param info - 视频总时长（秒）
     */
    setTotalTime: (info: number) => void;
  };
}

// interface FtTranslationEvent {
//   // 译文转换
//   [key: `${ExhibitEnumType.FtTranslation}-${number}`]: {
//     convertTranslation: (key: string) => void;
//   };
// }

interface FtRotateEvent {
  // 旋转组件
  [key: `${ExhibitEnumType.FtRotate}-${number}`]: {
    // 旋转组件-点击触发
    handleClick: () => void;
  };
}

export type TotalPanelEventMap = DynamicPanelEvents &
  ThreeSceneEvents &
  IndustrySceneEvents &
  CitySceneEvents &
  SubtabsEvents &
  MultiSubtabsEvents &
  RollSubtabsEvents &
  FtMutualEvents &
  FtIntegrationMutualEvents &
  FtLegendEvents &
  FtSearchEvents &
  FtCustomSelectEvents &
  FtVoiveControlEvents &
  FtPageQueryEvents &
  FtCascaderEvents &
  FtSingleSelectedLegendEvents &
  FormNavMenuEvents &
  FtTimerShaftEvents &
  PointTimelineEvents &
  FtPageTurningEvents &
  FtDateTimePickerEvents &
  FtProgressEvents &
  FtTextWordCloudEvents &
  CtVideoPanelEvents &
  FtScrollEvents &
  FtSwiperCardEvents &
  CustomTableListEvents &
  FtSlidecardV1Events &
  EchartcommonMapEvents &
  EchartGlMapEvents &
  ftParticlesEvents &
  EchartbarEvents &
  EchartstripBarEvents &
  EchartbothWayStripBarEvents &
  EchartlineAndBarEvents &
  EchartpictorialbarEvents &
  EchartrankEvents &
  EchartlineEvents &
  EchartareaLineEvents &
  EchartpieEvents &
  EchartloopRingPieEvents &
  EchartpluralRosePieEvents &
  EchartthreePieEvents &
  EchartscatterEvents &
  EchartzebraEvents &
  Echartzebra2Events &
  EchartrankBarEvents &
  EchartthreeQuartersPieEvents &
  EchartthinBarEvents &
  EchartscalePieEvents &
  FtVideoEvents &
  ftDigitalHumanEvents &
  ftVuePartEvents &
  FtSimpleBarrageEvents &
  PageReloadEvents &
  IotMutualEvent &
  // FtTranslationEvent &
  FtUnrealEngineEvents &
  FtRotateEvent &
  videoProgressEvents;

export type toAddEvent =
  | DynamicPanelEvents
  | ThreeSceneEvents
  | IndustrySceneEvents
  | CitySceneEvents
  | SubtabsEvents
  | MultiSubtabsEvents
  | RollSubtabsEvents
  | FtMutualEvents
  | FtIntegrationMutualEvents
  | FtLegendEvents
  | FtSearchEvents
  | FtCustomSelectEvents
  | FtVoiveControlEvents
  | FtPageQueryEvents
  | FtCascaderEvents
  | FtSingleSelectedLegendEvents
  | FormNavMenuEvents
  | FtTimerShaftEvents
  | PointTimelineEvents
  | FtPageTurningEvents
  | FtDateTimePickerEvents
  | FtProgressEvents
  | FtTextWordCloudEvents
  | CtVideoPanelEvents
  | FtScrollEvents
  | FtSwiperCardEvents
  | CustomTableListEvents
  | FtSlidecardV1Events
  | EchartcommonMapEvents
  | EchartGlMapEvents
  | ftParticlesEvents
  | EchartbarEvents
  | EchartstripBarEvents
  | EchartbothWayStripBarEvents
  | EchartlineAndBarEvents
  | EchartpictorialbarEvents
  | EchartrankEvents
  | EchartlineEvents
  | EchartareaLineEvents
  | EchartpieEvents
  | EchartloopRingPieEvents
  | EchartpluralRosePieEvents
  | EchartthreePieEvents
  | EchartscatterEvents
  | EchartzebraEvents
  | Echartzebra2Events
  | EchartrankBarEvents
  | EchartthreeQuartersPieEvents
  | EchartthinBarEvents
  | EchartscalePieEvents
  | FtVideoEvents
  | ftDigitalHumanEvents
  | ftVuePartEvents
  | FtSimpleBarrageEvents
  | PageReloadEvents
  | pdfEvents
  | scrollPickerEvents
  | ImagesList3dEvents
  | FtSignaturePad
  | IotMutualEvent
  | FtTurnPageEvents
  // | FtTranslationEvent
  | FtUnrealEngineEvents
  | FtRotateEvent
  | videoProgressEvents;
