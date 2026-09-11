import type { Action, ComponentType, Event } from "@screenwright/types";
import { ComponentScopeEnum, EventTypeEnum } from "@screenwright/types";

import type { EventCallbackRegistry } from "../events/EventCallbackRegistry";
import {
  type ActionContext,
  type CustomActionHandler,
  getActionContextEnrichers,
  getActionExecutor,
  getCustomAction
} from "../events/eventPorts";
import { planEventActions } from "../selectors/eventPolicy";
import { deepClone } from "../utils/deepClone";
import { extractComponentId } from "../utils/extractComponentId";
import type { ComponentManager } from "./ComponentManager";
import type { DataFilterManager } from "./DataFilterManager";

/**
 * 一次事件里多个动作的执行方式。
 *
 * 前端历史行为是 `actions.map(async …)`——并发发起且**不等待**；core 默认改成逐个 await，
 * 因为 Node 侧要确定性（eval 断言「动作按序发生」）。两种都保留，由调用方按场景选。
 */
export enum ActionExecutionMode {
  /** 逐个 await：前一个动作跑完再跑下一个（默认） */
  SERIAL = "serial",
  /** 并发发起、一起等：动作之间无先后，但整体仍可 await */
  PARALLEL = "parallel"
}

/** 一次事件触发的入参。对应前端 useEventHandling.handleEvents 的参数。 */
export interface DispatchEventsOptions {
  /** 触发组件身上配置的全部事件 */
  events: Event[];
  /** 本次触发的类型（Click / Change / …），只有 trigger 匹配的事件会被执行 */
  triggerType: EventTypeEnum;
  /** 触发时抛出的值：条件求值、动作上下文、回调参数写值都取自它 */
  throwValue: Record<string, any>;
  /** 触发组件 id */
  id?: number | string;
  /** 条件不满足时是否仍执行部分动作（默认 true，即只执行满足条件的） */
  isExecuteOnlyConditionSatisfied?: boolean;
  /** 是否抛出回调参数（默认抛） */
  throwCallback?: boolean;
  /** 一个事件里多个动作怎么执行（默认 SERIAL） */
  actionMode?: ActionExecutionMode;
  /** 换掉默认的回调派发方式（前端用它接自己那套防抖） */
  dispatchCallback?: CallbackDispatcher;
}

/**
 * 自定义「怎么抛回调」。
 *
 * 默认走 dataFilter.dispatchCallback（真执行并收集结果）。前端传的是带防抖的版本——
 * 防抖分支不收集结果，所以那条路返回值可能为空，这是 UI 的取舍，core 不替它决定。
 */
export type CallbackDispatcher = (params: {
  sourceComponent: ComponentType;
  throwValue: Record<string, any>;
}) => void | Promise<Record<string, Record<string, unknown>> | void>;

/** `{ [回调参数名]: { [目标组件id]: 该组件过滤后的数据 } }` */
export type DispatchEventsResult = Record<string, Record<string, unknown>>;

export interface EventDispatcherOptions {
  componentManager: ComponentManager;
  dataFilterManager: DataFilterManager;
  eventCallbacks: EventCallbackRegistry;
}

/**
 * 事件派发：把「触发一次事件」这件事从决策到落地串起来。
 *
 * 求值条件 → 执行动作 → 抛出回调参数 → 消费方重算过滤器，对应前端 useEventHandling.handleEvents。
 * 决策（planEventActions）本来就在 core，这个类接管的是**编排**：谁先谁后、作用域怎么解析、
 * 结果怎么收。
 *
 * 单独成类而不是挂在 ScreenEditor 上，是因为它跨了三个管理器（组件树、过滤器、事件回调注册表），
 * 放在 ScreenEditor 里会让那个装配类同时承担编排职责；这里也便于宿主单独持有、单独测。
 *
 * 唯一碰环境的部分（怎么执行一个动作）走 events/eventPorts 注入，不注入也能跑完整条链路，
 * 只是动作不发生——Node 侧正是这样。编辑态下不派发这类判断由**调用方**在调用前做：
 * core 不需要知道路由或编辑器状态。
 */
