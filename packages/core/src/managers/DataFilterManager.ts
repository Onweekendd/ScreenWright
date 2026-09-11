import type { ChildComponent, ComponentType, Filter } from "@screenwright/types";
import { FolderEnum, PanelEnum } from "@screenwright/types";

import type { CallbackArguments } from "../events/CallbackArguments";
import { callbackEventKey } from "../events/callbackEventKeys";
import type {
  AddCallbackFieldHandler,
  CallbackEventManager,
  FilterTriggerHandler,
  RemoveCallbackFieldHandler
} from "../events/CallbackEventManager";
import { getCompiledFunctionCache } from "../filter/CompiledFunctionCache";
import { getFilterResultSink } from "../filter/FilterResultSink";
import { FilterRunner } from "../filter/FilterRunner";
import type { EditorState } from "../state/EditorState";
import type { EditorCoreState } from "../types/state";
import { BaseManager } from "./BaseManager";
import type { ComponentManager } from "./ComponentManager";

export type FilterValidationResult =
  | { success: true }
  | { success: false; error: "duplicate_name" | "empty_name" | "filter_not_found" | "not_modified" };

export interface FilterSaveResult {
  /** 已写进全局状态的那一份过滤器 */
  filter: Filter;
  /** 这次同步过绑定关系的组件；调用方按各自方式落盘（前端保存图层、后端整屏回写） */
  boundComponents: Array<ComponentType | ChildComponent>;
}

/**
 * 一个组件已注册的过滤器监听句柄。
 *
 * `calculate` 同时注册在「回调字段触发」和「过滤器直接触发」两处，注销时必须用同一引用；
 * `fields` 记的是实际注册过的回调字段——运行中可能被 add/remove 事件改动，不能回头去读
 * component.listenArgs 重新推导。
 */
interface RegisteredFilterListener {
  component: ComponentType | ChildComponent;
  calculate: FilterTriggerHandler;
  onAdd: AddCallbackFieldHandler;
  onRemove: RemoveCallbackFieldHandler;
  fields: string[];
}

export interface DataFilterManagerOptions {
  editorState: EditorState<EditorCoreState>;
  callbackArguments: CallbackArguments;
  callbackEventManager: CallbackEventManager;
  componentManager: ComponentManager;
}

/**
 * 数据过滤器管理器（框架无关）。
 *
 * 负责：全局过滤器 CRUD、组件-过滤器绑定（listenArgs）、回调关系管理、
 * 组件生命周期联动（删除/粘贴）、change detection（未保存标记）、事件触发。
 *
 * 不负责：API 持久化、Vue 响应式派生（currentFilter 等）、
 * UI 状态（newDataFilter / debounce）——这些留在 app 适配层。
 */
export class DataFilterManager extends BaseManager<EditorCoreState> {
  /** 初始化时的过滤器深拷贝，用于检测是否有未保存的改动。 */
  private cloneDataFilter: Record<string, Filter> = {};
  private readonly callbackArguments: CallbackArguments;
  private readonly callbackEventManager: CallbackEventManager;
  private readonly componentManager: ComponentManager;
  private readonly compiledFunctionCache = getCompiledFunctionCache();
  /** 过滤器运行器；无状态，整个 manager 共用一个即可。 */
  private readonly filterRunner = new FilterRunner();
  /**
   * 组件 id → 已注册的监听句柄。
   *
   * 必须记账：注销监听要拿**同一个函数引用**才摘得掉，而 core 里没有组件生命周期
   * 可以像前端那样把闭包挂在 setup 作用域上。
   */
  private readonly filterListeners = new Map<string, RegisteredFilterListener>();

  constructor({ editorState, callbackArguments, callbackEventManager, componentManager }: DataFilterManagerOptions) {
    super(editorState);
    this.callbackArguments = callbackArguments;
    this.callbackEventManager = callbackEventManager;
    this.componentManager = componentManager;
  }

  // ─── State ────────────────────────────────────────────────────────────────

  getDataFilter(): Record<string, Filter> {
    return this.getState().navInfo.dataFilterArr;
  }

  setDataFilter(filters: Record<string, Filter>): void {
    const navInfo = this.getState().navInfo;
    navInfo.dataFilterArr = filters;
    this.setState({ navInfo });
  }

  // ─── Initialization ───────────────────────────────────────────────────────

