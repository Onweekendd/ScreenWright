// 大屏相关
export type {
  LargeScreeInfo,
  LargeScreenDetailInfo,
  ParsedLargeScreenInfo,
  Prohibition,
  ScreenFilterInfo,
  TerminalEnableArr,
  WaterMark
} from "./large-screen";
export { AdaptationType, adaptationType } from "./large-screen";

// 组件属性类型（所有组件枚举）
export type { ArtifactAppPreviewData, ArtifactAppPreviewMode, ArtifactAppPreviewOption } from "./artifact-app-preview";
export type { AllComponentType, EchartComponentType } from "./componentProp";

// 组件属性 const enum（新版本，推荐使用）
export {
  AllEchartEnum,
  BarEchartEnum,
  EquipmentEnum,
  ExhibitEnum,
  ExtendsChildComponentEnum,
  extendsChildComponentEnum,
  ExtendsEnum,
  extendsEnum,
  FolderEnum,
  IndicatorEchartEnum,
  indicatorEchartEnum,
  IndicatorEnum,
  InteractiveEnum,
  LineEchartEnum,
  lineEchartEnum,
  MediaEnum,
  OtherEchartEnum,
  otherEchartEnum,
  PanelEnum,
  PieEchartEnum,
  pieEchartEnum,
  ProjectEchartEnum,
  projectEchartEnum,
  RingEchartEnum,
  ringEchartEnum,
  ScatterEchartEnum,
  scatterEchartEnum,
  SceneEnum,
  sceneEnum,
  TextEnum,
  ThirdPartEnum,
  ThreeComponentEnum
} from "./componentProp";

// 组件属性 const enum（原始命名，已存在）
export { indicatorEnum, interactiveEnum, mediaEnum, textEnum, threeComponentEnum } from "./componentProp";

// 组件属性类型别名（向后兼容，已弃用）
export type {
  AllEchartType,
  BarEchartType,
  EquipmentEnumType,
  ExhibitEnumType,
  extendsChildComponentEnumType,
  extendsEnumType,
  FolderType,
  indicatorEchartType,
  lineEchartsType,
  otherEchartType,
  PanelType,
  pieEchartType,
  projectEchartType,
  ringEchartType,
  scatterEchartType,
  sceneEnumType,
  ThirdPartEnumType
} from "./componentProp";

// 组件核心类型
export type {
  Animation,
  BindComponent,
  Callback,
  CallbackManager,
  CallbackRelation,
  CallbackSource,
  CallbackTarget,
  ChildComponent,
  ComponentMinioAsset,
  ComponentType,
  DataRemark,
  DataSourceType,
  DbItem,
  Filter,
  IotAddress,
  IotConfig,
  ListenArg,
  MinioResource,
  OperateCode,
  PanelState,
  StandardComponentType,
  SystemComponentProps,
  WebSocketDataSource
} from "./component";
export { DataType, horizontalConstEnum, verticalConstEnum } from "./component";

// Event 相关类型
export type { EncodeEvent, Event, eventToTriggerFunction } from "./event";
export {
  allowEventComponentList,
  EncodeEvent2ComponentType,
  EncodeEventList,
  EncodeEventTypeEnum,
  Event2ComponentType,
  EventList,
  EventTypeEnum
} from "./event";

// 组件事件方法映射（组件实现的事件方法签名总映射，app 与物料包共用）
export type { toAddEvent, TotalPanelEventMap } from "./component-event";

// Action 相关类型
export type {
  Action,
  ActionAnimation,
  Condition,
  EncodeAction,
  LayerInfo,
  MapBox,
  OriginGrid,
  Scale,
  SceneChildComponent,
  SceneObject,
  TcpudpConfig,
  TempPool,
  timingFunctionType,
  Translate,
  Ue4Config
} from "./action";
export {
  Action2ComponentType,
  ActionAnimationTypeEnum,
  ActionList,
  ActionTypeEnum,
  ComponentScopeEnum,
  ConditionCompareEnum,
  ConditionLogicTypeEnum,
  ConditionTypeEnum,
  MessageTypeEnum,
  ParameterTypeEnum,
  SceneObjectExplosionType,
  tcpudpDataTypeEnum,
  UDPSendtypeEnum,
  VisibleTypeEnum
} from "./action";

// 动画类型
export type {
  ActionType,
  ActiveAnimationList,
  AnimationDirection,
  AnimationInfo,
  AnimationItem,
  AnimationProperty,
  AnimationResponseItem,
  AnimationType,
  ComponentAnimationConfig,
  ComponentNode,
  ComponentResponseSetting,
  ComponentSettingItem,
  CustomAnimationState,
  GroupNode,
  OnAnimationPropertyChangePayload,
  PropertyGroup,
  PropertyNode,
  PropertyState,
  StatusAnimationMapping,
  StatusAnimationResponse,
  TimingFunctionType
} from "./animation";

// 导出相关类型
export type { CityConfig, FontFile, GeoFile, HtmlGenerateOptions, ResourceFile, SceneConfig } from "./export";

// UI Tab 类型
export { echartsTabEnum } from "./ui-tabs";

// 素材/资源相关（从主包下沉，物料包共享）
export type { MenuItemForRender, ScreenVersion } from "./asset";
export { FileTypeEnum, ResourceTypeEnum } from "./asset";

// IoT 设备相关类型（从主包 dataIotConfig/type 下沉，物料包共享）
export * from "./iot";
