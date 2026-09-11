import { ScreenEditor, setCallbackArgsSource } from "@screenwright/core";
import { createGlobalState } from "@vueuse/core";

import { VueEditorState } from "./VueEditorState";

/**
 * 全局单例：编辑器核心实例（@screenwright/core）+ Vue 响应式状态后端。
 *
 * 这是 Vue 应用访问 core 的唯一入口（相当于视频编辑器 demo 里的 EditorContext）。
 * 各业务 composable（useLargeScreenInfo 等）通过它取得对应 Manager。
 */
export const useScreenEditor = createGlobalState(() => {
  const editor = ScreenEditor.create(new VueEditorState());
  // CallbackArguments 已不是单例（Node 侧一个进程可能有多块大屏）。过滤器运行时深在调用链里、
  // 拿不到编辑器引用，故在此把本应用唯一的那个实例注册为运行时回调参数来源，
  // 与 filter/baseFilter.ts 注入 FilterResultSink 是同一套做法。
  setCallbackArgsSource(editor.event.callbackArguments);
  return editor;
});
