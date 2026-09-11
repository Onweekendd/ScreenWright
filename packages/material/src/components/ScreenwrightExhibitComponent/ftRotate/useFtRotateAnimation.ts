import { useBaseData } from "@screenwright/composables";
import { useEvent } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { type ComponentType, EventTypeEnum } from "@screenwright/types";
import { computed, ref } from "vue";

import { SimpleAnimationController } from "../verticalCard/utils";
export const useFtRotateAnimation = (element: ComponentType) => {
  type FtRotateDomEl = HTMLElement & {
    checkAnimationBack?: () => Promise<void>;
  };

  // 让父组件通过 querySelector 取到 el 后，能直接调用 el.checkAnimationBack()
  const ftRotateFlipBoxTarget = ref<FtRotateDomEl | null>(null);
  const flipperRef = ref<HTMLElement | null>(null);
  const { option } = useBaseData(element);

  const anchorClass = computed(() => {
    const anchor = option.value.direction;
    switch (anchor) {
      case "leftTop":
        return "anchor-top-left";
      case "rightTop":
        return "anchor-top-right";
      case "leftBottom":
        return "anchor-bottom-left";
      case "rightBottom":
        return "anchor-bottom-right";
      case "center":
        return "anchor-center";
      default:
        return "anchor-top-left";
    }
  });

  const frontBgStyle = computed(() => {
    const url = option.value.frontBgImageUrl;
    if (url) {
      return {
        background: `url(${setMinioUrl(url)}) no-repeat center/100% 100%`,
      };
    }
    return {
      background: "",
    };
  });

  const backBgStyle = computed(() => {
    const url = option.value.backBgImageUrl;
    if (url) {
      return {
        background: `url(${setMinioUrl(url)}) no-repeat center/100% 100%`,
      };
    }
    return {
      background: "",
    };
  });

  const openTime = computed(() => {
    return option.value.openTime ? option.value.openTime : 1;
  });
  const rotateOpenTime = computed(() => {
    return option.value.rotateOpenTime ? option.value.rotateOpenTime : 1;
  });
  const rotateBackTime = computed(() => {
    return option.value.rotateBackTime ? option.value.rotateBackTime : 1;
  });
  const hideTime = computed(() => {
    return option.value.hideTime ? option.value.hideTime : 1;
  });

  const openTiming = computed(() => {
    return option.value.openTiming ? option.value.openTiming : "ease-in";
  });
  const rotateOpenTiming = computed(() => {
    return option.value.rotateOpenTiming
      ? option.value.rotateOpenTiming
      : "ease-in";
  });
  const rotateBackTiming = computed(() => {
    return option.value.rotateBackTiming
      ? option.value.rotateBackTiming
      : "ease-in";
  });
  const hideTiming = computed(() => {
    return option.value.hideTiming ? option.value.hideTiming : "ease-in";
  });

  const backBgImageUrlSizeWidth = computed(() => {
    return option.value.backBgImageUrlSizeWidth;
  });

  const backBgImageUrlSizeHight = computed(() => {
    return option.value.backBgImageUrlSizeHight;
  });
  const { handleEventAndCallbackEvent } = useEvent();
  const controller = new SimpleAnimationController();
  const isFlipped = ref(false);
  const isScaled = ref(false);

  const flippedAnimation = (el: HTMLElement | null, element: ComponentType) => {
    return new Promise((resolve) => {
      if (!el) {
        resolve(false);
        return;
      }
      el.dataset.animationType = EventTypeEnum.startRotate;
      const animationSequence = [
        { name: "flipped", wait: openTime.value * 100 }, // 对应原生第一个动画的wait
      ];
      const animInstance = controller.createSequence(
        el,
        animationSequence,
        false,
      );
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.startRotate,
        events: element.events,
        throwValue: element,
      });
      isFlipped.value = false;
      const parentEl = (ftRotateFlipBoxTarget.value as HTMLElement)
        .parentElement;
      if (parentEl) {
        parentEl.style.zIndex = "9991";
      }
      animInstance.on("flipped", () => {
        console.log("✅ flipped 动画完成");
        isFlipped.value = true;
        // isDownAndScaleStep.value[0] = true;
        el.dataset.animationType = EventTypeEnum.endRotate;
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.endRotate,
          events: element.events,
          throwValue: element,
        });
        resolve(true);
      });
    });
  };
  const scaledAnimation = (el: HTMLElement | null, element: ComponentType) => {
    return new Promise((resolve) => {
      if (!el) {
        resolve(false);
        return;
      }
      const animationSequence = [
        { name: "rotateScaled", wait: rotateOpenTime.value * 1000 }, // 对应原生第一个动画的wait
      ];
      el.dataset.animationType = EventTypeEnum.startScaleRotate;
      const animInstance = controller.createSequence(
        el,
        animationSequence,
        false,
      );
      const parentEl = (ftRotateFlipBoxTarget.value as HTMLElement)
        .parentElement;
      if (parentEl) {
        parentEl.style.zIndex = "999";
      }
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.startScaleRotate,
        events: element.events,
        throwValue: element,
      });
      isScaled.value = false;
      animInstance.on("rotateScaled", () => {
        console.log(`✅ rotateScaled 动画完成`);
        isScaled.value = true;
        el.dataset.animationType = EventTypeEnum.endScaleRotate;
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.endScaleRotate,
          events: element.events,
          throwValue: element,
        });
        resolve(true);
      });
    });
  };

  const removeScaledAnimation = (
    el: HTMLElement | null,
    element: ComponentType,
  ) => {
    return new Promise((resolve) => {
      if (!el) {
        resolve(false);
        return;
      }
      const animationSequence = [
        { name: "rotateScaledBack", wait: rotateBackTime.value * 1000 }, // 对应原生第一个动画的wait
      ];
      const animInstance = controller.createSequence(
        el,
        animationSequence,
        false,
      );
      el.dataset.animationType = EventTypeEnum.startSmallRotate;
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.startSmallRotate,
        events: element.events,
        throwValue: element,
      });
      const parentEl = (ftRotateFlipBoxTarget.value as HTMLElement)
        .parentElement;
      if (parentEl) {
        parentEl.style.removeProperty("z-index");
      }
      animInstance.on("rotateScaledBack", () => {
        console.log(`✅ rotateScaledBack 动画完成`);
        el.dataset.animationType = EventTypeEnum.endSmallRotate;
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.endSmallRotate,
          events: element.events,
          throwValue: element,
        });
        resolve(true);
      });
    });
  };

  const removeFlippedAnimation = (
    el: HTMLElement | null,
    element: ComponentType,
  ) => {
    return new Promise((resolve) => {
      if (!el) {
        resolve(false);
        return;
      }
      const animationSequence = [
        { name: "flippedBack", wait: hideTime.value * 1000 }, // 对应原生第一个动画的wait
      ];
      const animInstance = controller.createSequence(el, animationSequence);

      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.reversalStartRotate,
        events: element.events,
        throwValue: element,
      });

      animInstance.on("flippedBack", () => {
        console.log(`✅ flippedBack 动画完成`);
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.reversalEndRotate,
          events: element.events,
          throwValue: element,
        });
        resolve(true);
      });
    });
  };

  return {
    ftRotateFlipBoxTarget,
    flipperRef,
    anchorClass,
    frontBgStyle,
    backBgStyle,
    openTime,
    rotateOpenTime,
    rotateBackTime,
    hideTime,
    openTiming,
    rotateOpenTiming,
    rotateBackTiming,
    hideTiming,
    backBgImageUrlSizeWidth,
    backBgImageUrlSizeHight,
    flippedAnimation,
    scaledAnimation,
    removeScaledAnimation,
    removeFlippedAnimation,
    handleEventAndCallbackEvent,
  };
};
