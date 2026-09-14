// 中心类
export { ScreenEditor } from "./ScreenEditor";

// 组件抽象基类（框架无关：图表 / 系统面板等组件类的公共基类）
export { AbstractComponent, type ComponentInstanceType, type InstanceToTypeMap } from "./components/AbstractComponent";

// 状态抽象与实现
export type { EditorState } from "./state/EditorState";
export { MemoryEditorState } from "./state/MemoryEditorState";

// 管理器
export { BaseManager } from "./managers/BaseManager";
export { ComponentManager, type ComponentUpdateOptions, type ComponentUpdateResult } from "./managers/ComponentManager";
export {
  DataFilterManager,
  type DataFilterManagerOptions,
  type FilterSaveResult,
  type FilterValidationResult
} from "./managers/DataFilterManager";
export {
  ActionExecutionMode,
  type CallbackDispatcher,
  type DispatchEventsOptions,
  type DispatchEventsResult,
  EventDispatcher,
  type EventDispatcherOptions
} from "./managers/EventDispatcher";
export { EventManager } from "./managers/EventManager";
export { copyPanelState, createPanelState, PanelManager, type PanelManagerOptions } from "./managers/PanelManager";
export { ScreenManager, type ScreenMetaInfo } from "./managers/ScreenManager";
export { SelectionManager } from "./managers/SelectionManager";

// 命令 / 历史（命令模式 + 撤销重做管理器，框架无关）
export { AddComponentCommand } from "./command/AddComponentCommand";
export { AddPanelStateCommand } from "./command/AddPanelStateCommand";
export { BaseCommand, type CommandResult, type ICommand } from "./command/BaseCommand";
export { CommandManager } from "./command/CommandManager";
export { CopyPanelStateCommand, type RecreatedPanelStateCopy } from "./command/CopyPanelStateCommand";
export { DeleteComponentCommand } from "./command/DeleteComponentCommand";
export { DeleteGroupCommand, type RecreatedGroup, type RecreatedGroupComponent } from "./command/DeleteGroupCommand";
export { DeletePanelStateCommand, type RecreatedPanelStateChild } from "./command/DeletePanelStateCommand";
export { RemoveGroupMemberCommand } from "./command/RemoveGroupMemberCommand";
export { ReorderPanelStateCommand } from "./command/ReorderPanelStateCommand";
export { type GroupBuildResult, type GroupDissolveResult, ToggleGroupCommand } from "./command/ToggleGroupCommand";
export { UpdateComponentCommand } from "./command/UpdateComponentCommand";

// 常量
export { largePanel, renderSystemComponentType } from "./constants/panel";

// 事件子系统（纯类）
export { ActionEventRegistry } from "./events/ActionEventRegistry";
export { CallbackArguments } from "./events/CallbackArguments";
export { callbackEventKey } from "./events/callbackEventKeys";
export {
  type AddCallbackFieldHandler,
  CallbackEventManager,
  type CallbackFieldTriggerHandler,
  type FilterTriggerHandler,
  type RemoveCallbackFieldHandler
} from "./events/CallbackEventManager";
export {
  type EventCallbackFunction,
  type EventCallbackParams,
  EventCallbackRegistry
} from "./events/EventCallbackRegistry";
export {
  type ActionContext,
  type ActionContextEnricher,
  type ActionExecutor,
  type CustomActionHandler,
  getActionContextEnrichers,
  getActionExecutor,
  getCustomAction,
  registerActionContextEnricher,
  registerCustomAction,
  registeredCustomActions,
  resetEventPorts,
  setActionExecutor
} from "./events/eventPorts";

// 选择器（组件树纯函数）
export {
  childLists,
  collectSubtree,
  collectSubtreeIds,
  type ComponentEntry,
  detach,
  findEntry
} from "./selectors/componentContainers";
export {
  buildComponentMap,
  type ComponentMap,
  findTargetDynamicPanel,
  type FlatComponentMap,
  transformGroupData
} from "./selectors/componentTree";
export { assignComponentAttrs, calculateGroupDimensions, getMaxIndex } from "./selectors/geometry";

// 选择器（条件检查 / 事件策略）
export {
  checkCodeCondition,
  checkCondition,
  checkConditionSatisfied,
  checkFieldCondition
} from "./selectors/conditionChecking";
export {
  filterActionsOnConditionNotSatisfied,
  planEventActions,
  type PlannedEventActions,
  selectMatchingEvents
} from "./selectors/eventPolicy";

// 选择器（选区模型纯函数）
export {
  deriveSelectTargetData,
  deriveSelectTargetDataId,
  findTargetById,
  normalizeSelectChart
} from "./selectors/selection";

// 工具（事件相关）
export { deepClone } from "./utils/deepClone";
export { extractComponentId } from "./utils/extractComponentId";
export { mapValueWithDataRemark } from "./utils/mapValueWithDataRemark";
export { mergeComponentUpdate, replaceComponentSnapshot } from "./utils/mergeComponentUpdate";

// 数据过滤器引擎（纯 CoR 责任链 + 编译缓存 + 执行器 + 基类）
export { BaseFilter } from "./filter/BaseFilter";
export { BaseHandler } from "./filter/BaseHandler";
export { type CallbackArgsSource, getRuntimeCallbackArgs, setCallbackArgsSource } from "./filter/CallbackArgsSource";
export { ChainCollector, ChainExecutionMode, type Handler } from "./filter/ChainCollector";
export { ChainExecutor } from "./filter/ChainExecutor";
export { CompiledFunctionCache, getCompiledFunctionCache } from "./filter/CompiledFunctionCache";
export { type FilterExecutionProps, FilterExecutor } from "./filter/FilterExecutor";
export { FilterChainBuilder, type FilterResult, SingleFilterHandler } from "./filter/FilterHandler";
export {
  type FilterResultSink,
  getFilterResultSink,
  MemoryFilterResultSink,
  setFilterResultSink
} from "./filter/FilterResultSink";
export { FilterRunner, registeredFilterStrategies, registerFilterStrategy } from "./filter/FilterRunner";
export { StaticDataFilter } from "./filter/StaticDataFilter";
export type { ResultCollectItem } from "./filter/types";

// 状态类型与工厂
export {
  createDefaultDetail,
  createDefaultNavInfo,
  createInitialState,
  defaultNavInfo
} from "./state/createInitialState";
export type { ComponentId, ComponentPlacement } from "./types/placement";
export type { EditorCoreState, NavInfo, TargetChart } from "./types/state";

// 工具
export { parseIfNeeded } from "./utils/parseIfNeeded";
export { parseUrl } from "./utils/parseUrl";
export { setPx } from "./utils/setPx";
export { sleep } from "./utils/sleep";
export { getAlign, getPartialGradientCSS, lineargradientHandle } from "./utils/style";
export { uuid } from "./utils/uuid";
