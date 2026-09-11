import {
  type ActionContext,
  ActionExecutionMode,
  getCustomAction,
  registerActionContextEnricher,
  registerCustomAction,
  setActionExecutor,
  sleep
} from "@screenwright/core";
import { type Action, type Event, EventTypeEnum, type TotalPanelEventMap } from "@screenwright/types";
import { ref } from "vue";

import { useScreenEditor } from "../core-adapter/useScreenEditor";
import { getActionStrategyExecutor, getStatusAnimationTrigger, resolveEditMode } from "../ports/eventPort";
import { useActionEvent } from "../useActionEvent";
import { useCallbackArguments } from "../useCallbackArguments";
import { useEventCallbacks } from "../useEventCallbacks";
import { type AnimationTrigger, useGlobalAnimation } from "../useGlobalAnimation";
import { useActionMessage } from "./useActionMessage";

/**
 * 前端往 ActionContext 上补的字段。
 * core 不认识它们（「元素」这种概念不该出现在 core 里），补完原样透传给动作策略。
 */
interface FrontendActionExtras {
  componentRootDoms: NodeListOf<HTMLElement>;
  eventList: TotalPanelEventMap;
  globalAnimationTriggers: Map<string, AnimationTrigger>;
}

/**
 * 由组件 id 拼目标组件选择器
 * @param componentIds 组件ID列表（core 已从 `$component` 形态解析好）
 * @returns CSS选择器字符串
 * @example '#123,#456,#789'
 *
 * 🔥 性能优化：使用 ID 选择器代替属性选择器
 * - ID 选择器 (#id) 比 [data-id='xxx'] 快 10-100 倍
 * - 浏览器对 ID 有专门索引，无需遍历整个 DOM 树
 * - 使用 CSS.escape() 处理特殊字符（如数字开头的 ID）
 */
const getTargetComponentSelector = (componentIds: number[]): string => {
  return componentIds.map((id) => `#${CSS.escape(String(id))}`).join(",");
};

/**
 * 获取组件DOM元素
 * @param selector CSS选择器 (ID 选择器格式: #123,#456)
 * @returns DOM元素列表
 *
 * 🔥 性能优化：
 * - 单个 ID：使用 getElementById（最快）
 * - 多个 ID：使用 querySelectorAll（比属性选择器快 10-100 倍）
 */
const getComponentDomElements = async (selector: string): Promise<NodeListOf<HTMLElement>> => {
  let elements: NodeListOf<HTMLElement>;

  // 检查是否是单个 ID 选择器
  if (!selector.includes(",") && selector.startsWith("#")) {
    const id = selector.slice(1); // 移除 #
    const element = document.getElementById(id);
    elements = element
      ? ([element] as unknown as NodeListOf<HTMLElement>)
      : (document.querySelectorAll(selector) as NodeListOf<HTMLElement>);
  } else {
    // 多个 ID 或其他选择器
    elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
  }

  if (!elements.length) {
    await sleep(200);
    elements = document.querySelectorAll(selector) as NodeListOf<HTMLElement>;
  }

  return elements;
};

/** core 的三个注册表是模块级的：注册一次，全局共享。 */
let actionPortsRegistered = false;

/**
 * 事件处理相关的hook
 * 处理事件触发、条件判断和动作执行
 *
 * 编排（求值条件 → 执行动作 → 抛回调 → 消费方重算过滤器）已下沉到 @screenwright/core 的
 * EventDispatcher；本文件只剩三件 core 干不了的事，全部走注册表交给它：
 *   - 标准动作怎么落地            → setActionExecutor（转交 app 的 ActionStrategyFactory）
 *   - message / statusAnimation → registerCustomAction
 *   - DOM 元素 / 事件表 / 动画触发器 → registerActionContextEnricher
 * 外加两处留在这一层的 UI 关注点：编辑态不执行、回调抛出带防抖。
 */
