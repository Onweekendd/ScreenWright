import type { AllComponentType, ComponentType, DataSourceType } from "./component";
import {
  allComponentType,
  BarEchartEnum,
  ExhibitEnum,
  extendsEnum,
  indicatorEchartEnum,
  interactiveEnum,
  lineEchartEnum,
  MediaEnum,
  mediaEnum,
  otherEchartEnum,
  PanelEnum,
  pieEchartEnum,
  projectEchartEnum,
  scatterEchartEnum,
  threeComponentEnum
} from "./componentProp";

/**
 * @description 动作类型枚举
 */
export enum ActionTypeEnum {
  /**
   * @description 空行为
   */
  Default = "",

  /**
   * @description 显示
   */
  Show = "show",

  /**
   * @description 隐藏
   */
  Hide = "hide",

  /**
   * @description 显隐切换
   */
  ShowHide = "show/hide",

  /**
   * @description 移动
   */
  Moving = "moving",

  /**
   * @description 缩放
   */
  Scaling = "scaling",

  /**
   * @description 缩放隐藏
   */
  ScalingHide = "scalingHide",

  /**
   * @description 设置索引
   */
  SetIndex = "setIndex",

  /**
   * @description 更新配置
   */
  UpdateConfig = "updateConfig",

  /**
   * @description 更新参数
   */
  UpdateParams = "updateParams",

  /**
   * @description 切换状态
   */
  SwitchState = "switchState",

  /**
   * @description 切换终端控制状态
   */
  SwitchTCState = "switchTCState",

  /**
   * @description 切换场景状态
   */
  SwitchSceneStatus = "switchSceneStatus",
  /**
   * @description 切换场景视角
   */
  SwitchSceneRoam = "switchSceneRoam",

  /**
   * @description 切换场景关卡
   */
  SwitchSceneLevel = "switchSceneLevel",

  /**
   * @description 聚焦图层
   */
  FocusLayer = "focusLayer",

  /**
   * @description 处理API指令
   */
  HandleApiInstruction = "handleApiInstruction",

  /**
   * @description 设置动画播放
   */
  SetAnimationPlay = "setAnimationPlay",

  /**
   * @description 设置动画暂停
   */
  SetAnimationPause = "setAnimationPause",

  /**
   * @description 设置动画播放状态
   */
  SetStateAnimationPlay = "setStateAnimationPlay",

  /**
   * @description 切换场景对象可见性
   */
  SwitchSceneObjVisible = "switchSceneObjVisible",

  /**
   * @description 处理场景对象爆炸
   */
  HandleSceneObjExplosion = "handleSceneObjExplosion",

  /**
   * @description 切换场景子组件可见性S
   */
  SwitchSceneChildComponentVisible = "switchSceneChildComponentVisible",

  /**
   * @description 切换地图子组件显隐
   */
  SwitchMapChildComponentVisible = "switchMapChildComponentVisible",

  /**
   * @description 2.5D地图地块抬升
   */
  GlMapRegionLift = "glMapRegionLift",

  /**
   * @description 2.5D地图视角漫游
   */
  GlMapSceneRoam = "glMapSceneRoam",

  /**
   * @description 2.5D map icon active state switch
   */
  GlMapIconActive = "glMapIconActive",

  /**
   * @description 跟随图标
   */
  FollowIcon = "followIcon",

  /**
   * @description 鼠标移入
   */
  MouseEnter = "mouseEnter",

  /**
   * @description 鼠标移出
   */
  MouseLeave = "mouseLeave",

  /**
   * @description 发送UE4消息
   */
  SendUe4Msg = "sendUe4Msg",

  /**
   * @description 发送UE4静态消息
   */
  SendUe4MsgStatic = "sendUe4MsgStatic",

  /**
   * @description 视频全屏
   */
  VideoToFullscreen = "videoToFullscreen",

  /**
   * @description 视频切换
   */
  VideoToSwitch = "videoToSwitch",

  /**
   * @description 发送AI消息
   */
  SendAIManMsgStatic = "sendAIManMsgStatic",

  /**
   * @description 轮播卡切换索引
   */
  SwiperCardChangeIndex = "swiperCardChangeIndex",

  /**
   * @description 项目特定功能
   */
  ProjectSpecificFun = "projectSpecificFun",

  /**
   * @description 视频播放
   */
  VideoToPlay = "videoToPlay",

  /**
   * @description 视频暂停
   */
  VideoToPause = "videoToPause",

  /**
   * @description 视频停止
   */
  VideoToStop = "videoToStop",

  /**
   * @description 视频重新播放
   */
  VideoToRestart = "videoToRestart",

  /**
   * @description 视频未静音
   */
  VideoToUnmuted = "videoToUnmuted",

  /**
   * @description 视频静音
   */
  VideoToMuted = "videoToMuted",

  /**
   * @description 视频音量增加
   */
  VideoToAudioUp = "videoToAudioUp",

  /**
   * @description 视频音量减少
   */
  VideoToAudioDown = "videoToAudioDown",

