import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { type Ref } from "vue";

export interface TimerShaftEventsOptions {
  element: ComponentType;
}

export const useTimerShaftEvents = (element: ComponentType) => {
  const { handleEventAndCallbackEvent } = useBaseData(element);

  // 设置活动项并触发事件
  const setActive = (
    dataList: Ref<any[]>,
    currentSelect: Ref<any>,
    moveTranslate: Ref<number>,
    idx: number,
    distance?: number,
    isAutoPlay = false,
  ) => {
    const currentDataList = dataList.value;
    currentDataList.forEach((k, i) => {
      if (idx === i) {
        currentDataList[i].active = true;
      } else {
        currentDataList[i].active = false;
      }
    });

    moveTranslate.value = idx === 0 ? 0 : distance || moveTranslate.value;
    currentSelect.value = currentDataList.find((c) => c.index === idx) || {};
    if (!isAutoPlay) {
      handleEventAndCallbackEvent({
        throwValue: { ...currentSelect.value },
        events: element.events,
        triggerType: EventTypeEnum.Click,
        id: element.id,
      });
    }
  };

  // 发送播放状态更新
  const emitPlayStatus = (status: boolean) => {
    element.emitter?.emit("getPlayStatus", { status });
  };

  return {
    handleEventAndCallbackEvent,
    setActive,
    emitPlayStatus,
  };
};