export class EventDispatcher {
  private readonly componentManager: ComponentManager;

  private readonly dataFilterManager: DataFilterManager;

  private readonly eventCallbacks: EventCallbackRegistry;

  constructor(options: EventDispatcherOptions) {
    this.componentManager = options.componentManager;
    this.dataFilterManager = options.dataFilterManager;
    this.eventCallbacks = options.eventCallbacks;
  }

  /**
   * 触发一次组件事件。
   *
   * 【与前端的一处行为差异】前端把回调抛出交给 useCallbackArguments.handleCallback，
   * 默认带防抖且**防抖分支不收集结果**；这里一律走 dataFilter.dispatchCallback（真执行并收集），
   * 所以返回值里能拿到每个消费方的过滤输出。防抖是 UI 关注点，要的话由宿主在外层包。
   */
  async dispatch(options: DispatchEventsOptions): Promise<DispatchEventsResult> {
    const {
      events,
      triggerType = EventTypeEnum.Change,
      throwValue,
      id,
      isExecuteOnlyConditionSatisfied = true,
      throwCallback = true,
      actionMode = ActionExecutionMode.SERIAL,
      dispatchCallback = (params) => this.dataFilterManager.dispatchCallback(params)
    } = options;

    if (!throwValue) {
      return {};
    }

    // 决策：纯函数，求值条件并按策略规划每个匹配事件要执行的动作
    const curInfo = Array.isArray(throwValue)
      ? (deepClone(throwValue[0]) as Record<string, any>)
      : (deepClone(throwValue) as Record<string, any>);
    const plannedEvents = planEventActions({ events, triggerType, curInfo, isExecuteOnlyConditionSatisfied });

    const screenWithIframeMap = this.componentManager.getScreenWithIframeComponentMap();
    const sourceComponent = id === undefined ? undefined : screenWithIframeMap.get(`${id}`);

    let callbackResult: DispatchEventsResult = {};
    const tasks: Array<Promise<unknown>> = [];

    for (const { actions, isConditionSatisfied } of plannedEvents) {
      if (actions.length) {
        tasks.push(
          this.executeActions({
            actions: actions as Action[],
            isConditionSatisfied,
            info: throwValue,
            id,
            mode: actionMode
          })
        );
      }
      if (throwCallback && sourceComponent) {
        tasks.push(
          Promise.resolve(dispatchCallback({ sourceComponent, throwValue })).then((res) => {
            if (res) {
              callbackResult = { ...callbackResult, ...res };
            }
          })
        );
      }
    }

    // 注册在 EventCallbackRegistry 上的旁路监听（与动作、回调并行，不影响返回值）
    void this.eventCallbacks.executeCallbacks({ throwValue, id, triggerType });

    await Promise.all(tasks);
    return callbackResult;
  }