  /**
   * @description 视频快进
   */
  VideoToFastin = "videoToFastin",

  /**
   * @description 视频快退
   */
  VideoToRewind = "videoToRewind",

  /**
   * @description 视频播放范围
   */
  VideoToPlayRange = "videoToPlayRange",

  /**
   * @description 语音控制开始
   */
  VoiceControlStart = "voiceControlStart",

  /**
   * @description 语音控制停止
   */
  VoiceControlStop = "voiceControlStop",

  /**
   * @description 上一页
   */
  prevPage = "prevPage",

  /**
   * @description 下一页
   */
  nextPage = "nextPage",

  /**
   * @description 导出
   */
  OnExport = "onExport",

  /**
   * @description 清除
   */
  OnClear = "onClear",

  /**
   * @description 重做
   */
  OnRedo = "onRedo",

  /**
   * @description 撤销
   */
  OnUndo = "onUndo",

  /**
   * @description 转换图像
   */
  OnTranslateImage = "onTranslateImage",

  /**
   * @description 签名
   */
  Signature = "signature",
  /**
   * @description 跳转页码
   */
  JumpPage = "jumpPage",
  /**
   * @description 轮巡开启
   */
  TurnOnPatrol = "turnOnPatrol",
  /**
   * @description 轮巡暂停
   */
  PausePatrol = "pausePatrol",
  /**
   * @description 轮巡重启
   */
  RestartPatrol = "restartPatrol",

  /**
   * @description 内容滚动暂停
   */
  PauseScroll = "pauseScroll",

  /**
   * @description 内容滚动开始
   */
  StartScroll = "startScroll",

  /**
   * @description 上一个状态
   */
  toPrevStatus = "toPrevStatus",

  /**
   * @description 下一个状态
   */
  toNextStatus = "toNextStatus",

  /**
   * @description 译文转换
   */

  convertTranslation = "convertTranslation",

  /**
   * 切换蓝图
   * */
  SwitchBlueprintTab = "switchBlueprintTab",
  /**
   * 旋转组件-点击触发
   * */
  ClickRotateComponent = "ClickRotateComponent",
  /**
   * 同步视频进度
   * */
  SwitchVideoProgress = "switchVideoProgress"
}

/**
 * @description 动作类型对应组件的映射表
 */