  /** 大屏加载完成后调用，为后续"未保存"检测建立基准快照。 */
  cloneDataFilterOnInit(): void {
    this.cloneDataFilter = JSON.parse(JSON.stringify(this.getDataFilter()));
  }

  /** 返回初始快照（供 UI 层读取，如"还原到上次保存"）。 */
  getCloneDataFilter(): Record<string, Filter> {
    return this.cloneDataFilter;
  }

  /** 重置内部快照（卸载大屏时调用）。 */
  reset(): void {
    this.cloneDataFilter = {};
  }

  // ─── Validation ───────────────────────────────────────────────────────────

  validateFilterName(filter: Filter, savedFilters: Filter[]): FilterValidationResult {
    if (!filter) {
      return { success: false, error: "filter_not_found" };
    }
    if (!filter.notSaved && !filter.id) {
      return { success: false, error: "not_modified" };
    }
    if (filter.notSaved && savedFilters.some((v) => v.name === filter.name)) {
      return { success: false, error: "duplicate_name" };
    }
    if (!filter.name || filter.name.length === 0) {
      return { success: false, error: "empty_name" };
    }
    return { success: true };
  }

  // ─── Filter CRUD ──────────────────────────────────────────────────────────

  /**
   * 将过滤器写入全局状态（标记为已保存、更新编译缓存）。
   * 调用方在此之后再发起 API 持久化。
   */
  applyFilterSave(filter: Filter): Filter {
    const dataFilter = this.getDataFilter();
    filter.notSaved = false;
    if ("id" in filter) {
      delete filter.id;
    }
    dataFilter[filter.name] = { ...filter };
    this.compiledFunctionCache.updateFilter(filter);
    return filter;
  }

  /**
   * 保存过滤器，并把绑定关系同步到它绑的每个组件上（纯内存、就地变更）。
   *
   * 这是「保存一个过滤器」的完整内存语义，前端与后端跑的是这同一份：
   * 前端保存弹窗、后端 agent 编辑 dataFilterArr/*.json 都走它，各自只补自己的副作用
   * （前端 saveLayersByType + emitFilterTrigger + API 持久化，后端整屏回写）。
   *
   * `originalName` 与 `filter.name` 不同即为**改名**：先按 {@link deleteFilter} 把旧名摘干净
   * （解绑各组件的 listenArgs、清掉回调关系、删掉旧 key），再按新名存。少这一步的话，
   * 组件上会留下一条指向已不存在过滤器的 listenArgs，回调关系图里也还登记着旧名。
   *
   * @param filter 要保存的过滤器；会被就地改（notSaved 置 false、id 摘掉），调用方若还要复用请自行拷贝
   * @param originalName 编辑前的名字；不传或与 filter.name 相同即为普通保存
   * @returns 存进去的那一份，以及这次同步过绑定关系的组件（调用方按各自方式落盘）
   */
  async saveFilterWithBindings(filter: Filter, originalName?: string): Promise<FilterSaveResult> {
    if (originalName !== undefined && originalName !== filter.name) {
      await this.deleteFilter(originalName);
    }

    const saved = this.applyFilterSave(filter);
    const allComponentMap = this.componentManager.getAllComponentMap();
    const boundComponents: Array<ComponentType | ChildComponent> = [];

    for (const binding of saved.bindComponent) {
      const component = allComponentMap.get(`${binding.id}`);
      if (!component) {
        continue;
      }
      // 先挂一条空回调的 listenArgs，再由 processCallbackRelations 按过滤器的 callBack 增量对齐
      if (!component.listenArgs.some((item) => item.filterName === saved.name)) {
        this.addListenArgs({ ...saved, callBack: [] }, component);
      }
      this.processCallbackRelations(saved.name, component);
      // 消费侧总开关。false 时 BaseFilter.run 不跑过滤、CallbackArguments 不登记消费方，
      // 整条链路**静默跳过**——不报错，图表就是空着。而"把过滤器绑到这个组件上"本身就是
      // "我要它生效"，绑完停在 false 是差最后一脚，实测 agent 每次都得读回组件文件才发现。
      // 前端路径上这是 no-op：dataFilterDrawer 的选过滤器入口本身就 v-if 在 openFilter 上，
      // 人走到绑定这一步时它早已是 true；真正受益的是 agent 直接调工具、绕过 UI 的那条路。
      component.openFilter = true;
      boundComponents.push(component);
    }

    return { filter: saved, boundComponents };
  }

