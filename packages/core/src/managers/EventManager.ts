import { ActionEventRegistry } from "../events/ActionEventRegistry";
import { CallbackArguments } from "../events/CallbackArguments";
import { CallbackEventManager } from "../events/CallbackEventManager";
import { EventCallbackRegistry } from "../events/EventCallbackRegistry";
import { checkCondition, checkConditionSatisfied } from "../selectors/conditionChecking";
import { filterActionsOnConditionNotSatisfied, selectMatchingEvents } from "../selectors/eventPolicy";

/**
 * 事件管理：聚合事件子系统中“框架无关”的部分。
 *
 * 持有共享实例（由编辑器单例持有，从而全应用唯一）：
 *  - callbackEventManager  回调/过滤器事件总线
 *  - callbackArguments     回调参数关系与值（单例）
 *  - eventCallbacks        通用事件回调注册表
 * 并暴露纯策略函数：事件过滤、条件门控、action 分区。
 *
 * 注意：DOM 操作、策略执行（ActionStrategy）、消息收发（TCP/UDP）、路由判断、动画副作用
 * 等仍由 Vue 适配层（useEventHandling 等）负责；本管理器只承载纯逻辑与共享实例。
 */
export class EventManager {
  /** 回调/过滤器事件总线。 */
  readonly callbackEventManager = new CallbackEventManager();

  /** 回调参数关系与反向事件映射（按编辑器一个实例）。 */
  readonly callbackArguments = new CallbackArguments();

  /** 通用事件回调注册表。 */
  readonly eventCallbacks = new EventCallbackRegistry();

  /** 组件 action 方法注册表（物料组件挂载自身方法、事件派发时读取）。 */
  readonly actionEvents = new ActionEventRegistry();

  /** 纯策略：筛选 trigger 匹配的事件。 */
  readonly selectMatchingEvents = selectMatchingEvents;

  /** 纯策略：条件不满足时仍需执行的 action 过滤。 */
  readonly filterActionsOnConditionNotSatisfied = filterActionsOnConditionNotSatisfied;

  /** 纯策略：按 conditionType 检查一组条件是否满足。 */
  readonly checkConditionSatisfied = checkConditionSatisfied;

  /** 纯策略：检查单个条件是否满足。 */
  readonly checkCondition = checkCondition;
}
