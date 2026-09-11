import type { EditorCoreState } from "../types/state";
import { createInitialState } from "./createInitialState";
import type { EditorState } from "./EditorState";

/**
 * 纯内存实现的 EditorState（零框架依赖）。
 *
 * 用途：
 * 1. 单元测试 / headless 场景下直接驱动 core，无需任何 UI 框架；
 * 2. 作为"core 确实不依赖任何框架"的可执行证明。
 */
export class MemoryEditorState<S extends object = EditorCoreState> implements EditorState<S> {
  private state: S;

  constructor(initialState?: S) {
    this.state = initialState ?? (createInitialState() as unknown as S);
  }

  getState(): S {
    return this.state;
  }

  setState(patch: Partial<S>): void {
    this.state = Object.assign({}, this.state, patch);
  }
}