  /**
   * 从全局状态删除过滤器，同时解绑所有关联组件并清理回调关系。
   * 调用方在此之后再发起 API 持久化。
   */
  async deleteFilter(filterName: string): Promise<{ success: boolean; error?: string }> {
    const dataFilter = this.getDataFilter();
    const targetFilter = dataFilter[filterName];
    if (!targetFilter) {
      return { success: false, error: `过滤器 "${filterName}" 不存在` };
    }

    const allComponentMap = this.componentManager.getAllComponentMap();
    for (const { id } of targetFilter.bindComponent) {
      const component = allComponentMap.get(`${id}`);
      if (!component) {
        continue;
      }
      const listenArg = component.listenArgs.find((v) => v.filterName === filterName);
      if (listenArg) {
        this.removeCallbackRelations(filterName, listenArg.callbackFields, component);
      }
      // 原地删除，避免在响应式数组上 .filter() 产生 reactive 代理元素污染结构化克隆
      const idx = component.listenArgs.findIndex((v) => v.filterName === filterName);
      if (idx !== -1) {
        component.listenArgs.splice(idx, 1);
      }
    }

    delete dataFilter[filterName];
    return { success: true };
  }

  /**
   * 从指定组件上移除过滤器绑定（仅内存侧状态变更）。
   * 调用方在此之后再发起 API 持久化 + 图层保存 + emitFilterTrigger。
   */
  async deleteFilterFromComponent(
    filter: Filter,
    component: ComponentType | ChildComponent
  ): Promise<{ success: boolean; error?: string }> {
    const dataFilter = this.getDataFilter();

    // 原地删除，避免在响应式数组上 .filter() 产生 reactive 代理元素污染结构化克隆
    const listenArgIdx = component.listenArgs.findIndex((v) => v.filterName === filter.name);
    if (listenArgIdx !== -1) {
      component.listenArgs.splice(listenArgIdx, 1);
    }

    dataFilter[filter.name].bindComponent = dataFilter[filter.name].bindComponent.filter((v) => v.id !== component.id);

    this.removeCallbackRelations(filter.name, filter.callBack, component);

    return { success: true };
  }

  // ─── Component binding ────────────────────────────────────────────────────

  /** 把过滤器添加到组件的 listenArgs（幂等，重复调用无副作用）。 */
  addListenArgs(filter: Filter, component: ComponentType | ChildComponent): void {
    const alreadyBound = component.listenArgs.some((v) => v.filterName === filter.name);
    if (alreadyBound) {
      return;
    }
    component.listenArgs.push({
      filterName: filter.name,
      usageStatus: true,
      callbackFields: [...filter.callBack]
    });
  }

  // ─── Callback management ──────────────────────────────────────────────────

  addCallbackRelations(filterName: string, callbacksToAdd: string[], component: ComponentType | ChildComponent): void {
    const manager = this.callbackArguments.getCallbackArgumentsManager();
    callbacksToAdd.forEach((callbackValue) => {
      const relation = manager[callbackValue];
      if (!relation) {
        this.callbackArguments.initCallbackRelation(callbackValue);
        const newRelation = manager[callbackValue];
        if (newRelation) {
          newRelation.target.push({ id: component.id, name: component.name, filterName });
        }
      } else {
        const hasRelation = relation.target.some((t) => t.id === component.id && t.filterName === filterName);
        if (!hasRelation) {
          relation.target.push({ id: component.id, name: component.name, filterName });
        }
      }
      void this.emitAddCallbackField(`${component.id}`, callbackValue);
    });
  }

  removeCallbackRelations(
    filterName: string,
    callbacksToRemove: string[],
    component: ComponentType | ChildComponent
  ): void {
    const manager = this.callbackArguments.getCallbackArgumentsManager();
    callbacksToRemove.forEach((callbackValue) => {
      const relation = manager[callbackValue];
      if (!relation) {
        return;
      }

      relation.target = (relation.target ?? []).filter((t) => !(t.id === component.id && t.filterName === filterName));

      if (relation.target.length === 0 && relation.source.length === 0) {
        delete manager[callbackValue];
      }

      void this.emitRemoveCallbackField(`${component.id}`, callbackValue);
    });
  }

  updateComponentCallbacks(
    filterName: string,
    callbackFields: string[],
    component: ComponentType | ChildComponent
  ): void {
    const idx = component.listenArgs.findIndex((v) => v.filterName === filterName);
    if (idx !== -1) {
      component.listenArgs[idx].callbackFields = [...callbackFields];
    }
  }

