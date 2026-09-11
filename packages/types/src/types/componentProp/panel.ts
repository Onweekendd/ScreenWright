/**
 * 面板组件类型
 * @description 系统面板组件的类型标识
 */

/**
 * 面板枚举
 * @description 各种系统面板组件的类型标识
 */
export enum PanelEnum {
  /** 动态面板 */
  dynamicPanel = "sw-panel",
  /** 终端控制面板 */
  encodePanel = "terminal-control",
  /** 引用面板 */
  quotePanel = "sw-quote",
  /** Artifact 应用预览 */
  artifactAppPreview = "artifact-app-preview"
}

/** @deprecated 使用 PanelEnum 代替 */
export type PanelType = PanelEnum;