export const Action2ComponentType: Record<ActionTypeEnum, Array<AllComponentType>> = {
  [ActionTypeEnum.Default]: [],
  [ActionTypeEnum.Show]: allComponentType,
  [ActionTypeEnum.Hide]: allComponentType,
  [ActionTypeEnum.ShowHide]: allComponentType,
  [ActionTypeEnum.Moving]: allComponentType,
  [ActionTypeEnum.Scaling]: allComponentType,
  [ActionTypeEnum.ScalingHide]: allComponentType,

  [ActionTypeEnum.SetIndex]: [
    interactiveEnum.Subtabs,
    interactiveEnum.MultiSubtabs,
    interactiveEnum.RollSubtabs,
    interactiveEnum.FtCustomSelect,
    interactiveEnum.ScrollPicker
  ],

  [ActionTypeEnum.UpdateConfig]: [
    BarEchartEnum.echartbar,
    BarEchartEnum.echartstripBar,
    BarEchartEnum.echartbothWayStripBar,
    BarEchartEnum.echartlineAndBar,
    indicatorEchartEnum.echartwordcloud,
    // "echartmap", // TODO: 待添加组件
    pieEchartEnum.echartpie,
    pieEchartEnum.echartloopRingPie,
    pieEchartEnum.echartpluralRosePie,
    pieEchartEnum.echartthreePie,
    BarEchartEnum.echartpictorialbar,
    lineEchartEnum.echartline,
    lineEchartEnum.echartareaLine,
    indicatorEchartEnum.echartprogress,
    indicatorEchartEnum.echartgauge,
    otherEchartEnum.echartfunnel,
    scatterEchartEnum.echartscatter,
    // "echartcommonMap", // TODO: 待添加组件
    indicatorEchartEnum.echartliquidFill,
    otherEchartEnum.echartsankey,
    otherEchartEnum.echartgraph,
    otherEchartEnum.echarttreemap,
    projectEchartEnum.echartzebra,
    projectEchartEnum.echartzebra2,
    projectEchartEnum.echartthreedBar,
    projectEchartEnum.echartrankBar,
    projectEchartEnum.echartthreeQuartersPie,
    projectEchartEnum.echartthinBar,
    projectEchartEnum.echartscalePie,
    projectEchartEnum.echartmultiplyRankBar,
    projectEchartEnum.echartthreedBarAndLine,
    projectEchartEnum.echartdoubleValueLine,
    projectEchartEnum.echartzebraBarAndLine,
    projectEchartEnum.echarteffectScatter,
    projectEchartEnum.echartgrowthRateBar,
    interactiveEnum.FtTimerShaft,
    interactiveEnum.PointTimeline
  ],

  [ActionTypeEnum.UpdateParams]: [
    // "sw-scrolltable", // TODO: 待添加组件
    // "sw-progresstable" // TODO: 待添加组件
  ],

  [ActionTypeEnum.SwitchState]: [
    PanelEnum.dynamicPanel
    // "sw-quote" // TODO: 待添加组件
  ],

  [ActionTypeEnum.SwitchTCState]: [
    // "terminal-control" // TODO: 待添加组件
  ],

  [ActionTypeEnum.SwitchSceneStatus]: [
    threeComponentEnum.Threescene,
    threeComponentEnum.IndustryScene
    // "threescene", // TODO: 待添加组件
    // "maptalks" // TODO: 待添加组件
  ],
  [ActionTypeEnum.SwitchSceneRoam]: [threeComponentEnum.MapTalks],

  [ActionTypeEnum.SwitchSceneLevel]: [threeComponentEnum.IndustryScene],

  [ActionTypeEnum.FocusLayer]: [
    threeComponentEnum.MapTalks
    // TODO: 待添加组件
  ],

  [ActionTypeEnum.HandleApiInstruction]: [threeComponentEnum.Threescene, threeComponentEnum.IndustryScene],

  [ActionTypeEnum.SetAnimationPlay]: [threeComponentEnum.Threescene, threeComponentEnum.IndustryScene],

  [ActionTypeEnum.SetAnimationPause]: [threeComponentEnum.Threescene, threeComponentEnum.IndustryScene],

  [ActionTypeEnum.SetStateAnimationPlay]: [threeComponentEnum.Threescene, threeComponentEnum.IndustryScene],

  [ActionTypeEnum.SwitchSceneObjVisible]: [
    threeComponentEnum.Threescene,
    threeComponentEnum.MapTalks,
    threeComponentEnum.IndustryScene
    // "maptalks" // TODO: 待添加组件
  ],

  [ActionTypeEnum.HandleSceneObjExplosion]: [threeComponentEnum.Threescene],

  [ActionTypeEnum.SwitchSceneChildComponentVisible]: [threeComponentEnum.Threescene, threeComponentEnum.IndustryScene],
  [ActionTypeEnum.SwitchMapChildComponentVisible]: [threeComponentEnum.EchartGlmap],
  [ActionTypeEnum.GlMapRegionLift]: [threeComponentEnum.EchartGlmap],
  [ActionTypeEnum.GlMapSceneRoam]: [threeComponentEnum.EchartGlmap],
  [ActionTypeEnum.GlMapIconActive]: [threeComponentEnum.EchartGlmap],
  [ActionTypeEnum.FollowIcon]: [
    BarEchartEnum.echartbar,
    BarEchartEnum.echartstripBar,
    BarEchartEnum.echartbothWayStripBar,
    BarEchartEnum.echartlineAndBar,
    indicatorEchartEnum.echartwordcloud,
    // "echartmap", // TODO: 待添加组件
    pieEchartEnum.echartpie,
    pieEchartEnum.echartloopRingPie,
    pieEchartEnum.echartpluralRosePie,
    pieEchartEnum.echartthreePie,
    BarEchartEnum.echartpictorialbar,
    lineEchartEnum.echartline,
    lineEchartEnum.echartareaLine,
    indicatorEchartEnum.echartprogress,
    indicatorEchartEnum.echartgauge,
    otherEchartEnum.echartfunnel,
    scatterEchartEnum.echartscatter,
    // "echartcommonMap", // TODO: 待添加组件
    indicatorEchartEnum.echartliquidFill,
    otherEchartEnum.echartsankey,
    otherEchartEnum.echartgraph,
    otherEchartEnum.echarttreemap,
    interactiveEnum.Subtabs,
    projectEchartEnum.echartzebra,
    projectEchartEnum.echartthreedBar,
    projectEchartEnum.echartrankBar,
    projectEchartEnum.echartthreeQuartersPie,
    projectEchartEnum.echartthinBar,
    projectEchartEnum.echartscalePie,
    projectEchartEnum.echartmultiplyRankBar,
    projectEchartEnum.echartthreedBarAndLine,
    projectEchartEnum.echartdoubleValueLine,
    projectEchartEnum.echartzebraBarAndLine,
    projectEchartEnum.echarteffectScatter,
    projectEchartEnum.echartgrowthRateBar,
    PanelEnum.dynamicPanel,
    mediaEnum.FtIframe
  ],

  [ActionTypeEnum.MouseEnter]: [
    interactiveEnum.Subtabs,
    interactiveEnum.MultiSubtabs,
    interactiveEnum.RollSubtabs,
    interactiveEnum.FtMutual,
    interactiveEnum.FtCustomSelect
  ],

  [ActionTypeEnum.MouseLeave]: [
    interactiveEnum.Subtabs,
    interactiveEnum.MultiSubtabs,
    interactiveEnum.RollSubtabs,
    interactiveEnum.FtMutual,
    interactiveEnum.FtCustomSelect
  ],

  [ActionTypeEnum.SendUe4Msg]: [
    extendsEnum.UeVessel,
    extendsEnum.UePeerStreaming,
    extendsEnum.UePixelStreaming,
    extendsEnum.FtUnrealEngine
  ],
  [ActionTypeEnum.SendUe4MsgStatic]: [
    extendsEnum.UeVessel,
    extendsEnum.UePeerStreaming,
    extendsEnum.UePixelStreaming,
    extendsEnum.FtUnrealEngine
  ],
  [ActionTypeEnum.SwitchBlueprintTab]: [extendsEnum.FtUnrealEngine],
  [ActionTypeEnum.VideoToPlay]: [
    mediaEnum.FtVideo
    // "sw-digital-human" // TODO: 待添加组件
  ],
  [ActionTypeEnum.VideoToPause]: [
    mediaEnum.FtVideo
    // "sw-digital-human" // TODO: 待添加组件
  ],
  [ActionTypeEnum.VideoToStop]: [
    mediaEnum.FtVideo
    // "sw-digital-human" // TODO: 待添加组件
  ],
  [ActionTypeEnum.VideoToRestart]: [
    mediaEnum.FtVideo
    // "sw-digital-human" // TODO: 待添加组件
  ],
  [ActionTypeEnum.VideoToFullscreen]: [mediaEnum.FtVideo],
  [ActionTypeEnum.VideoToSwitch]: [
    // "sw-digital-human" // TODO: 待添加组件
  ],
  [ActionTypeEnum.SendAIManMsgStatic]: [extendsEnum.FtDigitalHuman],
  [ActionTypeEnum.SwiperCardChangeIndex]: [
    mediaEnum.FtSwiperCard,
    ExhibitEnum.ImagesList3d, // TODO: 待添加组件
    ExhibitEnum.verticalCard
  ],
  [ActionTypeEnum.ProjectSpecificFun]: [
    // "map-project" // TODO: 待添加组件
  ],
  [ActionTypeEnum.VideoToUnmuted]: [mediaEnum.FtVideo],
  [ActionTypeEnum.VideoToMuted]: [mediaEnum.FtVideo],
  [ActionTypeEnum.VideoToAudioUp]: [mediaEnum.FtVideo],
  [ActionTypeEnum.VideoToAudioDown]: [mediaEnum.FtVideo],
  [ActionTypeEnum.VideoToFastin]: [mediaEnum.FtVideo],
  [ActionTypeEnum.VideoToRewind]: [mediaEnum.FtVideo],
  [ActionTypeEnum.VideoToPlayRange]: [mediaEnum.FtVideo],
  [ActionTypeEnum.SwitchVideoProgress]: [mediaEnum.FtVideo],
  [ActionTypeEnum.VoiceControlStart]: [interactiveEnum.FtVoiceControl],
  [ActionTypeEnum.VoiceControlStop]: [interactiveEnum.FtVoiceControl],
  [ActionTypeEnum.JumpPage]: [ExhibitEnum.PdfjsViewer],
  [ActionTypeEnum.prevPage]: [
    ExhibitEnum.PdfjsViewer,
    ExhibitEnum.FtSlidecardV1,
    ExhibitEnum.FtTurnPage,
    MediaEnum.CtVideoPanel
  ],
  [ActionTypeEnum.nextPage]: [
    ExhibitEnum.PdfjsViewer,
    ExhibitEnum.FtSlidecardV1,
    ExhibitEnum.FtTurnPage,
    MediaEnum.CtVideoPanel
  ],
  [ActionTypeEnum.OnExport]: [ExhibitEnum.FtSignaturePad],
  [ActionTypeEnum.OnClear]: [ExhibitEnum.FtSignaturePad],
  [ActionTypeEnum.OnRedo]: [ExhibitEnum.FtSignaturePad],
  [ActionTypeEnum.OnUndo]: [ExhibitEnum.FtSignaturePad],
  [ActionTypeEnum.Signature]: [ExhibitEnum.FtSignaturePad],
  [ActionTypeEnum.convertTranslation]: [ExhibitEnum.FtTranslation],
  [ActionTypeEnum.OnTranslateImage]: [],

  [ActionTypeEnum.TurnOnPatrol]: [interactiveEnum.PointTimeline, PanelEnum.dynamicPanel],
  [ActionTypeEnum.PausePatrol]: [interactiveEnum.PointTimeline, PanelEnum.dynamicPanel],
  [ActionTypeEnum.RestartPatrol]: [interactiveEnum.PointTimeline, PanelEnum.dynamicPanel],
  [ActionTypeEnum.PauseScroll]: [PanelEnum.dynamicPanel],
  [ActionTypeEnum.StartScroll]: [PanelEnum.dynamicPanel],
  [ActionTypeEnum.toPrevStatus]: [PanelEnum.dynamicPanel],
  [ActionTypeEnum.toNextStatus]: [PanelEnum.dynamicPanel],
  [ActionTypeEnum.ClickRotateComponent]: [ExhibitEnum.FtRotate]
};