  /** 对比过滤器的回调参数与组件绑定的回调字段，增量同步。 */
  processCallbackRelations(filterName: string, component: ComponentType | ChildComponent): void {
    const dataFilter = this.getDataFilter();
    const componentBindFilter = component.listenArgs.find((v) => v.filterName === filterName);
    if (!componentBindFilter) {
      return;
    }

    const componentCallbacks = componentBindFilter.callbackFields;
    const filterCallbacks = dataFilter[filterName]?.callBack ?? [];

    const toAdd = filterCallbacks.filter((cb) => !componentCallbacks.includes(cb));
    const toRemove = componentCallbacks.filter((cb) => !filterCallbacks.includes(cb));

    this.removeCallbackRelations(filterName, toRemove, component);
    this.addCallbackRelations(filterName, toAdd, component);
    this.updateComponentCallbacks(filterName, filterCallbacks, component);
  }

  updateCallbackArgumentToFilter(filter: Filter, callbackArgument: string[]): void {
    filter.callBack = [...callbackArgument];
    this.checkFilterNotSaved(filter);
  }

  // ─── Component lifecycle ──────────────────────────────────────────────────

  /** 组件删除时，清理该组件在全局过滤器中的所有绑定与回调关系。 */
  async updateFilterOnComponentDeleted(component: ComponentType | ChildComponent): Promise<void> {
    if (component.component.prop === FolderEnum.group) {
      return this.deleteFilterFromGroupComponent(component);
    }
    if (component.component.prop === PanelEnum.encodePanel || component.component.prop === PanelEnum.dynamicPanel) {
      return this.deleteFilterFromPanelComponent(component as ComponentType);
    }
    this.deleteFilterFromCommonComponent(component);
  }

  private async deleteFilterFromGroupComponent(component: ComponentType | ChildComponent): Promise<void> {
    if (component.children?.length) {
      await Promise.all(component.children.map((child: any) => this.deleteFilterFromCommonComponent(child)));
    }
  }

  private async deleteFilterFromPanelComponent(component: ComponentType): Promise<void> {
    const panelChildMap = this.componentManager.getPanelChildComponentMap();
    const childMap = panelChildMap.get(`${component.id}`);
    if (!childMap) {
      return;
    }
    await Promise.all([...childMap.values()].map((child) => this.deleteFilterFromCommonComponent(child)));
  }

  private deleteFilterFromCommonComponent(component: ComponentType | ChildComponent): void {
    const dataFilter = this.getDataFilter();
    component.listenArgs?.forEach((listenArg) => {
      const targetFilter = dataFilter[listenArg.filterName];
      if (!targetFilter) {
        return;
      }
      this.removeCallbackRelations(listenArg.filterName, listenArg.callbackFields, component);
      targetFilter.bindComponent = targetFilter.bindComponent.filter((v) => v.id !== component.id);
    });
  }

  /** 组件粘贴时，将新组件补充进相关过滤器的 bindComponent 列表。 */
  updateFilterOnComponentPasted(component: ComponentType | ChildComponent): void {
    if (component.component.prop === FolderEnum.group) {
      this.pasteFilterForGroupComponent(component);
    } else {
      this.pasteFilterForCommonComponent(component);
    }
  }

  private pasteFilterForGroupComponent(component: ComponentType | ChildComponent): void {
    this.pasteFilterForCommonComponent(component);
    if (component.children?.length) {
      component.children.forEach((child: any) => this.pasteFilterForCommonComponent(child));
    }
  }

  private pasteFilterForCommonComponent(component: ComponentType | ChildComponent): void {
    const dataFilter = this.getDataFilter();
    component.listenArgs?.forEach((listenArg) => {
      const targetFilter = dataFilter[listenArg.filterName];
      if (!targetFilter) {
        return;
      }
      targetFilter.bindComponent.push({ label: component.name, id: component.id });
    });
  }

  // ─── Change detection ─────────────────────────────────────────────────────

