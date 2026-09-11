// CommandManager 已迁移到 @screenwright/core（普通数组 + subscribe，去除了 vue 的 shallowRef/computed）。
// 原 getCanUndo/getCanRedo（computed）职责移到适配层 useCommandHistory。
// 此处再导出以保持原有导入路径不变。
export { CommandManager } from "@screenwright/core";
