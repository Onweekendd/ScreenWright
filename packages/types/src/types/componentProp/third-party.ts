/**
 * 第三方组件类型
 * @description 第三方类组件的类型标识
 */

/**
 * 第三方组件枚举
 * @description 各种第三方组件的类型标识
 */
export enum ThirdPartEnum {
  /** Vue片段 */
  VuePart = "vue-part",
  /** DataV */
  DataV = "datav",
  /** Echarts通用 */
  EchartCommon = "echartcommon",
  /** 自定义组件 */
  CustomComponent = "custom-component"
}

/** @deprecated 使用 ThirdPartEnum 代替 */
export type ThirdPartEnumType = ThirdPartEnum;
