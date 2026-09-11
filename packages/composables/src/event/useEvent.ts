import { computed, ref } from "vue";

import { resolveEditMode } from "../ports/eventPort";
import { useEventHandling } from "./useEventHandling";

/**
 * 事件管理的主入口hook
 * 组合各个功能模块，提供统一的事件处理接口
 */
export const useEvent = () => {
  const isBuild = computed(() => resolveEditMode().isBuild);

  // 事件处理需要依赖其他模块
  const { handleEvents } = useEventHandling();

  // 类型体操：提取handleEvents函数的参数类型，确保类型完全匹配
  type HandleEventsParams = NonNullable<Parameters<typeof handleEvents>[0]>;

  /**
   * @description 处理事件
   * @param param
   * @param param.throwValue 触发事件的值
   * @param param.events 事件列表
   * @param param.isExecuteOnlyConditionSatisfied 是否只在条件满足时执行
   * @param param.triggerType 事件触发类型
   * @param param.modelId 模型标识
   * @returns
   */
  const handleEventAndCallbackEvent = (params: HandleEventsParams) => {
    handleEvents({
      ...params,
      throwCallback: true
    });
  };

  // 当前选中的子组件
  const activeChildComponent = ref<any>(null);

  // 提供公共API
  return {
    handleEvents,
    handleEventAndCallbackEvent,
    // 辅助状态
    isBuild,
    activeChildComponent
  };
};