export function useEventHandling() {
  const editor = useScreenEditor();
  const { eventList } = useActionEvent();
  const { handleCallback } = useCallbackArguments();
  const { setTcpudpToWebsocket, retry } = useActionMessage();
  const { triggerRegistry } = useGlobalAnimation();
  const {
    executeCallbacks,
    registerCallback,
    registerCallbacks,
    unregisterCallback,
    clearCallbacks,
    getCallbackCount
  } = useEventCallbacks();

  // 当前选中的子组件
  const activeChildComponent = ref<any>(null);

  const ensureActionPortsRegistered = () => {
    if (actionPortsRegistered) {
      return;
    }
    actionPortsRegistered = true;

    // 上下文补充：core 算得出 componentIds，查元素、取事件表和动画触发器是前端的事
    registerActionContextEnricher(async (action, context) => {
      const extras = {
        eventList: eventList.value,
        globalAnimationTriggers: triggerRegistry
      };
      // 只有「注册过处理器的」自定义动作才不需要元素——标准组件动作也带
      // customActionType（"component"），判据必须和 core 的路由一致，否则整类组件动作拿不到 DOM
      const isRegisteredCustomAction = Boolean(action.customActionType && getCustomAction(action.customActionType));
      if (isRegisteredCustomAction || !context.componentIds.length) {
        return extras;
      }
      const selector = getTargetComponentSelector(context.componentIds);
      return { ...extras, componentRootDoms: await getComponentDomElements(selector) };
    });

    //  TODO: TCP/UDP走的逻辑
    registerCustomAction("message", (action) => {
      retry(() => setTcpudpToWebsocket(action.tcpudpConfig), {
        maxRetries: 3,
        retryInterval: 500
      });
    });

    registerCustomAction("statusAnimation", async (action, context) => {
      if (!context.isConditionSatisfied) {
        return;
      }
      const { panelStatusAnimationId, panelStatusId } = action;
      // 调用状态动画触发函数
      if (panelStatusAnimationId && panelStatusId) {
        await getStatusAnimationTrigger()(panelStatusAnimationId, panelStatusId);
      }
    });

    // 标准动作：转交注入的策略执行器（具体策略实现留在 app：actionStrategies.ts）
    setActionExecutor((action, context) => {
      if (!action.action) {
        return;
      }
      const ctx = context as ActionContext & FrontendActionExtras;
      getActionStrategyExecutor()(action.action, {
        componentRootDoms: ctx.componentRootDoms,
        componentIds: ctx.componentIds,
        isConditionSatisfied: ctx.isConditionSatisfied,
        info: ctx.info,
        sourceComponentId: ctx.sourceComponentId,
        ...action,
        eventList: ctx.eventList,
        globalComponentMap: ctx.globalComponentMap,
        globalAnimationTriggers: ctx.globalAnimationTriggers,
        updateComponentConfigCallback: ctx.updateComponentConfigCallback,
        updateComponentTopLeftCallback: ctx.updateComponentTopLeftCallback
      });
    });
  };

  /**
   * @description 处理事件
   * @param param
   * @param param.throwValue 触发事件的值
   * @param param.events 事件列表
   * @param param.isExecuteOnlyConditionSatisfied 是否只在条件满足时执行
   * @param param.triggerType 事件触发类型
   * @param param.modelId 模型标识（保留入参，动作策略当前未使用）
   * @param param.throwCallback 是否触发回调
   * @param param.callbackDebounce 回调是否防抖执行（透传给 handleCallback.debounce）
   * @param param.isExecuteOnlyInViewMod 是否只在非编辑模式下执行
   * @returns
   */
  const handleEvents = async (
    {
      throwValue,
      events,
      isExecuteOnlyConditionSatisfied = true,
      triggerType,
      id,
      throwCallback,
      callbackDebounce = true,
      isExecuteOnlyInViewMod = true
    }: {
      throwValue: Record<string, any>;
      events: Event[];
      isOutsideMessage?: boolean;
      id?: number | string;
      isExecuteOnlyConditionSatisfied?: boolean;
      triggerType: EventTypeEnum;
      modelId?: string;
      throwCallback?: boolean;
      callbackDebounce?: boolean;
      isExecuteOnlyInViewMod?: boolean;
    } = {
      throwValue: {},
      events: [],
      isExecuteOnlyConditionSatisfied: true,
      triggerType: EventTypeEnum.Change,
      throwCallback: true,
      callbackDebounce: true,
      isExecuteOnlyInViewMod: true
    }
  ) => {
    ensureActionPortsRegistered();

    if (!throwValue) {
      return;
    }

    // 编辑态不执行：core 不认识路由，这个判断留在调用方
    if (resolveEditMode().isBuild && isExecuteOnlyInViewMod) {
      return;
    }

    await editor.eventDispatcher.dispatch({
      events,
      triggerType,
      throwValue,
      id,
      isExecuteOnlyConditionSatisfied,
      // 与改造前一致：不显式传就不抛回调
      throwCallback: Boolean(throwCallback),
      // 前端历来是多个动作一起发出去，不排队
      actionMode: ActionExecutionMode.PARALLEL,
      // 回调走前端这版：带防抖（防抖分支不收集结果，所以返回值可能为空）
      dispatchCallback: ({ sourceComponent }) =>
        handleCallback({
          throwValue,
          sourceComponent,
          debounce: callbackDebounce
        })
    });

    // 执行所有已注册的回调函数
    executeCallbacks({
      throwValue,
      id,
      triggerType
    });
  };

  /**
   * 处理动作（不经过事件：编码控制把一条外部消息直接翻成一个动作）
   * @param params 动作参数
   * @param params.actions 动作列表
   * @param params.isConditionSatisfied 是否满足条件
   * @param params.info 触发事件的值
   * @param params.id 组件ID
   */
  const handleActions = async ({
    actions,
    isConditionSatisfied,
    info,
    id
  }: {
    actions: Action[];
    isConditionSatisfied: boolean;
    info: Record<string, any>;
    isCheck?: boolean;
    id?: number;
    modelId?: string;
  }) => {
    ensureActionPortsRegistered();
    await editor.eventDispatcher.executeActions({
      actions,
      isConditionSatisfied,
      info,
      id,
      mode: ActionExecutionMode.PARALLEL
    });
  };

  return {
    handleEvents,
    handleActions,
    activeChildComponent,
    // 导出回调管理相关方法
    registerCallback,
    registerCallbacks,
    unregisterCallback,
    clearCallbacks,
    getCallbackCount
  };
}
