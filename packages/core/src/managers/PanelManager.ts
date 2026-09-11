import type { ComponentType, PanelState, SystemComponentProps } from "@screenwright/types";

import type { EditorState } from "../state/EditorState";
import type { ComponentId } from "../types/placement";
import type { EditorCoreState } from "../types/state";
import { uuid } from "../utils/uuid";
import { BaseManager } from "./BaseManager";
import type { ComponentManager } from "./ComponentManager";

export interface PanelManagerOptions {
  editorState: EditorState<EditorCoreState>;
  componentManager: ComponentManager;
}

/**
 * 造一个空面板状态。与 app 侧 createLocalPanelStatus 逐字段一致，是它的框架无关版本。
 *
 * 独立成模块级函数、而不是只做 PanelManager 的方法：它不读也不写编辑器状态，
 * 而 app 侧有一批调用方（.vue、纯工具模块、以及「先把面板造好再插进树」的流程）
 * 此刻根本还拿不到 editor 实例，只有模块级函数它们才引得动。
 *
 * @param stateIndex 已有状态数量，仅用于生成「状态N」这个默认名
 */
export const createPanelState = (stateIndex: number): PanelState => {
  const label = `状态${stateIndex + 1}`;
  return {
    id: uuid(),
    title: label,
    name: label,
    config: [],
    backgroundColor: "rgba(24,27,36,0)",
    showBackgroundImage: false,
    backgroundImage: "",
    showScreenAdaptation: false,
    adaptationNorm: "default",
    adaptationType: 2
  };
};

/**
 * 由源状态派生一个副本状态：沿用样式与适配设置，换新 id 与「-副本」名字。
 *
 * config **由调用方传入**而不是在这里深拷贝——状态内组件的新 id 只能由业务接口分配，
 * core 自己克隆会造出一批服务端不认识的假 id。
 *
 * 与 duplicateState 分开导出，是因为前端的复制流程被一次接口往返劈成了两半：
 * 先要拿到新状态的 id 才能去逐个复制子组件（await），组件复制完了才谈得上落位。
 * 中间隔着 await，core 跨不过去，所以「造副本」和「放进去」必须能分别调用。
 */
export const copyPanelState = (source: PanelState, config: ComponentType[]): PanelState => ({
  ...source,
  id: uuid(),
  name: `${source.name}-副本`,
  config
});

/**
 * 动态面板状态管理（框架无关）。
 *
 * 职责边界与 ComponentManager 的分法是「**状态有哪些** vs **组件在哪**」：
 * - 往某个状态里放组件、把组件挪出状态 —— 那是 ComponentManager.move/upsert，
 *   用 placement.stateId 定位即可，不需要经过本管理器；
 * - panelData 数组本身的增删改序 —— 归本管理器。
 *
 * 与组件 id 相反，**状态 id 由 core 自己生成**：新状态是纯前端产物、全程不经服务端重建，
 * 不存在 id 漂移问题（AddPanelStateCommand 因此是几个面板命令里最简单的一个）。
 *
 * 同样遵守 ComponentManager 那三条约定：就地变更、断言目标状态、不做上下文判断。
 */
export class PanelManager extends BaseManager<EditorCoreState> {
  private readonly componentManager: ComponentManager;

  constructor({ editorState, componentManager }: PanelManagerOptions) {
    super(editorState);
    this.componentManager = componentManager;
  }

  /** 造一个空状态。见模块级的 {@link createPanelState}。 */
  createState(stateIndex: number): PanelState {
    return createPanelState(stateIndex);
  }

  /** 由源状态派生副本状态（不落位）。见模块级的 {@link copyPanelState}。 */
  copyState(source: PanelState, config: ComponentType[]): PanelState {
    return copyPanelState(source, config);
  }

  /** 取面板的状态列表（原数组引用，可就地增删）。面板不存在或没有 panelData 时报错。 */
  getStates(panelId: ComponentId): PanelState[] {
    const panel = this.componentManager.find(panelId);
    if (!panel) {
      throw new Error(`面板 ${panelId} 不在树上`);
    }
    const panelData = (panel as SystemComponentProps).panelData;
    if (!Array.isArray(panelData)) {
      throw new Error(`组件 ${panelId} 不是面板（没有 panelData）`);
    }
    return panelData;
  }

  /** 按 id 取单个状态；不存在返回 null。 */
  findState(panelId: ComponentId, stateId: string): PanelState | null {
    return this.getStates(panelId).find((state) => `${state.id}` === `${stateId}`) ?? null;
  }

  /**
   * 断言该状态存在于面板上。已存在（同 id）则整条替换，不重复插入。
   * @param index 插入位置；省略表示追加到末尾
   */
  addState(panelId: ComponentId, state: PanelState, index?: number): void {
    const states = this.getStates(panelId);
    const existing = states.findIndex((item) => `${item.id}` === `${state.id}`);
    if (existing !== -1) {
      states.splice(existing, 1, state);
      return;
    }
    if (index === undefined || index < 0 || index > states.length) {
      states.push(state);
      return;
    }
    states.splice(index, 0, state);
  }

  /**
   * 断言该状态不在面板上。
   * @returns 被摘下的状态；本来就不存在时返回 null（no-op）
   */
  removeState(panelId: ComponentId, stateId: string): PanelState | null {
    const states = this.getStates(panelId);
    const index = states.findIndex((state) => `${state.id}` === `${stateId}`);
    if (index === -1) {
      return null;
    }
    return states.splice(index, 1)[0] ?? null;
  }

  /** 把状态挪到指定下标。下标越界或状态不存在时报错。 */
  reorderState(panelId: ComponentId, stateId: string, toIndex: number): void {
    const states = this.getStates(panelId);
    const from = states.findIndex((state) => `${state.id}` === `${stateId}`);
    if (from === -1) {
      throw new Error(`面板 ${panelId} 上找不到状态 ${stateId}`);
    }
    if (toIndex < 0 || toIndex >= states.length) {
      throw new Error(`目标下标 ${toIndex} 越界（共 ${states.length} 个状态）`);
    }
    const [state] = states.splice(from, 1);
    states.splice(toIndex, 0, state);
  }

  /** 断言状态名为 name。title 是不变量（建状态时定下就不再改），故只改 name。 */
  renameState(panelId: ComponentId, stateId: string, name: string): void {
    const state = this.findState(panelId, stateId);
    if (!state) {
      throw new Error(`面板 ${panelId} 上找不到状态 ${stateId}`);
    }
    state.name = name;
  }

  /**
   * 复制一个状态并落位：等价于 copyState + addState 的一次性版本，供拿得到完整 config 的
   * 调用方（后端从回执里一次拿全）使用。前端复制流程中间隔着接口往返，走分开的两步。
   *
   * 落位是**追加到末尾**，与前端 onStatusCopy 的既有表现一致——插在源状态之后看着更顺，
   * 但那会让 core 与前端对同一个动作给出两种结果，正是本次抽离要消灭的东西。
   */
  duplicateState(panelId: ComponentId, stateId: string, config: ComponentType[]): PanelState {
    const source = this.findState(panelId, stateId);
    if (!source) {
      throw new Error(`面板 ${panelId} 上找不到状态 ${stateId}`);
    }
    const copy = copyPanelState(source, config);
    this.addState(panelId, copy);
    return copy;
  }
}