export const ActionList: { label: string; value: ActionTypeEnum }[] = [
  { label: "显示", value: ActionTypeEnum.Show },
  { label: "隐藏", value: ActionTypeEnum.Hide },
  { label: "显隐切换", value: ActionTypeEnum.ShowHide },
  { label: "移动", value: ActionTypeEnum.Moving },
  { label: "缩放", value: ActionTypeEnum.Scaling },
  { label: "缩放隐藏", value: ActionTypeEnum.ScalingHide },
  // { label: '旋转', value: ActionTypeEnum.Rotate },
  { label: "更新组件配置", value: ActionTypeEnum.UpdateConfig },
  { label: "更新组件数据", value: ActionTypeEnum.UpdateParams },
  { label: "切换组件状态", value: ActionTypeEnum.SwitchState },
  { label: "切换终端状态", value: ActionTypeEnum.SwitchTCState },
  { label: "切换场景状态", value: ActionTypeEnum.SwitchSceneStatus },
  { label: "切换场景视角", value: ActionTypeEnum.SwitchSceneRoam },
  { label: "切换场景关卡", value: ActionTypeEnum.SwitchSceneLevel },
  { label: "切换场景对象显隐", value: ActionTypeEnum.SwitchSceneObjVisible },
  { label: "场景对象爆炸动画", value: ActionTypeEnum.HandleSceneObjExplosion },
  { label: "切换场景子组件显隐", value: ActionTypeEnum.SwitchSceneChildComponentVisible },
  { label: "切换地图子组件显隐", value: ActionTypeEnum.SwitchMapChildComponentVisible },
  { label: "地块抬升", value: ActionTypeEnum.GlMapRegionLift },
  { label: "视角漫游", value: ActionTypeEnum.GlMapSceneRoam },
  { label: "切换标牌选中状态", value: ActionTypeEnum.GlMapIconActive },
  { label: "Api指令集", value: ActionTypeEnum.HandleApiInstruction },
  { label: "播放关键帧动画", value: ActionTypeEnum.SetAnimationPlay },
  { label: "暂停关键帧动画", value: ActionTypeEnum.SetAnimationPause },
  { label: "播放状态动画", value: ActionTypeEnum.SetStateAnimationPlay },
  { label: "设置选中项", value: ActionTypeEnum.SetIndex },
  { label: "跟随图标", value: ActionTypeEnum.FollowIcon },
  { label: "聚焦倾斜部件", value: ActionTypeEnum.FocusLayer },
  { label: "向ue发送消息(动态)", value: ActionTypeEnum.SendUe4Msg },
  { label: "向ue发送消息(静态)", value: ActionTypeEnum.SendUe4MsgStatic },
  { label: "切换蓝图", value: ActionTypeEnum.SwitchBlueprintTab },
  { label: "视频播放", value: ActionTypeEnum.VideoToPlay },
  { label: "视频暂停", value: ActionTypeEnum.VideoToPause },
  { label: "视频停止", value: ActionTypeEnum.VideoToStop },
  { label: "视频重播", value: ActionTypeEnum.VideoToRestart },
  { label: "切换视频", value: ActionTypeEnum.VideoToSwitch },
  { label: "视频全屏", value: ActionTypeEnum.VideoToFullscreen },
  { label: "向数字人发送消息", value: ActionTypeEnum.SendAIManMsgStatic },
  { label: "项目特有Api指令", value: ActionTypeEnum.ProjectSpecificFun },
  { label: "设置轮播选中页", value: ActionTypeEnum.SwiperCardChangeIndex },
  { label: "视频声音开", value: ActionTypeEnum.VideoToUnmuted },
  { label: "视频声音关", value: ActionTypeEnum.VideoToMuted },
  { label: "视频音量+", value: ActionTypeEnum.VideoToAudioUp },
  { label: "视频音量-", value: ActionTypeEnum.VideoToAudioDown },
  { label: "视频快进→", value: ActionTypeEnum.VideoToFastin },
  { label: "视频后退←", value: ActionTypeEnum.VideoToRewind },
  { label: "视频播放区间", value: ActionTypeEnum.VideoToPlayRange },
  { label: "麦克风开始", value: ActionTypeEnum.VoiceControlStart },
  { label: "麦克风结束", value: ActionTypeEnum.VoiceControlStop },
  { label: "上一页", value: ActionTypeEnum.prevPage },
  { label: "下一页", value: ActionTypeEnum.nextPage },
  { label: "导出", value: ActionTypeEnum.OnExport },
  { label: "清除", value: ActionTypeEnum.OnClear },
  { label: "重做", value: ActionTypeEnum.OnRedo },
  { label: "撤销", value: ActionTypeEnum.OnUndo },
  { label: "传递图片", value: ActionTypeEnum.OnTranslateImage },
  { label: "跳转页码", value: ActionTypeEnum.JumpPage },
  { label: "轮巡开启", value: ActionTypeEnum.TurnOnPatrol },
  { label: "轮巡暂停", value: ActionTypeEnum.PausePatrol },
  { label: "轮巡重启", value: ActionTypeEnum.RestartPatrol },
  { label: "内容滚动暂停", value: ActionTypeEnum.PauseScroll },
  { label: "内容滚动开始", value: ActionTypeEnum.StartScroll },
  { label: "上一个状态", value: ActionTypeEnum.toPrevStatus },
  { label: "下一个状态", value: ActionTypeEnum.toNextStatus },
  { label: "译文转换", value: ActionTypeEnum.convertTranslation },
  // 旋转组件-点击触发
  { label: "点击触发", value: ActionTypeEnum.ClickRotateComponent },
  { label: "同步视频进度", value: ActionTypeEnum.SwitchVideoProgress }
];

