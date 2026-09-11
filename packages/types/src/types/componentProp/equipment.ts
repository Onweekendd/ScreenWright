/**
 * 设备组件类型
 * @description 物联网设备类组件的类型标识
 */

/**
 * 设备组件枚举
 * @description 各种物联网设备组件的类型标识
 */
export enum EquipmentEnum {
  /** 通用设备 */
  IotGeneralEquipment = "iotGeneralEquipment",
  /** 音量滑块 */
  IotFormSlider = "iotFormSlider",
  /** 开关 */
  IotFormSwitch = "iotFormSwitch",
  /** 页面切换 */
  IotSubTabs = "iotSubtabs",
  /** 设备控件 */
  IotMutual = "iotMutual"
}

/** @deprecated 使用 EquipmentEnum 代替 */
export type EquipmentEnumType = EquipmentEnum;
