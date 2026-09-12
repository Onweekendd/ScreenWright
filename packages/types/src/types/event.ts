import { PanelEnum } from ".";
import type { Action, Condition, EncodeAction } from "./action";
import type { ConditionLogicTypeEnum } from "./action";
import type { AllComponentType, SceneEnum, ThreeComponentEnum } from "./componentProp";
import {
  allComponentType,
  BarEchartEnum,
  ExhibitEnum,
  extendsChildComponentEnum,
  extendsEnum,
  interactiveEnum,
  lineEchartEnum,
  mediaEnum,
  pieEchartEnum,
  projectEchartEnum,
  scatterEchartEnum,
  sceneEnum,
  textEnum,
  ThirdPartEnum,
  threeComponentEnum
} from "./componentProp";

/**
 * @description 交互事件触发类型
 */
export enum EventTypeEnum {
  /**
   * @description 当请求完成或数据变化时
   */
  DataChange = "dataChange",

  /**
   * @description 文件内容改变时
   */
  Change = "change",

  /**
   * @description 鼠标点击
   */
  Click = "click",

  /**
   * @description 鼠标右键单击
   */
  ContextmenuClick = "contextmenuClick",

  /**
   * @description 视频播放结束
   */
  Ended = "ended",

  /**
   * @description 鼠标移入
   */
  MouseEnter = "mouseEnter",

  /**
   * @description 鼠标移出
   */
  MouseLeave = "mouseLeave",

  /**
   * @description 接收到UE信息时
   */
  UeToFunEvent = "ueToFunEvent",

  /**
   * @description 接收项目模板信息时
   */
  ProjectToFunEvent = "projectToFunEvent",

  /**
   * @description 鼠标点击对象
   */
  ModelClick = "modelClick",

  /**
   * @description 鼠标点击图层
   */
  LayerClick = "layerClick",

  /**
   * @description 鼠标点击矢量图层
   */
  VectorClick = "vectorClick",

  /**
   * @description 鼠标点击倾斜摄影
   */
  ThreeDTilesClick = "3DTilesClick",

  /**
   * @description 鼠标点击模型（批量识别）
   */
  MultiplyModelClick = "multiplyModelClick",

  /**
   * @description 鼠标点击图标（批量识别）
   */
  MultiplyIconClick = "multiplyIconClick",

  /**
   * @description 鼠标点击子组件
   */
  ChildComponentClick = "childComponentClick",

  /**
   * @description 场景初始化结束
   */
  AfterSceneInit = "afterSceneInit",

  /**
   * @description 场景切换状态结束
   */
  AfterUpdateState = "afterUpdateState",

  /**
   * @description 鼠标点击模型子节点
   */
  ModelNodeClick = "modelNodeClick",

  /**
   * @description 控制组件(未知事件)
   */
  Controls = "controls",

  /**
   * @description 签名提交
   */
  SignatureSubmit = "signatureSubmit",

  /**
   * @description 视频控制
   */
  VideoControls = "videocontrols",

  /**
   * @description 无事件
   */
  None = "",
  /**
   * @description 卡片下落结束
   */
  CardDropEnd = "cardDropEnd",
  /**
   * @description 卡片开始展开前
   */
  CardBeforeExpand = "cardBeforeExpand",
  /**
   * @description 卡片开始展开结束
   */
  CardEndExpand = "cardEndExpand",
  /**
   * @description 卡片开始收缩
   */
  CardStartCollapse = "cardStartCollapse",
  /**
   * @description 卡片收缩结束
   */
  CardEndCollapse = "cardEndCollapse",
  /**
   * @description 滚动结束
   */
  ScrollEnd = "scrollEnd",
  /**
   * @description 卡片开始翻转
   */
  startRotate = "startRotate",
  /**
   * @description 卡片开始翻转结束
   */
  endRotate = "endRotate",

  /**
   * @description 卡片开始放大
   */
  startScaleRotate = "startScaleRotate",
  /**
   * @description 卡片开始放大结束
   */
  endScaleRotate = "endScaleRotate",

