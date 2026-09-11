<template>
  <!-- :data-allow-back="element.option." -->
  <div
    class="ft-rotate"
    id="ftRotateFlipBoxTarget"
    ref="ftRotateFlipBoxTarget"
    :style="{
      '--scale-w': `${backBgImageUrlSizeWidth}px`,
      '--scale-h': `${backBgImageUrlSizeHight}px`,
      '--open-time': `${openTime}s`,
      '--rotate-open-time': `${rotateOpenTime}s`,
      '--rotate-back-time': `${rotateBackTime}s`,
      '--hideTime-time': `${hideTime}s`,
      '--open-timing': `${openTiming}`,
      '--rotate-open-timing': `${rotateOpenTiming}`,
      '--rotate-back-timing': `${rotateBackTiming}`,
      '--hideTime-timing': `${hideTiming}`
    }"
  >
    <!-- 翻转容器 -->
    <div class="flip-container" @click="debounceClick">
      <!-- 翻转核心盒子 -->
      <div class="flipper" ref="flipperRef" :class="anchorClass">
        <!-- 正面 -->
        <div class="front" :style="frontBgStyle" />
        <!-- 反面 -->
        <div class="back" :style="backBgStyle" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted } from "vue";

import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { debounce } from "lodash-es";

import { useActionEvent } from "@screenwright/composables";
import { sleep } from "@screenwright/core";
import { ExhibitEnum } from "@screenwright/types";

// import { sleep } from "@screenwright/core";
import { useFtRotateAnimation } from "./useFtRotateAnimation";

let props = defineProps<{
  element: ComponentType;
}>();
// 使用基础数据hook
const { addEvent } = useActionEvent();
const {
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
  handleEventAndCallbackEvent
} = useFtRotateAnimation(props.element);

const startAnimation = async () => {
  const flipper = flipperRef.value as HTMLElement;
  // 如果是关联的就查询
  if (props.element.option.relate) {
    findTargetDom();
  }

  if (flipper.dataset.animationType === EventTypeEnum.endScaleRotate) {
    endAnimation();
  } else if (flipper.dataset.animationType === EventTypeEnum.endSmallRotate || !flipper.dataset.animationType) {
    const parentEl = (ftRotateFlipBoxTarget.value as HTMLElement).parentElement;
    if (parentEl) {
      parentEl.style.zIndex = "9999";
    }
    await flippedAnimation(flipper, props.element);
    await scaledAnimation(flipper, props.element);
  } else {
    console.log("正在执行某个动画中");
    return;
  }
};

const findTargetDom = () => {
  const doms = document.querySelectorAll("#ftRotateFlipBoxTarget");

  // 包含这个组件本身 如果小于2 就没有必要了
  if (doms.length < 2) return;
  Array.from(doms).forEach((domNode) => {
    const parentEl = domNode.parentElement;
    const parentId = parentEl?.id;

    if (parentId && parentId !== String(props.element.id)) {
      const maybeEl = domNode as unknown as { checkAnimationBack?: () => unknown };

      if (maybeEl.checkAnimationBack) {
        maybeEl.checkAnimationBack();
      }
    }
  });
};

const endAnimation = async () => {
  const flipper = flipperRef.value as HTMLElement;
  await removeScaledAnimation(flipper, props.element);
  // await sleep(1000);
  await removeFlippedAnimation(flipper, props.element);
};
const debounceClick = debounce(() => {
  // 这里写你要防抖的逻辑
  handleClick();
}, 200);
const handleClick = async () => {
  const flipper = flipperRef.value as HTMLElement;
  const willFlip = flipper.classList.contains("flipped");

  if (willFlip) {
    return;
  }
  startAnimation();
};

const BackAnimation = {
  [EventTypeEnum.startRotate]: async () => {
    await sleep((openTime.value / 2 + rotateOpenTime.value) * 1000);
    endAnimation();
  },
  [EventTypeEnum.endRotate]: async () => {
    await sleep(rotateOpenTime.value * 1000);
    endAnimation();
  },
  [EventTypeEnum.startScaleRotate]: async () => {
    await sleep((rotateOpenTime.value / 2) * 1000);
    endAnimation();
  },
  [EventTypeEnum.endScaleRotate]: () => {
    endAnimation();
  },
  [EventTypeEnum.startSmallRotate]: () => {
    return;
  },
  [EventTypeEnum.endSmallRotate]: () => {
    return;
  },
  [EventTypeEnum.reversalStartRotate]: () => {
    return;
  },
  [EventTypeEnum.reversalEndRotate]: () => {
    return;
  }
};
const debounceAnimationBack = debounce((animType: string) => {
  if (!flipperRef.value || !props.element.option.relate) return;
  const key = animType as keyof typeof BackAnimation;
  if (!Object.prototype.hasOwnProperty.call(BackAnimation, key)) return;
  // 这里写你要防抖的逻辑
  BackAnimation[key]();
}, 50);

