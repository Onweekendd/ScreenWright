import type { ComponentType } from "@screenwright/types";

import {
  deriveSelectTargetData,
  deriveSelectTargetDataId,
  findTargetById,
  normalizeSelectChart
} from "../selectors/selection";
import type { EditorState } from "../state/EditorState";
import type { EditorCoreState, TargetChart } from "../types/state";
import { BaseManager } from "./BaseManager";
import type { ComponentManager } from "./ComponentManager";

/**
 * 选区管理：负责编辑中的组件列表（componentList）与画布选中目标（targetChart），
 * 以及由此派生的选中组件数据。纯逻辑、框架无关。
 *
 * 选中组件数据依赖 ComponentManager 的组件映射（由 layers 派生），故注入 componentManager。
 * 派生方法为纯计算（现算）；Vue 适配层用 computed 包裹获得缓存与响应式。
 */
export class SelectionManager extends BaseManager<EditorCoreState> {
  constructor(
    editorState: EditorState<EditorCoreState>,
    private readonly componentManager: ComponentManager
  ) {
    super(editorState);
  }

  /** 获取编辑中的组件列表。 */
  getComponentList(): ComponentType[] {
    return this.getState().componentList;
  }

  /** 设置编辑中的组件列表。 */
  setComponentList(componentList: ComponentType[]): void {
    this.setState({ componentList });
  }

  /** 清空编辑中的组件列表。 */
  resetComponentList(): void {
    this.setState({ componentList: [] });
  }

  /** 用组件树（layers）同步编辑中的组件列表（对应原 syncGlobalComponentData）。 */
  syncFromLayers(): void {
    this.setComponentList(this.componentManager.getLayers());
  }

  /** 获取画布选中目标。 */
  getTargetChart(): TargetChart {
    return this.getState().targetChart;
  }

  /**
   * 设置选中目标 select。
   * 注意：只原地修改 targetChart.selectId 这一个字段，不整体替换 targetChart 对象——
   * 否则只依赖 hoverId 的响应式读取点（理论上不该关心 selectId 变化）也会被一并触发重渲染，
   * 拖拽/hover 交叉发生时会导致画布上正在拖拽的元素被拿旧数据重绘，出现抖动/跳回原位。
   */
  setTargetSelectChart(selectId?: string | string[] | number, push = false): void {
    const current = this.getTargetChart();
    const nextSelectId = normalizeSelectChart(current.selectId, selectId, push);
    if (nextSelectId === null) {
      return;
    }
    current.selectId = nextSelectId;
  }

  /** 设置选中目标 hover。同上，只原地改 hoverId，不整体替换 targetChart。 */
  setTargetHoverChart(hoverId?: TargetChart["hoverId"]): void {
    this.getTargetChart().hoverId = hoverId || undefined;
  }

  /** 选中的组件数据（经组件映射查表）。 */
  selectTargetData(): ComponentType[] {
    return deriveSelectTargetData(this.getTargetChart().selectId, this.componentManager.getAllComponentMap());
  }

  /** 选中组件及其子组件的 id 列表。 */
  selectTargetDataId(): string[] {
    return deriveSelectTargetDataId(this.selectTargetData());
  }

  /** 选中元素的初始数据（从 componentList 递归查找）。 */
  selectTargetDataInitial(): (ComponentType | null)[] {
    return this.getTargetChart().selectId.map((v) => this.fetchTargetById(v));
  }

  /**
   * 从 componentList 中按 id 递归查找组件。
   * id 为空时回退到当前选中的第一个。
   */
  fetchTargetById(id: string): ComponentType | null {
    const selectId = this.getTargetChart().selectId;
    const targetId = id || (selectId.length ? selectId[0] : undefined) || undefined;
    if (!targetId) {
      return null;
    }
    return findTargetById(this.getComponentList(), targetId);
  }
}
