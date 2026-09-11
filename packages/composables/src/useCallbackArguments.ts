import type {
  AddCallbackFieldHandler,
  CallbackFieldTriggerHandler,
  FilterTriggerHandler,
  RemoveCallbackFieldHandler
} from "@screenwright/core";
import type { ChildComponent, ComponentType } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import { debounce } from "lodash-es";
import { computed, onMounted, ref } from "vue";

import { useScreenEditor } from "./core-adapter/useScreenEditor";
import { useGlobalComponentData } from "./useGlobalComponentData";

export type HandleCallbackResult = Record<
  string,
  {
    [key: string]: any;
  }
>;

type DebouncedCallbackFieldTrigger = ReturnType<typeof debounce<(targetKey: string) => Promise<unknown[]>>>;

export const useCallbackArguments = createGlobalState(() => {
  // 共享实例由编辑器单例（@screenwright/core 的 EventManager）持有，确保全应用唯一
  const editor = useScreenEditor();

  const callbackArgumentsInstance = ref(editor.event.callbackArguments);

  const callbackEventManager = editor.event.callbackEventManager;

  // 按组件或 targetKey-id 维度复用防抖函数，触发时使用本次最新的 targetKey
  const debouncedTriggerMap = new Map<string, DebouncedCallbackFieldTrigger>();

  const { screenWithIframeComponentMap } = useGlobalComponentData();

  /**
   * 回调管理器
   */
  const callbackArgumentsManager = computed(() => callbackArgumentsInstance.value.getCallbackArgumentsManager());

  /**
   * 添加回调参数
   * @param {ComponentType} component - 需要添加回调参数的组件
   */
  const addCallbackArgument = (component: ComponentType) => {
    callbackArgumentsInstance.value.addCallbackArgument(component);
  };

  /**
   * 初始化回调参数（清空后添加）
   * @param componentList - 组件列表
   */
  const initCallbackArguments = (componentList: ComponentType[] | ChildComponent[]) => {
    onClear();
    callbackArgumentsInstance.value.initCallbackArguments(componentList);
  };

  /**
   * 批量添加回调参数（不清空，直接添加）
   * @param componentList - 组件列表
   */
  const addCallbackArgumentsFromComponentList = (componentList: ComponentType[] | ChildComponent[]) => {
    callbackArgumentsInstance.value.addCallbackArgumentsFromComponentList(componentList);
  };

  /**
   * 初始化回调关系
   * @param {string} field - 回调字段
   */
  const initCallbackRelation = (field: string) => {
    callbackArgumentsInstance.value.initCallbackRelation(field);
  };

  const setCallbackArgs = (key: string, value: any) => {
    callbackArgumentsInstance.value.setCallbackArgs(key, value);
  };

  /**
   * 获取或创建防抖触发函数
   * @param {string} targetKey - 目标键
   * @param {number | string} id - 组件ID
   * @returns {Function} 防抖函数
   */
  const getDebouncedTrigger = ({
    targetKey,
    id,
    debounceForCallbackArgs = false,
    debounceTime = 300
  }: {
    targetKey: string;
    id: number | string;
    debounceForCallbackArgs?: boolean;
    debounceTime?: number;
  }) => {
    const getKey = () => {
      if (debounceForCallbackArgs) {
        return `${targetKey}-${id}`;
      }
      return `${id}`;
    };
    const key = getKey();

    if (!debouncedTriggerMap.has(key)) {
      const debouncedFn = debounce(async (latestTargetKey: string) => {
        return await emitCallbackFieldTrigger(latestTargetKey, id);
      }, debounceTime); // 300ms 防抖延迟

      debouncedTriggerMap.set(key, debouncedFn);
    }

    return debouncedTriggerMap.get(key)!;
  };

  /**
   * 更新组件的回调关系
   * @param {ComponentType | ChildComponent} component - 需要更新回调关系的组件
   */
  const updateCallbackRelation = (component: ComponentType | ChildComponent) => {
    // 先移除组件的旧回调关系
    callbackArgumentsInstance.value.removeComponentFromCallbacks(component);

    // 重新添加组件的回调关系
    callbackArgumentsInstance.value.addCallbackArgument(component);
  };

  const deleteCallbackRelation = (component: ComponentType | ChildComponent) => {
    callbackArgumentsInstance.value.removeComponentFromCallbacks(component);
  };

  /**
   * 监听添加回调字段事件
   * @param id - 组件ID
   * @param callback - 回调函数
   */
  const onAddCallbackField = (id: number | string, callback: AddCallbackFieldHandler) => {
    callbackEventManager.onAddCallbackField(`onAddCallbackField-${id}`, callback);
  };

  /**
   * 取消监听添加回调字段事件
   * @param id - 组件ID
   * @param callback - 回调函数
   */
  const offAddCallbackField = (id: number | string, callback?: AddCallbackFieldHandler) => {
    callbackEventManager.offAddCallbackField(`onAddCallbackField-${id}`, callback);
  };

  /**
   * 触发添加回调字段事件
   * @param id - 组件ID
   * @param callbackField - 回调字段
   * @returns Promise<any[]> - 返回所有回调函数的执行结果
   */
  const emitAddCallbackField = async (id: number | string, callbackField: string) => {
    return await callbackEventManager.emitAddCallbackField(`onAddCallbackField-${id}`, { callbackField });
  };

  /**
   * 监听移除回调字段事件
   * @param id - 组件ID
   * @param callback - 回调函数
   */
  const onRemoveCallbackField = (id: number | string, callback: RemoveCallbackFieldHandler) => {
    callbackEventManager.onRemoveCallbackField(`onRemoveCallbackField-${id}`, callback);
  };

  /**
   * 取消监听移除回调字段事件
   * @param id - 组件ID
   * @param callback - 回调函数
   */
  const offRemoveCallbackField = (id: number | string, callback?: RemoveCallbackFieldHandler) => {
    callbackEventManager.offRemoveCallbackField(`onRemoveCallbackField-${id}`, callback);
  };

  /**
   * 触发移除回调字段事件
   * @param id - 组件ID
   * @param callbackField - 回调字段
   * @returns any[] - 返回所有回调函数的执行结果
   */
  const emitRemoveCallbackField = (id: number | string, callbackField: string) => {
    callbackArgumentsInstance.value.deleteCallbackArgs(callbackField);
    return callbackEventManager.emitRemoveCallbackField(`onRemoveCallbackField-${id}`, { callbackField });
  };

  /**
   * 监听回调字段触发事件
   * @param options - 监听选项
   * @param options.targetKey - 目标键
   * @param options.id - 组件ID
   * @param options.callback - 回调函数
   */
  const onCallbackFieldTrigger = ({
    targetKey,
    id,
    callback
  }: {
    targetKey: string;
    id: number | string;
    callback: CallbackFieldTriggerHandler;
  }) => {
    callbackEventManager.onCallbackFieldTrigger(`onCallbackFieldTrigger-${targetKey}-${id}`, callback);
  };

  /**
   * 取消监听回调字段触发事件
   * @param options - 监听选项
   * @param options.targetKey - 目标键
   * @param options.id - 组件ID
   * @param options.callback - 回调函数
   */
  const offCallbackFieldTrigger = ({
    targetKey,
    id,
    callback
  }: {
    targetKey: string;
    id: number | string;
    callback?: CallbackFieldTriggerHandler;
  }) => {
    return callbackEventManager.offCallbackFieldTrigger(`onCallbackFieldTrigger-${targetKey}-${id}`, callback);
  };

  /**
   * 触发回调字段触发事件
   * @param targetKey - 目标键
   * @param id - 组件ID
   * @returns Promise<any[]> - 返回所有回调函数的执行结果
   */
  const emitCallbackFieldTrigger = async (targetKey: string, id: number | string) => {
    return await callbackEventManager.emitCallbackFieldTrigger(`onCallbackFieldTrigger-${targetKey}-${id}`);
  };

  /**
   * 监听过滤器执行事件 不需要回调参数 直接触发
   * @param componentId - 组件Id
   * @param callback - 回调函数
   */
  const onFilterTrigger = (componentId: string, callback: FilterTriggerHandler) => {
    callbackEventManager.onFilterTrigger(`onFilterTrigger-${componentId}`, callback);
  };

  /**
   * 取消监听过滤器执行事件 不需要回调参数 直接触发
   * @param componentId - 组件Id
   * @param callback - 回调函数
   */
  const offFilterTrigger = (componentId: string, callback?: FilterTriggerHandler) => {
    callbackEventManager.offFilterTrigger(`onFilterTrigger-${componentId}`, callback);
  };

  /**
   * 触发过滤器执行 不需要回调参数 直接触发
   * @param componentId - 组件Id
   * @param customComponent - 用于子组件触发
   * @returns Promise<any[]> - 返回过滤器执行结果
   */
  const emitFilterTrigger = async (componentId: string, customComponent?: ComponentType | ChildComponent) => {
    return await callbackEventManager.emitFilterTrigger(`onFilterTrigger-${componentId}`, customComponent);
  };

  /**
   * 处理回调
   * @param {Object} options - 回调处理选项
   * @param {ComponentType} options.sourceComponent - 源组件
   * @param {Record<string, any>} options.throwValue - 抛出回调参数
   * @param {boolean} options.debounce - 是否开启防抖
   * @param {boolean} options.debounceForCallbackArgs - 是否为回调参数防抖
   * @returns {Promise<HandleCallbackResult>} - 返回所有回调函数的执行结果
   */
  const handleCallback = async ({
    sourceComponent,
    throwValue,
    debounce = true,
    debounceForCallbackArgs = false
  }: {
    sourceComponent: ComponentType | ChildComponent;
    throwValue: Record<string, any>;
    debounceForCallbackArgs?: boolean;
    debounce?: boolean;
  }) => {
    if (!sourceComponent.cbArgs) {
      return;
    }

    callbackArgumentsInstance.value.handleCallback({ sourceComponent, throwValue });

    const callbackManager = callbackArgumentsInstance.value.getCallbackArgumentsManager();

    /**
     * 结果格式
     * {
     *  回调参数
     *  "labelCb": {
     *    执行组件Id: 执行组件值
     *    "1884459": 100
     *  }
     * }
     */
    const result: HandleCallbackResult = {};

    // 遍历源组件的回调参数
    for (const arg of sourceComponent.cbArgs) {
      const targetKey = arg.value.target.value;

      const callbackRelation = callbackManager[targetKey];
      if (!callbackRelation) {
        continue;
      }

      const { target } = callbackRelation;

      // 遍历回调参数的目标组件
      for (const { id } of target) {
        const targetComponent = screenWithIframeComponentMap.value.get(`${id}`);
        if (!targetComponent) {
          continue;
        }

        // 根据debounce参数决定是否使用防抖
        if (debounce) {
          const debouncedTrigger = getDebouncedTrigger({ targetKey, id, debounceForCallbackArgs });
          await debouncedTrigger(targetKey);
        } else {
          const res = await emitCallbackFieldTrigger(targetKey, id);

          if (result[targetKey]) {
            result[targetKey][id] = res;
          } else {
            result[targetKey] = {
              [id]: res
            };
          }
        }
      }
    }

    return result;
  };

  onMounted(() => {
    callbackArgumentsInstance.value.clearCallbackArguments();
  });

  const onClear = () => {
    // 清理防抖函数映射，并取消所有待执行的防抖函数
    for (const debouncedFn of debouncedTriggerMap.values()) {
      debouncedFn.cancel();
    }
    debouncedTriggerMap.clear();

    // 清理所有事件监听器
    callbackEventManager.clearAll();
  };

  return {
    callbackEventManager,
    callbackArgumentsManager,
    callbackArgumentsInstance,
    addCallbackArgument,
    initCallbackArguments,
    initCallbackRelation,
    handleCallback,
    setCallbackArgs,
    updateCallbackRelation,
    deleteCallbackRelation,
    addCallbackArgumentsFromComponentList,
    onClear,
    // 封装的事件函数
    onAddCallbackField,
    offAddCallbackField,
    emitAddCallbackField,
    onRemoveCallbackField,
    offRemoveCallbackField,
    emitRemoveCallbackField,
    onCallbackFieldTrigger,
    offCallbackFieldTrigger,
    emitCallbackFieldTrigger,
    onFilterTrigger,
    offFilterTrigger,
    emitFilterTrigger
  };
});
