/**
 * 属性配置面板的 Tab 类型（样式/数据/交互）。
 * @description 编辑器配置面板与子组件编辑抽屉共用的 Tab 枚举，需保持同一份声明，
 * 避免 app 与 @screenwright/composables 各自声明出两个字符串值相同但类型不兼容的枚举。
 */
export enum echartsTabEnum {
  INTERACTIVE = "interactive",
  STYLE = "style",
  DATA = "data"
}
