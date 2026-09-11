/**
 * 事件执行的宿主注入点（框架无关）。
 *
 * core 负责决策与编排——planEventActions 求值条件、规划动作，EventDispatcher 解析作用域、
 * 抛出回调、驱动过滤器重算。真正碰环境的三件事走注册表交出去：
 *
 *   1. 标准动作怎么执行      → {@link setActionExecutor}（按 action.action 分发到宿主策略表）
 *   2. 自定义动作怎么执行     → {@link registerCustomAction}（message / statusAnimation / UE4…）
 *   3. 上下文还缺什么         → {@link registerActionContextEnricher}（DOM 元素、事件表、动画触发器…）
 *
 * 三者都是模块级注册表——宿主启动时注册一次，此后每个 EventDispatcher 共享，
 * 与 registerFilterStrategy / setFilterResultSink 同一套路。
 *
 * 全都未注册时是 no-op：**不注册也能跑完整条编排**，只是动作不发生、上下文只有 core 算得出的那部分。
 * Node 侧正是这样——eval 注入一个只记录不执行的执行器，就能断言「动作被触发了、目标组件对、条件判断对」。
 */
import type { Action, ComponentType } from "@screenwright/types";

/**
 * 执行一个动作时 core 能提供的全部上下文。
 *
 * 这里只有 core 算得出的东西。宿主要的 DOM 元素、事件表、动画触发器等，
 * 由 {@link registerActionContextEnricher} 补进来——core 不认识那些字段，
 * 补完原样透传给执行器，宿主在自己那侧断言类型。
 */
export interface ActionContext {
  /** 动作的目标组件 id（已从 `$component` 形态解析成纯 id） */
  componentIds: number[];
  /** 该动作所属事件的条件是否满足 */
  isConditionSatisfied: boolean;
  /** 触发事件时抛出的值 */
  info: Record<string, any>;
  /** 触发组件 id */
  sourceComponentId?: number;
  /** 按 componentScope 解析出的目标组件查找范围（all / 触发组件所在作用域） */
  globalComponentMap: Map<string, ComponentType>;
  /** 就地更新首个目标组件的配置 */
  updateComponentConfigCallback: (componentConfig: unknown) => void;
  /** 就地把首个目标组件的左上角归零 */
  updateComponentTopLeftCallback: () => void;
}

/** 执行一个标准动作（`action.action` 有值的那些）。 */
export type ActionExecutor = (action: Action, context: ActionContext) => void | Promise<void>;

/** 执行一个自定义动作。按 `customActionType` 注册，core 不认识具体类型。 */
export type CustomActionHandler = (action: Action, context: ActionContext) => void | Promise<void>;

/**
 * 补充上下文：返回的字段会并进 ActionContext 交给执行器。
 *
 * 查 DOM 就是典型用途——「元素」这个概念不该出现在 core 里，但宿主的动作策略需要它。
 * 可注册多个，按注册顺序并发求值后依次合并（后注册的覆盖同名字段）。
 */
export type ActionContextEnricher = (
  action: Action,
  context: ActionContext
) => Record<string, unknown> | Promise<Record<string, unknown>>;

const noop: ActionExecutor = () => undefined;
let executor: ActionExecutor = noop;

const customActions = new Map<string, CustomActionHandler>();
const enrichers: ActionContextEnricher[] = [];

/** 注入标准动作执行器（宿主启动时调用一次）。 */
export function setActionExecutor(impl: ActionExecutor): void {
  executor = impl;
}

export function getActionExecutor(): ActionExecutor {
  return executor;
}

/** 注册一类自定义动作的处理器。同名后注册的覆盖先注册的。 */
export function registerCustomAction(customActionType: string, handler: CustomActionHandler): void {
  customActions.set(customActionType, handler);
}

/** 取某类自定义动作的处理器；没注册返回 undefined —— 该动作不发生，不报错。 */
export function getCustomAction(customActionType: string): CustomActionHandler | undefined {
  return customActions.get(customActionType);
}

/** 当前已注册的自定义动作类型（调试 / 断言用）。 */
export function registeredCustomActions(): string[] {
  return [...customActions.keys()];
}

/** 注册一个上下文补充器。 */
export function registerActionContextEnricher(enricher: ActionContextEnricher): void {
  enrichers.push(enricher);
}

/** 取全部上下文补充器（EventDispatcher 内部用）。 */
export function getActionContextEnrichers(): readonly ActionContextEnricher[] {
  return enrichers;
}

/** 清空全部注册：恢复成「什么都没注入」（测试 / 切换宿主时用）。 */
export function resetEventPorts(): void {
  executor = noop;
  customActions.clear();
  enrichers.length = 0;
}
