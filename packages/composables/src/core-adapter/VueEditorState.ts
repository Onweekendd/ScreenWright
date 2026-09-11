import { createInitialState, type EditorCoreState, type EditorState } from "@screenwright/core";
import { reactive } from "vue";

/**
 * Vue 适配的 EditorState 实现：用 reactive 作为状态后端，
 * 使 core 的状态对 Vue 模板天然响应式。core 本身不感知 Vue —— 它只通过
 * EditorState 抽象接口读写状态，响应式完全由本适配层提供。
 */
export class VueEditorState implements EditorState<EditorCoreState> {
  private readonly state = reactive<EditorCoreState>(createInitialState());

  getState(): EditorCoreState {
    return this.state;
  }

  setState(patch: Partial<EditorCoreState>): void {
    Object.assign(this.state, patch);
  }
}