  /**
   * 执行一组动作：把 action 原样连同上下文交给宿主注册的处理器。
   *
   * core 只算它算得出的东西——目标组件 id、作用域范围、条件是否满足。
   * 查 DOM、按 customActionType 分流（message / statusAnimation / UE4）都是宿主的事，
   * 那些概念不该出现在 core 里，各自走 registerActionContextEnricher / registerCustomAction。
   *
   * 公开是因为宿主有绕过事件、直接执行一组动作的场景（编码控制把一个外部消息翻成一个动作）。
   */
  async executeActions(params: {
    actions: Action[];
    isConditionSatisfied: boolean;
    info: Record<string, any>;
    id?: number | string;
    mode?: ActionExecutionMode;
  }): Promise<void> {
    const { actions, isConditionSatisfied, info, id, mode = ActionExecutionMode.SERIAL } = params;
    const runners: Array<() => Promise<void>> = [];

    for (const action of actions) {
      const componentIds = ((action.component ?? []) as Array<string | number>).map(extractComponentId);
      // 注册过处理器的自定义动作（message / statusAnimation）不指向具体组件，照样要执行；
      // 其余一律当标准动作——包括带 customActionType 但没人注册的（如 "component"）。
      if (!resolveCustomHandler(action) && (!componentIds.length || !action.action)) {
        continue;
      }

      const scopedComponentMap = this.resolveScopedComponentMap(action.componentScope, id);

      const context: ActionContext = {
        componentIds,
        isConditionSatisfied,
        info,
        sourceComponentId: id === undefined ? undefined : Number(id),
        globalComponentMap: scopedComponentMap,
        updateComponentConfigCallback: (componentConfig: unknown) => {
          const targetData = scopedComponentMap.get(`${componentIds[0]}`);
          if (targetData) {
            Object.assign(targetData, componentConfig as object);
          }
        },
        updateComponentTopLeftCallback: () => {
          const targetData = scopedComponentMap.get(`${componentIds[0]}`);
          if (targetData) {
            targetData.top = 0;
            targetData.left = 0;
          }
        }
      };

      runners.push(() => this.runAction(action, context));
    }

    if (mode === ActionExecutionMode.PARALLEL) {
      await Promise.all(runners.map((run) => run()));
      return;
    }
    for (const run of runners) {
      await run();
    }
  }

  /**
   * 落地单个动作：先让宿主把上下文补全，再按有没有 customActionType 交给对应的处理器。
   *
   * 补充器拿得到 action，要不要补由它自己判断（自定义动作通常不需要 DOM）。
   */
  private async runAction(action: Action, context: ActionContext): Promise<void> {
    const enrichers = getActionContextEnrichers();
    if (enrichers.length) {
      const extras = await Promise.all(enrichers.map((enrich) => enrich(action, context)));
      Object.assign(context, ...extras);
    }

    const customHandler = resolveCustomHandler(action);
    if (customHandler) {
      await customHandler(action, context);
      return;
    }

    await getActionExecutor()(action, context);
  }

  /**
   * 按动作作用域决定「去哪儿找目标组件」。
   *
   * - all（或缺省 / 拿不到触发组件）：全局所有组件（含 iframe 引用屏）
   * - current：触发组件所在作用域——大屏根第一层，或触发组件所在动态面板的那个状态
   */
  private resolveScopedComponentMap(
    componentScope: string | undefined,
    sourceComponentId?: number | string
  ): Map<string, ComponentType> {
    const screenWithIframeMap = this.componentManager.getScreenWithIframeComponentMap();
    if (componentScope !== ComponentScopeEnum.Current || sourceComponentId == null) {
      return screenWithIframeMap;
    }

    const sourceComponent = screenWithIframeMap.get(`${sourceComponentId}`) as
      | (ComponentType & { parentDynamicPanelId?: number[] })
      | undefined;
    const parentPanelIds = sourceComponent?.parentDynamicPanelId ?? [];

    if (!parentPanelIds.length) {
      return this.componentManager.getScreenRootComponentMap();
    }

    // 触发组件在动态面板里：定位它直接所在面板（父链最后一个）的那个具体状态
    const panelId = parentPanelIds[parentPanelIds.length - 1];
    const statusMap = this.componentManager.getPanelChildComponentMapByStatus().get(`${panelId}`);
    if (statusMap) {
      for (const componentMap of statusMap.values()) {
        if (componentMap.has(`${sourceComponentId}`)) {
          return componentMap as Map<string, ComponentType>;
        }
      }
    }

    return screenWithIframeMap;
  }
}

/**
 * 这个动作有没有专门的处理器。
 *
 * 【为什么不是「有 customActionType 就算自定义动作」】标准的组件动作也带
 * `customActionType: "component"`——前端老代码是 `if message / else if statusAnimation / else 标准`，
 * 判据从来是「认不认识这个类型」而不是「有没有这个字段」。注册表天然表达了这件事：
 * 注册过的走注册的，没注册的落回标准执行器。
 */
function resolveCustomHandler(action: Action): CustomActionHandler | undefined {
  return action.customActionType ? getCustomAction(action.customActionType) : undefined;
}