  /**
   * @description 卡片开始缩小
   */
  startSmallRotate = "startSmallRotate",
  /**
   * @description 卡片开始放大结束
   */
  endSmallRotate = "endSmallRotate",
  /**
   * @description 反向开始翻转
   */
  reversalStartRotate = "reversalStartRotate",
  /**
   * @description 反向翻转结束
   */
  reversalEndRotate = "reversalEndRotate",
  /**
   * @description 当翻到最后一页时
   */
  flipTheBookFinalPage = "flipTheBookFinalPage"
}

export enum EncodeEventTypeEnum {
  /**
   * @description 无事件
   */
  None = "",

  /**
   * @description 鼠标点击
   */
  Click = "click",

  /**
   * @description 视频控制
   */
  VideoControls = "videocontrols",

  /**
   * @description 签名提交
   */
  SignatureSubmit = "signatureSubmit"
}

/**
 *
 * @param eventType 根据白名单过滤dataChange事件相关组件类型
 * @returns
 */
const getDataChangeFilterComponentType = () => {
  // 白名单
  const whiteList: Array<SceneEnum | ThreeComponentEnum | ExhibitEnum | PanelEnum> = [
    sceneEnum.ThreeScene,
    sceneEnum.IndustryScene,
    threeComponentEnum.ThreeSceneIconList,
    threeComponentEnum.ThreeSceneTwinIconList,
    threeComponentEnum.ThreeSceneTwinPanelIconList,
    threeComponentEnum.ThreeMapMapGlIcon
  ];
  return allComponentType.filter((type) => !whiteList.includes(type as SceneEnum | ThreeComponentEnum));
};

/**
 * @description 事件类型对应组件的映射表
 */