/**
 * 条件逻辑类型枚举
 * @description 定义多条件之间的逻辑关系：one=任一满足, and=全部满足, all=所有
 */
export enum ConditionLogicTypeEnum {
  One = "one",
  And = "and",
  All = "all"
}

/**
 * 条件类型枚举
 * @description 定义条件判断的类型
 */
export enum ConditionTypeEnum {
  Field = "field",
  Custom = "custom"
}

/**
 * 条件比较枚举
 * @description 定义条件比较的操作符
 */
export enum ConditionCompareEnum {
  Equal = "==",
  NotEqual = "!=",
  LessThan = "<",
  GreaterThan = ">",
  LessThanOrEqual = "<=",
  GreaterThanOrEqual = ">=",
  Include = "include",
  Exclude = "exclude"
}

/**
 * 时间函数类型
 * @description 定义动画的时间缓动函数
 */
export type timingFunctionType = "none" | "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";

/**
 * 动作动画类型枚举
 * @description 定义动作动画的类型
 */
export enum ActionAnimationTypeEnum {
  None = "none",
  Opacity = "opacity",
  SlideLeft = "slideLeft",
  SlideRight = "slideRight",
  SlideUp = "slideUp",
  SlideDown = "slideDown"
}

/**
 * TCP/UDP数据类型枚举
 * @description 定义TCP/UDP通信的数据类型
 */
