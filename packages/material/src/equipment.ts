// 物联组件（Equipment）物料入口：渲染 map + 配置面板 editor。
// 物联组件全部物料化（无 app 保留项），app 侧 componentOption/equipmentComponent.ts 纯转发。
export { ScreenwrightEquipmentComponentMap as component } from "./components/ScreenwrightEquipmentComponent";
export { EquipmentConfigComponent as editor, optionType as equipmentOptionType } from "./editor-ui/equipmentComponent";
