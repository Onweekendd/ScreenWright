import type { EditorCoreState } from "../types/state";

/**
 * 编辑器状态接口（框架无关）。
 *
 * core 自身不实现任何响应式；状态的存储由 UI 层提供具体实现
 * （例如 Vue 层用 reactive 实现）。
 * 这是 UI 与逻辑分离的关键边界：所有 Manager 只通过此接口读写状态。
 */
export interface EditorState<S extends object = EditorCoreState> {
  /** 读取当前完整状态。 */
  getState(): S;

  /** 以浅合并方式更新状态。 */
  setState(patch: Partial<S>): void;
}