export enum tcpudpDataTypeEnum {
  None = "",
  TCP = "1",
  UDP = "2",
  WebSocket = "3"
}

/**
 * 可见性类型枚举
 */
export enum VisibleTypeEnum {
  Show = "show",
  Hide = "hide"
}

/**
 * UE4消息类型枚举
 */
export enum MessageTypeEnum {
  String = "string",
  Json = "json"
}

/**
 * UDP发送类型枚举
 */
export enum UDPSendtypeEnum {
  Unicast = "unicast",
  Broadcasting = "broadcasting"
}

/**
 * 参数类型枚举
 */
export enum ParameterTypeEnum {
  Default = "default",
  Custom = "custom"
}

/**
 * 组件作用域枚举
 */
export enum ComponentScopeEnum {
  Current = "current",
  All = "all"
}

/**
 * 场景对象爆炸类型枚举
 */
export enum SceneObjectExplosionType {
  Explode = "explode",
  Restore = "restore"
}

/**
 * 临时池接口
 * @description 临时数据池，用于存储临时过滤器和数据格式化信息
 */
export type TempPool = Omit<Condition, "id" | "notSaved" | "tempPool">;

/**
 * 条件类型接口
 * @description 定义事件触发条件的详细配置
 */
export interface Condition {
  /**
   * @description 条件唯一标识符
   */
  id: string;

  /**
   * @description 条件名称
   */
  name: string;

  /**
   * @description 条件代码
   * @example { return data }
   */
  code: string;

  /**
   * @description 条件类型
   */
  type: ConditionTypeEnum;

  /**
   * @description 比较类型
   */
  compare: ConditionCompareEnum;

  /**
   * @description 预期值
   */
  expected: string;

  /**
   * @description 字段
   */
  field: string;

  /**
   * @description 是否未保存
   */
  notSaved: boolean;

  /**
   * @description 是否存在
   */
  isExists: boolean;

  /**
   * @description 临时池
   */
  tempPool: TempPool;
}

/**
 * 动画配置接口
 * @description 定义动作的动画效果
 */
export interface ActionAnimation {
  /** 动画延迟时间（毫秒） */
  delay: number;
  /** 动画持续时间（毫秒） */
  duration: number;
  /** 时间函数/缓动效果 */
  timingFunction: timingFunctionType;
  /** 动画类型 */
  type: ActionAnimationTypeEnum;
  /** 索引值 */
  idxValue: number | string;
  /** 是否重命名（可选） */
  isRename?: boolean;
}

/**
 * 地图坐标配置
 * @description 定义地图的偏移坐标
 */
export interface MapBox {
  /** X轴偏移量 */
  boxOffsetX: number;
  /** Y轴偏移量 */
  boxOffsetY: number;
}

/**
 * 图层信息配置
 * @description 定义图层的显示和回调信息
 */