export const Event2ComponentType: Record<EventTypeEnum, AllComponentType[]> = {
  [EventTypeEnum.None]: [],
  [EventTypeEnum.DataChange]: getDataChangeFilterComponentType(),
  [EventTypeEnum.Change]: [interactiveEnum.FtSearch],
  [EventTypeEnum.Click]: [
    BarEchartEnum.echartbar,
    BarEchartEnum.echartstripBar,
    BarEchartEnum.echartbothWayStripBar,
    BarEchartEnum.echartlineAndBar,
    BarEchartEnum.echartpictorialbar,
    BarEchartEnum.echartrank,
    lineEchartEnum.echartline,
    lineEchartEnum.echartareaLine,
    pieEchartEnum.echartpie,
    pieEchartEnum.echartloopRingPie,
    pieEchartEnum.echartpluralRosePie,
    pieEchartEnum.echartthreePie,
    scatterEchartEnum.echartscatter,
    projectEchartEnum.echartzebra,
    projectEchartEnum.echartzebra2,
    projectEchartEnum.echartrankBar,
    projectEchartEnum.echartthreeQuartersPie,
    projectEchartEnum.echartthinBar,
    projectEchartEnum.echartscalePie,
    interactiveEnum.Subtabs,
    interactiveEnum.MultiSubtabs,
    interactiveEnum.RollSubtabs,
    interactiveEnum.FtMutual,
    interactiveEnum.FtLegend,
    interactiveEnum.FtSearch,
    interactiveEnum.FtCustomSelect,
    interactiveEnum.FtPageQuery,
    interactiveEnum.FtCascader,
    interactiveEnum.FtSingleSelectedLegend,
    interactiveEnum.FormNavMenu,
    interactiveEnum.FtTimerShaft,
    interactiveEnum.PointTimeline,
    interactiveEnum.FtPageTurning,
    interactiveEnum.FtDateTimePicker,
    interactiveEnum.ScrollPicker,
    textEnum.FtProgress,
    textEnum.FtTextWordCloud,
    mediaEnum.CtVideoPanel,
    textEnum.FtScroll,
    mediaEnum.FtSwiperCard,
    textEnum.CustomTableList,
    ExhibitEnum.FtSlidecardV1,
    ExhibitEnum.ImagesList3d,
    sceneEnum.EchartcommonMap,
    sceneEnum.EchartGlmap,
    textEnum.FtCollection,
    ThirdPartEnum.VuePart,
    ExhibitEnum.RingIndicator3d,
    ExhibitEnum.ringIndicator3dNew,
    ExhibitEnum.CurvedTrackList,
    ExhibitEnum.FtTurnPage,
    interactiveEnum.videoProgress
  ],
  [EventTypeEnum.ContextmenuClick]: [interactiveEnum.FtMutual],
  [EventTypeEnum.Ended]: [mediaEnum.FtVideo, mediaEnum.FtOpenVideo],
  [EventTypeEnum.Controls]: [mediaEnum.FtVideo],
  [EventTypeEnum.MouseEnter]: [
    interactiveEnum.Subtabs,
    interactiveEnum.MultiSubtabs,
    interactiveEnum.RollSubtabs,
    interactiveEnum.FtMutual,
    interactiveEnum.FtCustomSelect
  ],
  [EventTypeEnum.MouseLeave]: [
    interactiveEnum.Subtabs,
    interactiveEnum.MultiSubtabs,
    interactiveEnum.RollSubtabs,
    interactiveEnum.FtMutual,
    interactiveEnum.FtCustomSelect
  ],
  [EventTypeEnum.UeToFunEvent]: [
    extendsChildComponentEnum.UeVessel_UeMessageReceiver,
    extendsChildComponentEnum.FtUnrealEngine_UeMessageReceiver,
    extendsChildComponentEnum.UePeerStreaming_UeMessageReceiver,
    extendsChildComponentEnum.UePixelStreaming_UeMessageReceiver
    // "ue-pixel-streaming-child", // TODO: 待添加组件
    // "ue-peer-streaming-child" // TODO: 待添加组件
  ],
  [EventTypeEnum.ProjectToFunEvent]: [
    // "map-project" // TODO: 待添加组件
  ],
  [EventTypeEnum.ModelClick]: [
    sceneEnum.ThreeScene,
    sceneEnum.IndustryScene,
    sceneEnum.Maptalks
    // TODO: 待添加组件
  ],
  [EventTypeEnum.LayerClick]: [],
  [EventTypeEnum.VectorClick]: [
    sceneEnum.Maptalks
    // TODO: 待添加组件
  ],
  [EventTypeEnum.ThreeDTilesClick]: [
    sceneEnum.Maptalks
    // TODO: 待添加组件
  ],
  [EventTypeEnum.MultiplyModelClick]: [
    sceneEnum.ThreeScene,
    sceneEnum.IndustryScene
    // "threescene" // TODO: 待添加组件
  ],
  [EventTypeEnum.MultiplyIconClick]: [
    sceneEnum.ThreeScene,
    sceneEnum.IndustryScene
    // "threescene" // TODO: 待添加组件
  ],
  [EventTypeEnum.ChildComponentClick]: [
    threeComponentEnum.ThreeSceneIconList,
    threeComponentEnum.ThreeSceneTwinIconList,
    threeComponentEnum.ThreeSceneTwinPanelIconList,
    threeComponentEnum.ThreeMapMapGlIcon
  ],
  [EventTypeEnum.AfterSceneInit]: [
    sceneEnum.ThreeScene,
    sceneEnum.IndustryScene
    // "threescene" // TODO: 待添加组件
  ],
  [EventTypeEnum.AfterUpdateState]: [
    sceneEnum.ThreeScene,
    sceneEnum.IndustryScene
    // "threescene" // TODO: 待添加组件
  ],
  [EventTypeEnum.ModelNodeClick]: [
    sceneEnum.ThreeScene,
    sceneEnum.IndustryScene
    // "threescene" // TODO: 待添加组件
  ],
  [EventTypeEnum.SignatureSubmit]: [ExhibitEnum.FtSignaturePad],
  [EventTypeEnum.VideoControls]: [mediaEnum.FtVideo],
  [EventTypeEnum.CardDropEnd]: [ExhibitEnum.verticalCard],
  [EventTypeEnum.CardBeforeExpand]: [ExhibitEnum.verticalCard],
  [EventTypeEnum.CardEndExpand]: [ExhibitEnum.verticalCard],
  [EventTypeEnum.CardStartCollapse]: [ExhibitEnum.verticalCard],
  [EventTypeEnum.CardEndCollapse]: [ExhibitEnum.verticalCard],
  [EventTypeEnum.ScrollEnd]: [PanelEnum.dynamicPanel],
  [EventTypeEnum.startRotate]: [ExhibitEnum.FtRotate],
  [EventTypeEnum.endRotate]: [ExhibitEnum.FtRotate],
  [EventTypeEnum.startScaleRotate]: [ExhibitEnum.FtRotate],
  [EventTypeEnum.endScaleRotate]: [ExhibitEnum.FtRotate],
  [EventTypeEnum.startSmallRotate]: [ExhibitEnum.FtRotate],
  [EventTypeEnum.endSmallRotate]: [ExhibitEnum.FtRotate],
  [EventTypeEnum.reversalStartRotate]: [ExhibitEnum.FtRotate],
  [EventTypeEnum.reversalEndRotate]: [ExhibitEnum.FtRotate],
  [EventTypeEnum.flipTheBookFinalPage]: [ExhibitEnum.FtTurnPage]
};

