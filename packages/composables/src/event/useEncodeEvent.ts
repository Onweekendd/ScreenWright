import { checkConditionSatisfied, extractComponentId } from "@screenwright/core";
import type { ComponentType, EncodeEvent, EncodeEventTypeEnum } from "@screenwright/types";
import { throttle } from "lodash-es";

import { resolveEditMode } from "../ports/eventPort";
import { useGlobalComponentData } from "../useGlobalComponentData";
import { useLargeScreenInfo } from "../useLargeScreenInfo";
import { useEncodeCommunication } from "./useEncodeCommunication";

export interface MessageToSend {
  /**
   * @description 目标组件ID
   */
  id: number;

  /**
   * @description 控制项值
   */
  encodeKey: number | string | null;

  /**
   * @description 是否确认
   */
  isChecked?: boolean;

  /**
   * @description 触发事件类型
   */
  trigger: EncodeEventTypeEnum;

  /**
   * @description 触发事件的值
   */
  throwValue: any;
}

const useEncodeEvent = () => {
  const { sendTerminalMessage } = useEncodeCommunication();
  const { encodeComponentMap } = useGlobalComponentData();
  const { navInfo } = useLargeScreenInfo();

  /**
   * 判断是否为查看或分享页面且不是导出类型，或是否为导出终端
   * @returns boolean
   */
  const isEncodeView = (): boolean => {
    const { isViewOrShare, isExportEncodeView } = resolveEditMode();
    return isExportEncodeView || isViewOrShare;
  };

  /**
   * 判断是否应该跳过终端事件处理
   * @param sourceComponent 源组件
   * @returns 如果应该跳过返回 true
   */
  const shouldSkipEncodeEvent = (sourceComponent?: ComponentType): boolean => {
    const hasParentEncodeId = !!sourceComponent?.parentEncodeId;
    const isInEncodePanel = sourceComponent ? encodeComponentMap.value.has(sourceComponent.id.toString()) : false;

    // 有 parentEncodeId（iframe 引入）的组件不跳过
    if (hasParentEncodeId) {
      return false;
    }

    // 在编码视图或编码控制模式下，需要检查是否在终端面板中
    if (isEncodeView() || navInfo.value.detail.isEncodedControl) {
      return sourceComponent ? !isInEncodePanel : false;
    }

    // 其他情况跳过
    return true;
  };

  /**
   * 处理终端交互事件
   * @param param0
   * @param param0.sourceComponent: 源组件（可选，用于清空时可不传）
   * @param param0.encodes: 终端交互事件
   * @param param0.throwValue: 触发事件的值
   */
  const handleEncodeEvent = ({
    sourceComponent,
    encodes,
    throwValue
  }: {
    sourceComponent?: ComponentType;
    encodes: EncodeEvent[];
    throwValue: any;
  }) => {
    if (shouldSkipEncodeEvent(sourceComponent)) {
      return;
    }

    encodes.forEach((encode) => {
      const { actions, conditions, conditionType, trigger } = encode;
      const isConditionSatisfied = checkConditionSatisfied({
        conditionType,
        conditions,
        curInfo: throwValue
      });

      if (isConditionSatisfied) {
        const messageToSend: MessageToSend[] = actions.map((act) => {
          const { component, encodeValue, encodeKey } = act;
          return {
            id: extractComponentId(component[0]),
            encodeKey: encodeValue[0] || encodeKey || null,
            isChecked: throwValue.isChecked || false,
            trigger,
            throwValue
          };
        });

        sendTerminalMessage({ actions: messageToSend, largeId: sourceComponent?.parentEncodeId });
      }
    });
  };

  // 节流版本的处理终端交互事件方法，防止频繁调用
  // 显式标注类型，避免 declaration 生成时需要引用 @types/lodash 的 DebouncedFunc（不可移植）
  const handleEncodeEventThrottled = throttle(handleEncodeEvent, 500) as (
    params: Parameters<typeof handleEncodeEvent>[0]
  ) => void;

  return {
    handleEncodeEvent,
    handleEncodeEventThrottled
  };
};

export { useEncodeEvent };