  /** 比较 filter 与初始快照，更新 notSaved 标记。 */
  checkFilterNotSaved(filter: Filter): void {
    if (!this.cloneDataFilter[filter.name] || filter.id) {
      return;
    }
    const clone = this.cloneDataFilter[filter.name];
    const { notSaved: _a, ...a } = filter;
    const { notSaved: _b, ...b } = clone;
    filter.notSaved = !deepEqual(
      { ...a, dataFormatter: normalizeWhitespace(filter.dataFormatter) },
      { ...b, dataFormatter: normalizeWhitespace(clone.dataFormatter) }
    );
  }

  // ─── Query ────────────────────────────────────────────────────────────────

  getFilterResultsByComponentId(id: string | number) {
    const component = this.componentManager.getAllComponentMap().get(`${id}`);
    if (!component) {
      return { success: false as const, error: `组件 ${id} 不存在`, results: [] };
    }
    const sink = getFilterResultSink() as any;
    const results: any[] = sink.getResults?.(component) ?? [];
    return {
      success: true as const,
      results: results.map(({ filterName, inputData, outputData, success, error }: any) => ({
        filterName,
        inputData,
        outputData,
        success,
        error: error?.message
      }))
    };
  }

  // ─── Event triggering ─────────────────────────────────────────────────────

  async emitFilterTrigger(componentId: string): Promise<any> {
    return this.callbackEventManager.emitFilterTrigger(callbackEventKey.filterTrigger(componentId));
  }

  async emitAddCallbackField(componentId: string, callbackField: string): Promise<any> {
    return this.callbackEventManager.emitAddCallbackField(callbackEventKey.addField(componentId), { callbackField });
  }

  async emitRemoveCallbackField(componentId: string, callbackField: string): Promise<any> {
    return this.callbackEventManager.emitRemoveCallbackField(callbackEventKey.removeField(componentId), {
      callbackField
    });
  }

  // ─── Runtime: 过滤器执行与监听注册 ─────────────────────────────────────────

  /**
   * 跑一个组件的过滤器链，返回过滤后的数据（对应前端 useRegisterFilter.calculateComponentData）。
   *
   * WebSocket 收到新数据时重算的递归也在这里（onDataReceived），与前端行为一致；
   * Node 侧没有 ws 策略，自然不会触发。
   */
  async calculateComponentData(
    component: ComponentType | ChildComponent,
    onFilterDataChange?: (data: unknown) => void
  ): Promise<unknown> {
    const result = await this.filterRunner.run({
      filterConfig: this.getDataFilter(),
      target: component,
      onDataReceived: () => void this.calculateComponentData(component, onFilterDataChange)
    });
    onFilterDataChange?.(result);
    return result;
  }

  /**
   * 为一个组件注册过滤器相关的全部监听（对应前端 registerFilter）。
   *
   * 重复注册同一组件是 no-op：前端按组件挂载逐个注册、后端一次性全注册，两边都可能重入，
   * 而重复监听会让同一次触发把过滤器跑好几遍。
   */
  registerFilterListeners(
    component: ComponentType | ChildComponent,
    onFilterDataChange?: (data: unknown) => void
  ): void {
    const key = String(component.id);
    if (this.filterListeners.has(key)) {
      return;
    }

    const calculate: FilterTriggerHandler = async (customComponent) =>
      await this.calculateComponentData(customComponent ?? component, onFilterDataChange);

    const fields: string[] = [];
    const listenField = (field: string) => {
      this.callbackEventManager.onCallbackFieldTrigger(callbackEventKey.fieldTrigger(field, component.id), calculate);
      fields.push(field);
    };

    component.listenArgs?.forEach((listenArg) => {
      listenArg.callbackFields?.forEach(listenField);
    });

    const onAdd: AddCallbackFieldHandler = async ({ callbackField }) => {
      listenField(callbackField);
    };
    const onRemove: RemoveCallbackFieldHandler = async ({ callbackField }) => {
      await this.callbackEventManager.offCallbackFieldTrigger(
        callbackEventKey.fieldTrigger(callbackField, component.id),
        calculate
      );
    };

    this.callbackEventManager.onAddCallbackField(callbackEventKey.addField(component.id), onAdd);
    this.callbackEventManager.onRemoveCallbackField(callbackEventKey.removeField(component.id), onRemove);
    this.callbackEventManager.onFilterTrigger(callbackEventKey.filterTrigger(component.id), calculate);

    this.filterListeners.set(key, { component, calculate, onAdd, onRemove, fields });
  }

