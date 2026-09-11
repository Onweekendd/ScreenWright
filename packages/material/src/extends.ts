// 扩展组件（Extends）物料入口：仅收录已物料化的轻量扩展组件；
// 数字人（FtDigitalHuman）与 UE 串流仍留在 app，由 app 侧分发表合并。
export { ScreenwrightExtendsComponentMap as component } from "./components/ScreenwrightExtendsComponent";
export {
  ExtendsConfigComponent as editor,
  optionType as extendsOptionType,
} from "./editor-ui/extendsComponent";