/**
 * @description 事件类型触发函数
 * 实现了事件的组件 需要实现对应的事件触发函数
 */
export interface eventToTriggerFunction {
  [EventTypeEnum.Click]: {
    handleClick: (throwValue: any) => void;
  };
}

/**
 * @description 自定义事件列表
 */
export const EventList: { label: string; value: EventTypeEnum }[] = [
  { label: "当请求完成或数据变化时", value: EventTypeEnum.DataChange },
  { label: "文件内容改变时", value: EventTypeEnum.Change },
  { label: "鼠标点击", value: EventTypeEnum.Click },
  { label: "鼠标右键单击", value: EventTypeEnum.ContextmenuClick },
  { label: "视频播放结束", value: EventTypeEnum.Ended },
  { label: "鼠标移入", value: EventTypeEnum.MouseEnter },
  { label: "鼠标移出", value: EventTypeEnum.MouseLeave },
  { label: "接收到UE信息时", value: EventTypeEnum.UeToFunEvent },
  { label: "接收项目模板信息时", value: EventTypeEnum.ProjectToFunEvent },
  { label: "鼠标点击对象", value: EventTypeEnum.ModelClick },
  { label: "鼠标点击图层", value: EventTypeEnum.LayerClick },
  { label: "鼠标点击矢量图层", value: EventTypeEnum.VectorClick },
  { label: "鼠标点击倾斜摄影", value: EventTypeEnum.ThreeDTilesClick },
  { label: "鼠标点击模型（批量识别）", value: EventTypeEnum.MultiplyModelClick },
  { label: "鼠标点击图标（批量识别）", value: EventTypeEnum.MultiplyIconClick },
  { label: "鼠标点击子组件", value: EventTypeEnum.ChildComponentClick },
  { label: "场景初始化结束", value: EventTypeEnum.AfterSceneInit },
  { label: "场景切换状态结束", value: EventTypeEnum.AfterUpdateState },
  { label: "鼠标点击模型子节点", value: EventTypeEnum.ModelNodeClick },
  { label: "签名提交", value: EventTypeEnum.SignatureSubmit },
  { label: "卡片滑落结束", value: EventTypeEnum.CardDropEnd },
  { label: "卡片开始展开前", value: EventTypeEnum.CardBeforeExpand },
  { label: "卡片展开结束", value: EventTypeEnum.CardEndExpand },
  { label: "卡片开始收缩", value: EventTypeEnum.CardStartCollapse },
  { label: "卡片收缩结束", value: EventTypeEnum.CardEndCollapse },
  { label: "卡片开始翻转", value: EventTypeEnum.startRotate },
  { label: "卡片开始翻转结束", value: EventTypeEnum.endRotate },
  { label: "卡片开始放大", value: EventTypeEnum.startScaleRotate },
  { label: "卡片开始放大结束", value: EventTypeEnum.endScaleRotate },
  { label: "卡片开始缩小", value: EventTypeEnum.startSmallRotate },
  { label: "卡片结束放大结束", value: EventTypeEnum.endSmallRotate },
  { label: "反向开始翻转", value: EventTypeEnum.reversalStartRotate },
  { label: "反向翻转结束", value: EventTypeEnum.reversalEndRotate },
  { label: "当翻到最后一页时", value: EventTypeEnum.flipTheBookFinalPage },
  { label: "滚动结束", value: EventTypeEnum.ScrollEnd }
];

