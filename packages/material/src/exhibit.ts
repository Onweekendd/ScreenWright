export { ScreenwrightExhibitComponentMap as component } from "./components/ScreenwrightExhibitComponent";
export { default as markdownView } from "./components/ScreenwrightExhibitComponent/utils/markdownView.vue";
export { ExhibitConfigComponent as editor, optionType } from "./editor-ui/exhibitComponent/index";

// 展项渲染/配置面板内的通用子项，供 app 内未物料化的组件（数字人、AI 图表、弹幕、状态动画属性编辑等）复用
export { default as ImagePreviewDialog } from "./editor-ui/exhibitComponent/components/imagePreviewDialog.vue";
export { useImagePreviewDialog } from "./editor-ui/exhibitComponent/components/useImagePreviewDialog";
export type { ImageItem } from "./editor-ui/exhibitComponent/types";
