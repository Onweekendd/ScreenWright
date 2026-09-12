import type { LayerInfo, SceneObjectExplosion } from "./action";
import type {
  BarEchartEnum,
  ExhibitEnum,
  ExtendsEnum,
  InteractiveEnum,
  LineEchartEnum,
  MediaEnum,
  PanelEnum,
  PieEchartEnum,
  ProjectEchartEnum,
  ScatterEchartEnum,
  SceneEnum,
  TextEnum,
  ThirdPartEnum
} from "./componentProp";
import type { EventTypeEnum } from "./event";

/**
 * 组件属性映射事件
 */
interface DynamicPanelEvents {
  [key: `${PanelEnum.dynamicPanel}-${string}`]: {
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
  [key: `${SceneEnum.ThreeScene}-${number}`]: {
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
  [key: `${SceneEnum.IndustryScene}-${number}`]: {
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
  [key: `${SceneEnum.Maptalks}-${number}`]: {
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
  [key: `${InteractiveEnum.Subtabs}-${string}`]: {
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
  [key: `${InteractiveEnum.MultiSubtabs}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface RollSubtabsEvents {
  [key: `${InteractiveEnum.RollSubtabs}-${string}`]: {
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
  [key: `${InteractiveEnum.FtMutual}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtLegendEvents {
  [key: `${InteractiveEnum.FtLegend}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtSearchEvents {
  [key: `${InteractiveEnum.FtSearch}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtCustomSelectEvents {
  [key: `${InteractiveEnum.FtCustomSelect}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtVoiveControlEvents {
  [key: `${InteractiveEnum.FtVoiceControl}-${string}`]: {
    /**
     * @description 点击事件
     */
    upodateVoiceState: (value?: any) => void;
  };
}

interface FtPageQueryEvents {
  [key: `${InteractiveEnum.FtPageQuery}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    handleBeforOrAfterClick: (type: string) => void;
  };
}

interface FtCascaderEvents {
  [key: `${InteractiveEnum.FtCascader}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtSingleSelectedLegendEvents {
  [key: `${InteractiveEnum.FtSingleSelectedLegend}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FormNavMenuEvents {
  [key: `${InteractiveEnum.FormNavMenu}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtTimerShaftEvents {
  [key: `${InteractiveEnum.FtTimerShaft}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface videoProgressEvents {
  [key: `${InteractiveEnum.videoProgress}-${string}`]: {
    /**
     * @description 设置视频总时长事件
     * @param info - 视频总时长（秒）
     */
    setTotalTime: (info: number) => void;
  };
}

interface PointTimelineEvents {
  [key: `${InteractiveEnum.PointTimeline}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    setupPatrolAction: (type: string) => void;
  };
}

interface FtPageTurningEvents {
  [key: `${InteractiveEnum.FtPageTurning}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtDateTimePickerEvents {
  [key: `${InteractiveEnum.FtDateTimePicker}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtProgressEvents {
  [key: `${TextEnum.FtProgress}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtTextWordCloudEvents {
  [key: `${TextEnum.FtTextWordCloud}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface CtVideoPanelEvents {
  [key: `${MediaEnum.CtVideoPanel}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    handleNextClick: () => void;
    handlePrevClick: () => void;
  };
}

interface FtScrollEvents {
  [key: `${TextEnum.FtScroll}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface FtSwiperCardEvents {
  [key: `${MediaEnum.FtSwiperCard}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
    handleEvensChangeActiveSpinnerIndex: (actionSelect: string) => void;
  };
}

interface CustomTableListEvents {
  [key: `${TextEnum.CustomTableList}-${string}`]: {
    /**
     * @description 点击事件
     */
    handleClick: (info: any) => void;
  };
}

interface EchartcommonMapEvents {
  [key: `${SceneEnum.EchartcommonMap}-${string}`]: {
    /**
     * @description 点击事件
     * @param info - 组件数据
     * @param isExecuteOnlyConditionSatisfied - 是否仅执行满足条件的事件，默认false
     */
    handleClick: (info: any, isExecuteOnlyConditionSatisfied?: boolean) => void;
  };
}

interface EchartGlMapEvents {
  [key: `${SceneEnum.EchartGlmap}-${string}`]: {
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
  [key: `${ExhibitEnum.FtParticles}-${number}`]: {
    particlesReStart: () => void;
  };
}
/**
 * ECharts 柱状图组件事件接口
 */
interface EchartbarEvents {
  [key: `${BarEchartEnum.echartbar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartstripBarEvents {
  [key: `${BarEchartEnum.echartstripBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartbothWayStripBarEvents {
  [key: `${BarEchartEnum.echartbothWayStripBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartlineAndBarEvents {
  [key: `${BarEchartEnum.echartlineAndBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartpictorialbarEvents {
  [key: `${BarEchartEnum.echartpictorialbar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartrankEvents {
  [key: `${BarEchartEnum.echartrank}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * ECharts 折线图组件事件接口
 */
interface EchartlineEvents {
  [key: `${LineEchartEnum.echartline}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartareaLineEvents {
  [key: `${LineEchartEnum.echartareaLine}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * ECharts 饼图组件事件接口
 */
interface EchartpieEvents {
  [key: `${PieEchartEnum.echartpie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartloopRingPieEvents {
  [key: `${PieEchartEnum.echartloopRingPie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartpluralRosePieEvents {
  [key: `${PieEchartEnum.echartpluralRosePie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartthreePieEvents {
  [key: `${PieEchartEnum.echartthreePie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * ECharts 散点图组件事件接口
 */
interface EchartscatterEvents {
  [key: `${ScatterEchartEnum.echartscatter}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * ECharts 项目图表组件事件接口
 */
interface EchartzebraEvents {
  [key: `${ProjectEchartEnum.echartzebra}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface Echartzebra2Events {
  [key: `${ProjectEchartEnum.echartzebra2}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartrankBarEvents {
  [key: `${ProjectEchartEnum.echartrankBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartthreeQuartersPieEvents {
  [key: `${ProjectEchartEnum.echartthreeQuartersPie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartthinBarEvents {
  [key: `${ProjectEchartEnum.echartthinBar}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface EchartscalePieEvents {
  [key: `${ProjectEchartEnum.echartscalePie}-${string}`]: {
    handleClick: (throwValue: any) => void;
  };
}

interface FtUnrealEngineEvents {
  [key: `${ExtendsEnum.FtUnrealEngine}-${string}`]: {
    setupBlueprintData: (throwValue: any) => void;
    sendMessageToUe: (funName: string, data: any) => void;
    switchBlueprintTab: (key: string, info: any) => void;
  };
}

interface FtVideoEvents {
  [key: `${MediaEnum.FtVideo}-${string}`]: {
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
  [key: `${ExtendsEnum.FtDigitalHuman}-${number}`]: {
    sendMsgToHuman: (message: string, type: "chat" | "echo") => void;
    startWebRTC: (toStart: boolean) => void;
  };
}

interface ftVuePartEvents {
  // [key: `${ThirdPartEnum.VuePart}-${number}`]: {
  //   handleClick: (data: any) => void
  // }

  [key: `${ThirdPartEnum.VuePart}-${number}`]: {
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
  [key: `${ExtendsEnum.PageReload}-${number}`]: {
    handleClick: () => void;
  };
}

// pdf事件
interface pdfEvents {
  [key: `${ExhibitEnum.PdfjsViewer}-${number}`]: {
    handlePrevClick: (type: string) => void;
    handleNextClick: (type: string) => void;
    handlePageChange: (currentPage: number) => void;
  };
}
interface scrollPickerEvents {
  [key: `${InteractiveEnum.ScrollPicker}-${number}`]: {
    handleClick: (actionSelect: { label: string; value: string; s: string }) => void;
  };
}

interface ImagesList3dEvents {
  [key: `${ExhibitEnum.ImagesList3d}-${number}`]: {
    handleEvensChangeActiveSpinnerIndex: (actionSelect: string) => void;
  };
}

interface FtSignaturePad {
  [key: `${ExhibitEnum.FtSignaturePad}-${number}`]: {
    onExport: () => void;
    onClear: () => void;
    onRedo: () => void;
    onUndo: () => void;
    onTranslateImage: () => void;
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
  FtUnrealEngineEvents &
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
  | FtUnrealEngineEvents
  | videoProgressEvents;