  /** 注销一个组件的全部监听（对应前端 unRegisterFilter）。 */
  async unregisterFilterListeners(component: ComponentType | ChildComponent): Promise<void> {
    const key = String(component.id);
    const handle = this.filterListeners.get(key);
    if (!handle) {
      return;
    }

    for (const field of handle.fields) {
      await this.callbackEventManager.offCallbackFieldTrigger(
        callbackEventKey.fieldTrigger(field, component.id),
        handle.calculate
      );
    }
    this.callbackEventManager.offAddCallbackField(callbackEventKey.addField(component.id), handle.onAdd);
    this.callbackEventManager.offRemoveCallbackField(callbackEventKey.removeField(component.id), handle.onRemove);
    this.callbackEventManager.offFilterTrigger(callbackEventKey.filterTrigger(component.id), handle.calculate);

    this.filterListeners.delete(key);
  }

  /**
   * 把当前大屏上所有组件的过滤器监听一次注册完。
   *
   * 后端专用：Node 侧没有「组件挂载」这个时机，前端则是靠 useBaseFilter 在 onMounted 里
   * 逐个注册的。注册逻辑两边共用同一份，差别只在时机。
   *
   * 与 ScreenEditor.init 是配套的一对：init 建回调参数关系图，这里建监听，少一个数据流都不通。
   */
  registerAllFilters(onFilterDataChange?: (component: ComponentType, data: unknown) => void): void {
    for (const component of this.componentManager.getAllComponentMap().values()) {
      this.registerFilterListeners(component, onFilterDataChange && ((data) => onFilterDataChange(component, data)));
    }
  }

  /** 清空本 manager 注册过的全部监听（换大屏 / 换 eval case 前调）。 */
  async unregisterAllFilters(): Promise<void> {
    for (const handle of [...this.filterListeners.values()]) {
      await this.unregisterFilterListeners(handle.component);
    }
  }

  /**
   * 源组件抛出回调参数，驱动所有消费它的组件重算过滤器，并把各自的输出收集回来。
   *
   * 完整链路：A 点击抛值 → 按 A 的 cbArgs 映射写进 callbackArgs → 查关系图找到消费该参数的
   * 组件 → 逐个触发重算 → 过滤器执行时经 getRuntimeCallbackArgs 读到刚写的值。
   *
   * 【与 CallbackArguments.handleCallback 的分工】那个**只写值、不触发**，是本方法的第一步。
   * 两者同名过、职责不同，别合并。
   *
   * 【为什么不带 debounce】前端 useCallbackArguments.handleCallback 的防抖分支
   * `await debouncedTrigger(...)` **不把结果收进返回值**，只有非防抖分支才收。core 里一律走
   * 真执行并收集——防抖是 UI 关注点（避免高频重绘），要的话由宿主在外层包。
   *
   * 【关系图必须先建好】依赖 ScreenEditor.init 里的 initCallbackArguments。没建的话
   * relation 恒为 undefined、循环直接 continue，表现为「什么都没发生」且不报错。
   *
   * @returns `{ [回调参数名]: { [目标组件id]: 该组件过滤后的数据 } }`
   */
  async dispatchCallback(options: {
    sourceComponent: ComponentType | ChildComponent;
    throwValue: Record<string, any>;
  }): Promise<Record<string, Record<string, unknown>>> {
    const { sourceComponent, throwValue } = options;
    const result: Record<string, Record<string, unknown>> = {};
    if (!sourceComponent.cbArgs?.length) {
      return result;
    }

    // ① 写值：按 cbArgs 的 origin→target 映射，把抛出值落进 callbackArgs
    this.callbackArguments.handleCallback({ sourceComponent, throwValue });

    // ② 触发：查关系图找到消费方，逐个 emit
    const manager = this.callbackArguments.getCallbackArgumentsManager();
    const componentMap = this.componentManager.getAllComponentMap();

    for (const arg of sourceComponent.cbArgs) {
      const targetKey = arg.value.target.value;
      const relation = manager[targetKey];
      if (!relation) {
        continue;
      }

      for (const { id } of relation.target) {
        // 关系图可能残留已删除的组件；不在树上的直接跳过，与前端取 componentMap 落空时一致
        if (!componentMap.has(`${id}`)) {
          continue;
        }
        const res = await this.callbackEventManager.emitCallbackFieldTrigger(
          callbackEventKey.fieldTrigger(targetKey, id)
        );
        result[targetKey] = { ...result[targetKey], [id]: res };
      }
    }

    return result;
  }
}

function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, "");
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