export interface LayerInfo {
  /** 图层颜色 */
  color: string;
  /** 图层名称 */
  name: string;
  /** 回调字段 */
  callBackField: string;
  /** 子节点字段 */
  childNodeField: string;
}

/**
 * 原点网格配置
 * @description 定义缩放原点的网格位置
 */
export interface OriginGrid {
  /** 左边距 */
  left: string;
  /** 顶边距 */
  top: string;
}

/**
 * 缩放配置
 * @description 定义组件的缩放参数
 */
export interface Scale {
  /** 是否锁定缩放 */
  lock: boolean;
  /** 缩放原点 */
  origin: string;
  /** 原点网格位置 */
  originGrid: OriginGrid;
  /** X轴缩放比例 */
  x: number;
  /** Y轴缩放比例 */
  y: number;
}

/**
 * 位移配置
 * @description 定义组件的位移参数
 */
export interface Translate {
  /** X轴目标位置 */
  toX: number;
  /** Y轴目标位置 */
  toY: number;
}

/**
 * 场景对象配置
 * @description 定义3D场景中的对象操作
 */
export interface SceneObject {
  /** 对象名称列表 */
  nameList: string[];
  /** 对象名称（可选） */
  name?: string;
  /** 对象信息列表 */
  objInfoList: any[];
  /** 可见性状态 */
  visible: string;
}

/**
 * 场景对象爆炸配置
 * @description 定义场景对象爆炸效果的配置
 */
export interface SceneObjectExplosion {
  /** 对象ID */
  index: string;
  /** 机盖名称 */
  lidName: string;
  /** 机底名称 */
  baseName: string;
  /** 爆炸类型 */
  type: string;
}

/**
 * 场景子组件配置
 * @description 定义场景子组件的操作
 */
export interface SceneChildComponent {
  /** 子组件名称列表 */
  nameList: string[];
  /** 子组件信息列表 */
  childComponentInfoList: any[];
  /** 可见性状态 */
  visible: string;
}

/**
 * 地图子组件配置
 * @description 定义地图子组件的操作
 */
export interface MapChildComponent {
  /** 子组件名称列表 */
  nameList: string[];
  /** 子组件信息列表 */
  childComponentInfoList: any[];
  /** 可见性状态 */
  visible: string;
}

/**
 * 2.5D 地图地块抬升动作配置
 */
export interface GlMapRegionLift {
  /** 地块选项 ID，当前与 adcode 保持一致 */
  regionId: string;
  /** 地块行政编码/区域编码 */
  adcode: string;
  /** 地块显示名称 */
  name: string;
  /** 抬升高度，语义与地图配置的悬停抬升一致 */
  height: number;
  /** 抬升动画间隔/时长，单位毫秒 */
  duration: number;
}

/**
 * 2.5D 地图视角漫游动作配置
 */
export interface GlMapSceneRoam {
  /** 场景管理中的场景 ID */
  sceneId: string;
}

export type GlMapIconActiveAction = "select" | "unselect" | "toggle";
export type GlMapIconActiveMatchValueSource = "static" | "event";

/**
 * 2.5D 地图标牌选中状态切换动作配置
 */
export interface GlMapIconActive {
  /** 标牌子组件 ID，空字符串表示匹配所有标牌子组件 */
  childId: string;
  /** 标牌数据匹配字段 */
  matchField: string;
  /** 标牌数据匹配值 */
  matchValue: string;
  /** 匹配值来源 */
  matchValueSource: GlMapIconActiveMatchValueSource;
  /** 当匹配值来源为事件字段时，从事件抛出值里读取的字段路径 */
  eventField: string;
  /** 选中状态操作 */
  action: GlMapIconActiveAction;
  /** 是否排他选中 */
  exclusive: boolean;
  /** 未匹配时是否清空选中 */
  clearWhenMiss: boolean;
}

/**
 * UE4引擎配置
 * @description 定义与UE4引擎的通信配置
 */
export interface Ue4Config {
  /** 消息名称 */
  messageName: string;
  /** 消息JSON */
  messageJson: string;
  /** 消息内容 */
  messageContent: string;
  /** 消息类型 */
  messageType: string;
}

/**
 * TCP/UDP协议配置
 * @description 定义TCP/UDP数据传输配置
 */
export interface TcpudpConfig {
  /** 数据类型 */
  dataType: tcpudpDataTypeEnum;
  /** 数据源ID */
  dataSourceId: string;
  /** 数据源对象 */
  dataSourceObj: DataSourceType | null;
  /** 发送数据 */
  sendData: string;
  /** 发送类型 */
  sendType: string;
  /** 数据延迟（毫秒） */
  dataDelay: number;
}

/**
 * 动作接口
 * @description 定义事件的具体执行动作，包含所有可能的动作配置
 */
export interface Action {
  /** @description 动作唯一标识符 */
  id: string;

  /** @description 动作显示名称 */
  name: string;

  /** @description 动作类型 */
  action: ActionTypeEnum;

  /** @description 动作关联的扩展配置数据 */
  actionData?: Record<string, any>;

