import type { ChildComponent, ComponentType } from "@screenwright/types";
import { DataType } from "@screenwright/types";

import { FilterData, WebsocketFilter } from "./filter";
import { useCallbackArguments } from "./useCallbackArguments";
import { useDataFilter } from "./useDataFilter";

export const useRegisterFilter = (
  component: ComponentType | ChildComponent,
  onFilterDataChange?: (_data: unknown) => void
) => {
  const {
    onCallbackFieldTrigger,
    onRemoveCallbackField,
    onFilterTrigger,
    onAddCallbackField,
    offAddCallbackField,
    offCallbackFieldTrigger,
    offFilterTrigger,
    offRemoveCallbackField
  } = useCallbackArguments();

  const filterData = new FilterData();
  const { dataFilter } = useDataFilter();

  /**
   * 处理 WebSocket 数据接收
   * 当 WebSocket 接收到新数据时，触发组件数据重新计算
   */
  const handleWebSocketDataReceived = (targetComponent: ComponentType | ChildComponent) => {
    return async (_data: unknown) => {
      // _data 参数由 WebSocket 传入，这里我们只需要触发重新计算
      // 实际的数据由 WebSocketManager 管理，通过 filterData.run 获取
      const result = await filterData.run({
        filterConfig: dataFilter.value,
        target: targetComponent,
        onDataReceived: handleWebSocketDataReceived(targetComponent)
      });

      onFilterDataChange?.(result);
    };
  };

  /**
   * 组件最后用于渲染的数据
   * @param customComponent 自定义组件 用于 component 没用被修改的情况手动传入
   */
  const calculateComponentData = async (customComponent?: ComponentType | ChildComponent) => {
    const targetComponent = customComponent || component;

    // 确定是否需要 WebSocket 数据接收回调
    const dataReceivedCallback =
      targetComponent.dataType === DataType.WEBSOCKET ? handleWebSocketDataReceived(targetComponent) : undefined;

    const result = await filterData.run({
      filterConfig: dataFilter.value,
      target: targetComponent,
      onDataReceived: dataReceivedCallback
    });

    onFilterDataChange?.(result);

    return result;
  };

  /**
   * 监听回调字段触发
   * @param field 回调字段
   */
  const onListenCallbackFieldTrigger = (field: string) => {
    onCallbackFieldTrigger({
      targetKey: field,
      id: component.id,
      callback: calculateComponentData
    });
  };

  const setupCallbackListeners = () => {
    if (!component || !component.listenArgs || component.listenArgs.length === 0) {
      return;
    }

    // 为每个监听参数中的回调字段添加监听器
    component.listenArgs.forEach((listenArg) => {
      if (listenArg.callbackFields && listenArg.callbackFields.length > 0) {
        listenArg.callbackFields.forEach((field) => {
          // 添加回调事件监听器
          onListenCallbackFieldTrigger(field);
        });
      }
    });
  };

  const handleAddCallbackField = async ({ callbackField }: { callbackField: string }) => {
    onListenCallbackFieldTrigger(callbackField);
  };

  const handleRemoveCallbackField = async ({ callbackField }: { callbackField: string }) => {
    await offCallbackFieldTrigger({
      targetKey: callbackField,
      id: component.id,
      callback: calculateComponentData
    });
  };

  const handleFilterTrigger = async (customComponent?: ComponentType | ChildComponent) => {
    return await calculateComponentData(customComponent);
  };

  const registerFilter = () => {
    setupCallbackListeners();

    onAddCallbackField(component.id, handleAddCallbackField);
    onRemoveCallbackField(component.id, handleRemoveCallbackField);
    onFilterTrigger(`${component.id}`, handleFilterTrigger);
  };

  const unRegisterFilter = () => {
    if (component && component.listenArgs) {
      component.listenArgs.forEach((listenArg) => {
        if (listenArg.callbackFields && listenArg.callbackFields.length > 0) {
          listenArg.callbackFields.forEach((field) => {
            offCallbackFieldTrigger({
              targetKey: field,
              id: component.id,
              callback: calculateComponentData
            });
          });
        }
      });
    }

    offAddCallbackField(component.id, handleAddCallbackField);
    offRemoveCallbackField(component.id, handleRemoveCallbackField);
    offFilterTrigger(`${component.id}`, handleFilterTrigger);

    // 清理 WebSocket 订阅
    if (component && component.dataType === DataType.WEBSOCKET) {
      try {
        WebsocketFilter.getInstance().cleanupComponentSubscription(component.id);
      } catch (error) {
        console.error("[useRegisterFilter] 清理 WebSocket 订阅失败:", error);
      }
    }
  };

  return {
    calculateComponentData,
    registerFilter,
    unRegisterFilter
  };
};
