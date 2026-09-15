import type { Action, ActionTypeEnum, ComponentType, TotalPanelEventMap, Ue4Config } from "@screenwright/types";
import type { Router } from "vue-router";

import type { AnimationTrigger } from "../useGlobalAnimation";

/**
 * useEvent/useEventHandling/useEncodeEvent/useEncodeCommunication 已下沉到 @screenwright/composables，
 * 唯一留在 app 的是具体的 ~50 个动作策略实现(actionStrategies.ts，高度绑定场景/媒体/UE 组件事件形态)
 * 和状态动画(useStatusAnimation，编辑器状态)。这里把"策略执行"这几个动作收窄成端口注入，
 * 而不是像之前那样注入整个 hook。
 *
 * 部署顺序要求：主应用必须在挂载任何触发事件的组件之前调用这些 initXxx。
 */
export interface ActionExecutionParams extends Partial<Action> {
  /** 组件DOM元素列表 */
  componentRootDoms: NodeListOf<HTMLElement>;
  /** 组件ID列表 */
  componentIds: number[];
  /** 条件是否满足 */
  isConditionSatisfied: boolean;
  /** 事件列表 */
  eventList: TotalPanelEventMap;
  /** 全局组件配置 */
  globalComponentMap: Map<string, ComponentType>;
  /** 组件抛出值 */
  info: Record<string, any> | null;
  /** 触发组件ID */
  sourceComponentId: number | undefined;
  /** 全局动画触发器 */
  globalAnimationTriggers: Map<string, AnimationTrigger>;
  /** 更新组件配置回调 */
  updateComponentConfigCallback?: (componentConfig: unknown) => void;
  /** 更新组件左上角坐标回调 */
  updateComponentTopLeftCallback?: () => void;
}

/** 替代 ActionStrategyFactory.getStrategy(actionType).execute(...)（通用动作分发，actionStrategies 留在 app） */
export type ActionStrategyExecutorFn = (
  actionType: ActionTypeEnum,
  params: ActionExecutionParams
) => void | Promise<void>;

export type SendUE4MessageParams = ActionExecutionParams & { ue4Config: Ue4Config };

/** 替代 useStatusAnimation().triggerStatusAnimationByAction（状态动画留在 app，编辑器状态） */
export type StatusAnimationTriggerFn = (panelStatusAnimationId: string, panelStatusId: string) => Promise<void>;

/**
 * 替代分散在 useEventHandling(useRoute 判断 build/panel/encode)和 useEncodeEvent
 * (useRoute 判断 view/shareScreen/encodePanel)里的路由判断。
 * isEncodedControl 已随 detail 下沉到共享的 navInfo（见 useLargeScreenInfo），不再需要注入。
 *
 * 内建实现：由注入的 router（见 routerPort）+ useEditStore 派生，不再需要 app 注入闭包。
 */
export interface EditModeInfo {
  /** 对应原 route.name === "build" | "panel" | "encode" */
  isBuild: boolean;
  /** 对应原 route.path.includes("view"|"shareScreen") && type !== "0" */
  isViewOrShare: boolean;
  /** 对应原 route.name === "encodePanel" */
  isExportEncodeView: boolean;
}

function createPort<T>(name: string) {
  let impl: T | null = null;
  return {
    init: (fn: T): void => {
      impl = fn;
    },
    get: (): T => {
      if (!impl) {
        throw new Error(`[@screenwright/composables] ${name} 尚未初始化，请在应用启动时调用对应的 initXxx() 注入实现`);
      }
      return impl;
    }
  };
}

const actionStrategyExecutorPort = createPort<ActionStrategyExecutorFn>("actionStrategyExecutor");
export const initActionStrategyExecutor = actionStrategyExecutorPort.init;
export const getActionStrategyExecutor = actionStrategyExecutorPort.get;

const sendUE4MessagePort = createPort<(params: SendUE4MessageParams) => void | Promise<void>>(
  "sendUE4Message"
);
export const getSendUE4Message = sendUE4MessagePort.get;

const statusAnimationTriggerPort = createPort<StatusAnimationTriggerFn>("statusAnimationTrigger");
export const initStatusAnimationTrigger = statusAnimationTriggerPort.init;
export const getStatusAnimationTrigger = statusAnimationTriggerPort.get;

const routerPort = createPort<Router>("router");
/**
 * 由主应用在启动时调用一次，以模块级单例注入 router 实例——
 * 绕过 createGlobalState 工厂内无法调用 useRouter() 的局限（工厂可能在 setup 外执行）。
 */
export const initRouter = routerPort.init;
export const getRouter = routerPort.get;

/** 便捷方法：直接派生编辑态/路由判断结果，无需 app 注入闭包。 */
export function resolveEditMode(): EditModeInfo {
  const route = getRouter().currentRoute.value;
  return {
    isBuild: route.name === "build" || route.name === "panel" || route.name === "encode",
    isViewOrShare: (route.path.includes("view") || route.path.includes("shareScreen")) && route.query.type !== "0",
    isExportEncodeView: route.name === "encodePanel"
  };
}