/**
 * @description 远程控制时间列表
 */
export const EncodeEventList: { label: string; value: EncodeEventTypeEnum | EventTypeEnum }[] = [
  { label: "鼠标点击", value: EncodeEventTypeEnum.Click },
  { label: "视频控制", value: EncodeEventTypeEnum.VideoControls },
  { label: "签名提交", value: EncodeEventTypeEnum.SignatureSubmit }
];

/**
 * @description 事件类型对应组件的映射表
 */
export const EncodeEvent2ComponentType: Record<EncodeEventTypeEnum, AllComponentType[]> = {
  [EncodeEventTypeEnum.None]: [...allComponentType],
  [EncodeEventTypeEnum.Click]: [
    BarEchartEnum.echartbar,
    BarEchartEnum.echartstripBar,
    BarEchartEnum.echartbothWayStripBar,
    BarEchartEnum.echartlineAndBar,
    BarEchartEnum.echartpictorialbar,
    BarEchartEnum.echartrank,
    lineEchartEnum.echartline,
    lineEchartEnum.echartareaLine,
    pieEchartEnum.echartpie,
    pieEchartEnum.echartloopRingPie,
    pieEchartEnum.echartpluralRosePie,
    pieEchartEnum.echartthreePie,
    scatterEchartEnum.echartscatter,
    projectEchartEnum.echartzebra,
    projectEchartEnum.echartzebra2,
    projectEchartEnum.echartrankBar,
    projectEchartEnum.echartthreeQuartersPie,
    projectEchartEnum.echartthinBar,
    projectEchartEnum.echartscalePie,
    interactiveEnum.Subtabs,
    interactiveEnum.MultiSubtabs,
    interactiveEnum.RollSubtabs,
    interactiveEnum.FtMutual,
    interactiveEnum.FtLegend,
    interactiveEnum.FtSearch,
    interactiveEnum.FtCustomSelect,
    interactiveEnum.FtPageQuery,
    interactiveEnum.FtCascader,
    interactiveEnum.FtSingleSelectedLegend,
    interactiveEnum.FormNavMenu,
    interactiveEnum.FtTimerShaft,
    interactiveEnum.PointTimeline,
    interactiveEnum.FtPageTurning,
    interactiveEnum.FtDateTimePicker,
    interactiveEnum.ScrollPicker,
    interactiveEnum.FormCheckbox,
    textEnum.FtProgress,
    textEnum.FtTextWordCloud,
    mediaEnum.CtVideoPanel,
    textEnum.FtScroll,
    mediaEnum.FtSwiperCard,
    textEnum.CustomTableList,
    ExhibitEnum.FtSlidecardV1,
    ExhibitEnum.ImagesList3d,
    sceneEnum.EchartcommonMap,
    sceneEnum.EchartGlmap,
    interactiveEnum.FormSwitch,
    ThirdPartEnum.VuePart,
    interactiveEnum.FtIntegrationMutual,
    ExhibitEnum.FtTurnPage
  ],
  [EncodeEventTypeEnum.VideoControls]: [mediaEnum.FtVideo, interactiveEnum.videoProgress],
  [EncodeEventTypeEnum.SignatureSubmit]: [ExhibitEnum.FtSignaturePad]
};

/**
 * @description 允许事件触发的组件
 */