  /** @description 动画配置 */
  animation?: ActionAnimation;

  /** @description 地图坐标相关配置 */
  mapBox?: MapBox;

  /** @description 图层信息配置 */
  layerInfo?: LayerInfo;

  /**
   * @description 关联的组件ID列表
   * @example
   * ["$component(1305156)","$component(1305157)","$component(1305158)"]
   */
  component: string[];

  /** @description 组件配置参数 */
  componentConfig?: Pick<ComponentType, "component" | "option" | "name" | "left" | "top">;

  /** @description 组件作用域 */
  componentScope?: string;

  /** @description 状态面板（用于状态切换） */
  stateId?: string;

  /** @description 场景状态名称 */
  sceneStatusName?: string;

  /** @description 场景状态切换延迟（毫秒） */
  switchSceneStatusDelay?: number;

  /** @description 快进时间（毫秒） */
  timeFastIn?: number;

  /** @description 后退时间（毫秒） */
  timeRewind?: number;

  /** @description 场景关卡id */
  sceneLevelId?: number;

  /** @description 关键帧动画名称 */
  keyframesName?: string;

  /** @description 关键帧播放延迟（毫秒） */
  keyframesPlayDelay?: number;

  /** @description 状态动画名称 */
  stateAnimationName?: string;

  /** @description 动画状态 */
  animationState?: number;

  /** @description 状态动画播放延迟（毫秒） */
  stateAnimationPlayDelay?: number;

  /** @description 场景对象配置 */
  sceneObject?: SceneObject;

  /** @description 场景对象爆炸配置 */
  sceneObjectExplosion?: SceneObjectExplosion;

  /** @description 场景子组件配置 */
  sceneChildComponent?: SceneChildComponent;

  /** @description 地图子组件配置 */
  mapChildComponent?: MapChildComponent;

  /** @description 2.5D 地图地块抬升配置 */
  glMapRegionLift?: GlMapRegionLift;

  /** @description 2.5D 地图视角漫游配置 */
  glMapSceneRoam?: GlMapSceneRoam;

  /** @description 2.5D 地图标牌选中状态切换配置 */
  glMapIconActive?: GlMapIconActive;

  /** @description API指令详情 */
  apiInstructionDetail?: string;

  /** @description API指令延迟（毫秒） */
  apiInstructionDelay?: number;

  /** @description 缩放配置 */
  scale?: Scale;

  /** @description 位移配置 */
  translate?: Translate;

  /** @description 加密密钥（可为空） */
  encodeKey?: string | null;

  /** @description UE4引擎配置 */
  ue4Config?: Ue4Config;

  /** @description UE4 蓝图 key，用于切换蓝图 */
  blueprintKey?: string;

  /** @description 自定义动作类型标识 */
  customActionType?: "component" | "message" | "statusAnimation";

  /** @description 面板状态动画ID */
  panelStatusAnimationId?: string;

  /** @description 面板状态ID */
  panelStatusId?: string;

  /** @description TCP/UDP协议配置 */
  tcpudpConfig?: TcpudpConfig;

  /** @description 项目函数名称 */
  projectFunName?: string;

  /** @description 项目参数列表 */
  projectParamList?: any[];

  /** @description 项目参数类型 */
  projectParamType?: string;

  /** @description 项目参数键值对 */
  projectParamValue?: Record<string, any>;

  /** @description 项目参数代码 */
  projectParamCode?: string;

  /** @description 轮播卡片标签名称 */
  swiperCardTabsName?: string;

  /** @description 数字人消息内容 */
  aiManMsgContent?: string;

  /** @description 广播ID（可为空） */
  setBroadcastId?: string | null;

  /** @description 视频开始时间（秒，可为空） */
  videoStartTime?: number;

  /** @description 视频结束时间（秒，可为空） */
  videoEndTime?: number;

  /** @description 事件选择模型集合 */
  option?: Record<string, any>;

  /** @description 当前页码 */
  currentpage?: number;

  /** @description 译文转换 */
  translation?: string;
}

/**
 * 加密动作接口
 * @description 加密处理的事件动作配置
 */
export interface EncodeAction {
  /**
   * @description 动作唯一标识符
   */
  id: string;

  /**
   * @description 动作显示名称
   */
  name: string;

  /**
   * @description 动作类型
   */
  action: string;

  /**
   * @description 动作关联的扩展配置数据
   */
  actionData: Record<string, any>;

  /**
   * @description 关联的组件ID列表
   * @example
   * ["$component(1305156)","$component(1305157)","$component(1305158)"]
   */
  component: string[];

  /**
   * @description 组件配置参数
   */
  componentConfig: Pick<ComponentType, "component" | "option" | "name" | "left" | "top">;

  /**
   * @description 组件作用域
   */
  componentScope: string;

  /**
   * @description 标签（可为空）
   */
  encodeLabel: string | null;

  /**
   * @description 键值（可为空）
   */
  encodeKey: string | null;

  /**
   * @description 数值数组
   */
  encodeValue: number[];
}
