/**
 * 扩展组件类型
 * @description 扩展类组件的类型标识
 */

/**
 * 扩展组件枚举
 * @description 各种扩展组件的类型标识
 */
export enum ExtendsEnum {
  /** UE对等流 */
  UePeerStreaming = "ue-peer-streaming",
  /** UE容器 */
  UeVessel = "ue-vessel",
  /** 虚幻引擎 */
  SwUnrealEngine = "sw-unreal-engine",
  /** UE像素流 */
  UePixelStreaming = "ue-pixel-streaming",
  /** 数字人 */
  SwDigitalHuman = "sw-digital-human",
  /** 闪点组件 */
  SimpleStar = "simpleStar",
  /** 全屏切换 */
  FullScreenSwitch = "fullScreenSwitch",
  /** 页面刷新 */
  PageReload = "pageReload",
  /** 上升粒子 */
  SimpleParticle = "simple-particle",
  /** 数据容器 */
  SwDataContainer = "sw-dataContainer",
  /** 天气 */
  SwWeather = "sw-weather",
  /** 遮罩层 */
  SwMaskLayer = "sw-mask-layer"
}

/**
 * 扩展子组件枚举
 * @description 扩展组件的子组件类型标识
 */
export enum ExtendsChildComponentEnum {
  /** UE子组件 */
  UeVessel_UeMessageReceiver = "ue-vessel-child",
  SwUnrealEngine_UeMessageReceiver = "sw-unreal-engine-child",
  UePixelStreaming_UeMessageReceiver = "ue-pixel-streaming-child",
  UePeerStreaming_UeMessageReceiver = "ue-peer-streaming-child"
}

/** @deprecated 使用 ExtendsEnum 代替 */
export const extendsEnum = ExtendsEnum;

/** @deprecated 使用 ExtendsEnum 代替 */
export type extendsEnumType = ExtendsEnum;

/** @deprecated 使用 ExtendsChildComponentEnum 代替 */
export const extendsChildComponentEnum = ExtendsChildComponentEnum;

/** @deprecated 使用 ExtendsChildComponentEnum 代替 */
export type extendsChildComponentEnumType = ExtendsChildComponentEnum;
