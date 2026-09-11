import { useEvent } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { computed, ref } from "vue";

import { SimpleAnimationController } from "./utils";

export const useAnimationDom = () => {
  const { handleEventAndCallbackEvent } = useEvent();
  const controller = new SimpleAnimationController();
  const isDownAndScaleStep = ref<boolean[]>([
    false, // 下滑
  ]);
  const isDownAndScaleComplete = ref<boolean[]>([false, false]); // 下滑+展开/收起
  const setIsDownAndScaleStep = () => {
    isDownAndScaleStep.value[0] = false;
  };
  const setIsDownAndScaleComplete = () => {
    isDownAndScaleComplete.value[0] = false;
  };
  const isEndDown = computed(() => {
    return isDownAndScaleStep.value.every((v) => Boolean(v));
  });
  const isDownAndScale = computed(() => {
    return isDownAndScaleComplete.value.every((v) => Boolean(v));
  });
  const downAndScale = (
    el: HTMLElement | null,
    cardItem: any,
    element: ComponentType,
  ) => {
    return new Promise((resolve) => {
      if (!el) {
        resolve(false);
        return;
      }

      const animationSequence = [
        { name: "moveDown", wait: 2000 }, // 对应原生第一个动画的wait
      ];
      const animInstance = controller.createSequence(el, animationSequence);
      animInstance.on("moveDown", () => {
        // console.log("✅ 第一阶段（moveDown）完成：下滑更柔和");
        isDownAndScaleStep.value[0] = true;
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.CardDropEnd,
          events: element.events,
          throwValue: cardItem,
        });
        resolve(true);
      });
    });
  };

  const setExpandClip = (
    el: HTMLElement | null,
    cardItem: any,
    element: ComponentType,
  ) => {
    return new Promise((resolve) => {
      if (!el) {
        resolve(false);
        return;
      }
      console.log("✅ 第二阶段（expandClip）开始", el);
      console.log(cardItem, "cardItemcardItemcardItem");
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.CardBeforeExpand,
        events: element.events,
        throwValue: cardItem,
      });
      const animationSequence = [
        { name: "expandClip", wait: 2000 }, // 对应原生第二个动画的wait
      ];
      isDownAndScaleComplete.value[0] = false;
      const animInstance = controller.createSequence(
        el,
        animationSequence,
        false,
      );
      animInstance.on("expandClip", () => {
        isDownAndScaleComplete.value[0] = true;
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.CardEndExpand,
          events: element.events,
          throwValue: cardItem,
        });
        resolve(true);
        console.log("✅ 第二阶段（expandClip）完成");
      });
    });
  };

  const setShrinkClip = (
    el: HTMLElement | null,
    cardItem: any,
    element: ComponentType,
  ) => {
    return new Promise((resolve) => {
      if (!el) {
        resolve(false);
        return;
      }
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.CardStartCollapse,
        events: element.events,
        throwValue: cardItem,
      });
      const animationSequence = [
        { name: "shrinkClip", wait: 2000 }, // 对应原生第二个动画的wait
      ];
      const animInstance = controller.createSequence(el, animationSequence);
      isDownAndScaleComplete.value[1] = false;
      animInstance.on("shrinkClip", () => {
        isDownAndScaleComplete.value[1] = true;
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.CardEndCollapse,
          events: element.events,
          throwValue: cardItem,
        });
        resolve(true);
        console.log("✅ 第三阶段（expandClip）完成");
      });
    });
  };

  //   const scrollAndScale = (el: HTMLElement | null) => {
  //     return new Promise((resolve) => {
  //       if (!el) {
  //         resolve(false);
  //         return;
  //       }
  //       const animationSequence = [
  //         { name: "expandClip", wait: 2000 }, // 对应原生第二个动画的wait
  //         { name: "shrinkClip", wait: 0 } // 最后一个动画无需等待
  //       ];
  //       const animInstance = controller.createSequence(el, animationSequence);
  //       animInstance
  //         .on("expandClip", () => {
  //           isDownAndScaleComplete.value[0] = true;
  //           console.log("✅ 第二阶段（expandClip）完成");
  //         })
  //         .on("shrinkClip", () => {
  //           isDownAndScaleComplete.value[1] = true;
  //           console.log("✅ 第三阶段（shrinkClip）完成");
  //         });
  //     });
  //   };
  return {
    downAndScale,
    // scrollAndScale,
    setExpandClip,
    setShrinkClip,
    isEndDown,
    isDownAndScale,
    isDownAndScaleStep,
    isDownAndScaleComplete,
    setIsDownAndScaleStep,
    setIsDownAndScaleComplete,
  };
};
