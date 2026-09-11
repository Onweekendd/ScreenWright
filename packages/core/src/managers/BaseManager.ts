import type { EditorState } from "../state/EditorState";
import type { EditorCoreState } from "../types/state";

/**
 * 管理器基类。所有 Manager 都通过注入的 EditorState 读写状态，
 * 自身保持纯逻辑、框架无关。
 */
export abstract class BaseManager<S extends object = EditorCoreState> {
  constructor(protected readonly editorState: EditorState<S>) {}

  protected getState(): S {
    return this.editorState.getState();
  }

  protected setState(patch: Partial<S>): void {
    this.editorState.setState(patch);
  }
}
