export { ScreenwrightTextComponent as component } from "./components/ScreenwrightText";
export {
  type ConfigTab,
  ScreenwrightTextConfigComponent as editor,
  optionType,
} from "./editor-ui/textComponent/index";

// 通用纯校验函数，供 app 内非 ScreenwrightText 的组件（如 echartcommonMap）复用
export { validData } from "./components/ScreenwrightText/components/utils";

// 文本配置面板内的通用子项/常量/组件，供 app 内未物料化的配置面板（设备、展示、扩展等 Global）复用
export { objectFit } from "./editor-ui/textComponent/textConfig/constants";
export { typeAttrs } from "./editor-ui/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";
export { default as ItemSelectAlign } from "./editor-ui/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
export { useItemTextShadowAttrs } from "./editor-ui/textComponent/textConfig/ItemComponent/ItemTextShadow/useItemTextShadow";
export { default as ItemTextShadow } from "./editor-ui/textComponent/textConfig/ItemComponent/ItemTextShadow/index.vue";