export const allowEventComponentList = [
  BarEchartEnum.echartbar, // 柱状图@
  BarEchartEnum.echartstripBar, // 条形图
  BarEchartEnum.echartbothWayStripBar, // 双向条形图
  BarEchartEnum.echartlineAndBar, // 折线柱状图
  BarEchartEnum.echartpictorialbar, // 象形图
  BarEchartEnum.echartrank, // 排名图
  lineEchartEnum.echartline, // 折线图
  lineEchartEnum.echartareaLine, // 面积折线图
  pieEchartEnum.echartpie, // 饼图
  pieEchartEnum.echartloopRingPie, // 轮播环形饼图
  pieEchartEnum.echartpluralRosePie, // 层叠玫瑰图
  pieEchartEnum.echartthreePie, // 3D饼图
  scatterEchartEnum.echartscatter, // 散点图
  projectEchartEnum.echartzebra, // 斑马柱状图
  projectEchartEnum.echartzebra2, // 斑马柱状图2
  projectEchartEnum.echartrankBar, // 排名图
  projectEchartEnum.echartthreeQuartersPie, // 环形饼图
  projectEchartEnum.echartthinBar, // 细长柱状图
  projectEchartEnum.echartscalePie, // 刻度饼图
  interactiveEnum.Subtabs,
  "vue-part",
  interactiveEnum.MultiSubtabs,
  interactiveEnum.RollSubtabs,
  interactiveEnum.FtMutual,
  interactiveEnum.FtSearch,
  interactiveEnum.FtTimerShaft,
  interactiveEnum.FtCustomSelect,
  sceneEnum.EchartcommonMap,
  sceneEnum.EchartGlmap,
  "threescene",
  "industryscene",
  "maptalks",
  interactiveEnum.FtLegend,
  textEnum.FtTextWordCloud,
  interactiveEnum.FtPageQuery,
  interactiveEnum.FtPageTurning,
  interactiveEnum.FtDateTimePicker,
  mediaEnum.FtVideo,
  "sw-audio",
  mediaEnum.FtOpenVideo,
  mediaEnum.CtVideoPanel,
  textEnum.FtScroll,
  textEnum.FtProgress,
  "sw-dataContainer",
  interactiveEnum.FtCascader,
  "ue-vessel",
  "ue-pixel-streaming",
  "ue-peer-streaming",
  interactiveEnum.FtSingleSelectedLegend,
  textEnum.CustomTableList,
  "imagesList3d",
  "ringIndicator3d",
  "ringIndicator3dNew",
  ExhibitEnum.CurvedTrackList,
  "threeSceneIconList",
  "threeSceneTwinIconList",
  "threeSceneTwinPanelIconList",
  "threeMapMapGlIcon",
  "fullScreenSwitch",
  "pageReload",
  interactiveEnum.ScrollPicker,
  interactiveEnum.PointTimeline,
  interactiveEnum.FormSlider,
  interactiveEnum.FormSwitch,
  interactiveEnum.FormNavMenu,
  interactiveEnum.FormCheckbox,
  "simple-barrage",
  "map-project",
  mediaEnum.FtSwiperCard,
  interactiveEnum.FtVoiceControl,
  "sw-slidecard-v1",
  textEnum.FtCollection,
  "sw-swiperCard-v2",
  "sw-topo-container",
  ExhibitEnum.FtSignaturePad,
  extendsEnum.UePeerStreaming,
  extendsEnum.UePixelStreaming,
  extendsEnum.UeVessel,
  ExhibitEnum.FtTurnPage,
  ExhibitEnum.verticalCard,
  PanelEnum.dynamicPanel,
  ExhibitEnum.FtRotate,
  interactiveEnum.videoProgress
];

/**
 * 事件接口（完整版）
 * @description 组件事件配置，包含触发器、条件和操作
 */
export interface Event {
  /**
   * @description 事件触发器类型
   */
  trigger: EventTypeEnum;

  /**
   * @description 事件名称
   */
  name: string;

  /**
   * @description 事件ID
   */
  id: string;

  /**
   * @description 条件类型：AND、OR或ALL逻辑
   */
  conditionType: ConditionLogicTypeEnum;

  /**
   * @description 条件列表
   */
  conditions: Condition[];

  /**
   * @description 动作列表
   */
  actions: Action[];

  /**
   * @description 自定义表格按钮配置
   */
  btnObjs: any[];

  /** 其他任意属性 */
  [key: string]: any;
}

/**
 * 加密事件接口
 * @description 加密处理的事件配置，用于需要加密的特殊事件
 */
export interface EncodeEvent {
  /** 触发器 */
  trigger: EncodeEventTypeEnum;
  /** 事件名称 */
  name: string;
  /** 事件ID */
  id: string;
  /** 条件类型 */
  conditionType: ConditionLogicTypeEnum;
  /** 条件列表 */
  conditions: Condition[];
  /** 操作列表 */
  actions: EncodeAction[];
}