const checkAnimationBack = async (): Promise<void> => {
  await nextTick();

  const animType = flipperRef.value?.dataset.animationType;
  if (!animType) return;
  debounceAnimationBack(animType);
};

const initCheckAnimationBack = () => {
  if (ftRotateFlipBoxTarget.value) {
    ftRotateFlipBoxTarget.value.checkAnimationBack = checkAnimationBack;
  }
};

onMounted(async () => {
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,
    throwValue: props.element
  });

  addEvent({
    [`${ExhibitEnum.FtRotate}-${props.element.id}`]: {
      handleClick: () => {
        debounceClick();
      }
    }
  });
  await nextTick();
  initCheckAnimationBack();
});

onBeforeUnmount(() => {
  const parentEl = (ftRotateFlipBoxTarget.value as HTMLElement).parentElement;
  if (parentEl) {
    parentEl.style.removeProperty("z-index");
  }
});
</script>
<style lang="scss">
.ft-rotate {
  width: 100%;
  height: 100%;
  --scale-w: 220px;
  --scale-h: 330px;
  --open-time: 1s;
  --rotate-open-time: 0.5s;
  --rotate-back-time: 1s;
  --hideTime-time: 0.5s;
  --open-timing: ease-in;
  --rotate-open-timing: ease-in;
  --rotate-back-timing: ease-in;
  --hideTime-timing: ease-in;
}
.flip-container {
  width: 100%;
  height: 100%;
  perspective: 1000px;
  cursor: pointer;
  overflow: visible;
  position: relative;
}

.flipper {
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform-origin: center center;
  --rot: 0deg;
  --tx: 0;
  --ty: 0;
  transform: translate(var(--tx), var(--ty)) rotateY(var(--rot));
}

.flipper.no-anim {
  transition: none;
}

.front,
.back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 8px;
}

.back {
  // background-color: #00ff00;
  transform: rotateY(180deg);
}

/* ===================================== */
/* ✅ 关键修复：真正的 CSS 动画 */
/* ===================================== */
@keyframes flipped {
  0% {
    transform: translate(var(--tx), var(--ty)) rotateY(0deg);
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotateY(180deg);
  }
}
.flipper.flipped {
  animation: flipped var(--open-time) ease forwards;
}

@keyframes rotateScaled {
  0% {
    width: 100%;
    height: 100%;
    transform: translate(var(--tx), var(--ty)) rotateY(180deg);
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotateY(180deg);
    width: var(--scale-w);
    height: var(--scale-h);
  }
}
.flipper.rotateScaled {
  animation: rotateScaled var(--rotate-open-time) ease forwards;
}

@keyframes rotateScaledBack {
  0% {
    width: var(--scale-w);
    height: var(--scale-h);
    transform: translate(var(--tx), var(--ty)) rotateY(180deg);
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotateY(180deg);
    width: 100%;
    height: 100%;
  }
}

@keyframes flippedBack {
  0% {
    width: 100%;
    height: 100%;
    transform: translate(var(--tx), var(--ty)) rotateY(180deg);
  }
  100% {
    transform: translate(var(--tx), var(--ty)) rotateY(0deg);
    width: 100%;
    height: 100%;
  }
}

.flipper.rotateScaledBack {
  animation: rotateScaledBack var(--rotate-back-time) ease forwards;
}

.flipper.flippedBack {
  animation: flippedBack var(--hideTime-time) ease forwards;
}

.flipper.anchor-top-left {
  left: 0;
  top: 0;
  --tx: 0;
  --ty: 0;
}

.flipper.anchor-top-right {
  left: 100%;
  top: 0;
  --tx: -100%;
  --ty: 0;
}

.flipper.anchor-bottom-left {
  left: 0;
  top: 100%;
  --tx: 0;
  --ty: -100%;
}

.flipper.anchor-bottom-right {
  left: 100%;
  top: 100%;
  --tx: -100%;
  --ty: -100%;
}

.flipper.anchor-center {
  left: 50%;
  top: 50%;
  --tx: -50%;
  --ty: -50%;
}
</style>
