<template>
  <div
    class="vertical-card"
    :style="{
      width: targetWidth,
      height: targetHeight
    }"
  >
    <div class="bg-wrapper" :style="blurStyle">
      <CanvasBg :image-list="imageList" ref="canvasBgRef" />
    </div>
    <carousel-3d
      :id="`carousel-3d-${element.id}`"
      :width="carouselWidth"
      :height="carouselHeight"
      :space="space"
      :perspective="perspective"
      ref="carousel3dRef"
      :controlsVisible="controlsVisible"
      :display="display"
      :autoplayHoverPause="autoplayHoverPause"
      :dir="dir"
      @next-click="nextClick"
      @prev-click="prevClick"
      :onMainSlideClick="handleOnMainSlideClick"
    >
      <slide
        :style="{
          borderRadius: borderRadius + 'px'
        }"
        v-for="(slide, i) in slides"
        :index="Number(i)"
        :key="i"
        :class="`carousel-3d-item-${i}`"
        :data-index="i"
      >
        <CanvasImg
          :src="slide.backgroundImg"
          @load="imageLoad"
          :presetCanvasWidth="element.component.width"
          :presetCanvasHeight="element.component.height"
        />
      </slide>
    </carousel-3d>
  </div>
</template>
<script lang="ts" setup>
import { computed, onBeforeUnmount, ref } from "vue";

import { debounce, isUndefined } from "lodash-es";

import { useActionEvent } from "@screenwright/composables";
import { useEvent } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import { ExhibitEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import CanvasBg from "./components/CanvasBg.vue";
import CanvasImg from "./components/CanvasImg.vue";
import Carousel3d from "./components/Carousel3d.vue";
import Slide from "./components/Slide.vue";
import { useAnimationDom } from "./useAnimationDom";
const { addEvent } = useActionEvent();
let props = defineProps<{
  element: ComponentType;
}>();
defineOptions({
  name: "verticalCard"
});
let result = ref<string[]>([]);
const carousel3dRef = ref<InstanceType<typeof Carousel3d> | null>(null);
const canvasBgRef = ref<InstanceType<typeof CanvasBg> | null>(null);
const { downAndScale, setExpandClip, setShrinkClip } = useAnimationDom();
const { handleEventAndCallbackEvent } = useEvent();
let stopCarousel = false; // 停止标志
const slides = computed(() => {
  return props.element.option.cardList.map((v: any) => {
    return {
      ...v,
      backgroundImg: setMinioUrl(v.backgroundImg)
    };
  });
});
const imageList = computed(() => {
  return props.element.option.cardList.map((v: any) => {
    return setMinioUrl(v.coverImg);
  });
});

const display = computed(() => {
  return props.element.option.globalConfig.display;
});

const space = computed(() => {
  return props.element.option.globalConfig.space;
});
const perspective = computed(() => {
  return props.element.option.globalConfig.perspective;
});

const targetWidth = computed(() => {
  return props.element.component.width + "px" || "1920px";
});
const targetHeight = computed(() => {
  return props.element.component.height + "px" || "1080px";
});
const dir = computed(() => {
  return props.element.option.globalConfig.dir;
});

const autoplayHoverPause = computed(() => {
  return props.element.option.globalConfig.autoplayHoverPause;
});

const carouselWidth = computed(() => {
  return props.element.option.globalConfig.width || 400;
});

const carouselHeight = computed(() => {
  return props.element.option.globalConfig.height || 700;
});

const autoplay = computed(() => {
  return props.element.option.globalConfig.autoplay;
});

const controlsVisible = computed(() => {
  return props.element.option.globalConfig.controlsVisible;
});

const autoplayTimeout = computed(() => {
  return props.element.option.globalConfig.autoplayTimeout || 2000;
});

const blur = computed(() => {
  if (isUndefined(props.element.option.globalConfig.blur)) {
    return 10;
  }
  return props.element.option.globalConfig.blur;
});

const animationDuration = computed(() => {
  if (isUndefined(props.element.option.globalConfig.animationDuration)) {
    return 2000;
  }
  return props.element.option.globalConfig.animationDuration;
});

const borderRadius = computed(() => {
  if (isUndefined(props.element.option.globalConfig.borderRadius)) {
    return 20;
  }
  return props.element.option.globalConfig.borderRadius;
});

const blurStyle = computed(() => {
  return {
    filter: `blur(${blur.value}px)`
  };
});

const handleExpandAndShrink = async (target: HTMLElement | null, cardItem: any, element: ComponentType) => {
  if (!carousel3dRef.value) {
    return false;
  }
  let el = carousel3dRef.value.$el as HTMLElement;
  let currentSlide = el.querySelector(`.current`) as HTMLElement;
  let targetIndex = target?.dataset.index;
  let currentSlider = currentSlide?.dataset.index;

  if (targetIndex !== currentSlider) {
    return false;
  } else {
    let end1 = await setExpandClip(target, cardItem, element);
    await sleep(animationDuration.value); // 两个动画之间稍作停顿，避免视觉突兀
    let end2 = await setShrinkClip(target, cardItem, element);
    return end1 && end2;
  }
};

const handleAutoPlay = async () => {
  stopCarousel = true;
  // 等待原有递归完全终止（通过isCarouselRunning判断，比固定sleep更可靠）
  await sleep(100); // 轮询等待，直到递归终止
  stopCarousel = false;
  if (carousel3dRef.value) {
    let el = carousel3dRef.value.$el as HTMLElement;
    let firstSlide = el.querySelector(`.current`) as HTMLElement;

    let currentIndex = carousel3dRef.value?.currentIndex;
    if (isUndefined(currentIndex)) {
      return;
    }
    await sleep(autoplayTimeout.value);
    let res = await handleExpandAndShrink(firstSlide, slides.value[currentIndex], props.element);
    if (autoplay.value && res) {
      await infiniteRecursiveCarousel(el);
    }
  }
};
// const clearElementAnimation = () => {
//   if (!carousel3dRef.value) {
//     return;
//   }
//   let el = carousel3dRef.value.$el as HTMLElement;
//   const target = el.querySelectorAll(`.carousel-3d-slide`);
//   console.log(target, "targettargettarget");
//   let targetList = Array.from(target);
//   for (let i = 0; i < targetList.length; i++) {
//     let targetDom = targetList[i];
//     let classListType = Array.from(targetDom?.classList || []);
//     let animationList = ["moveDown", "expandClip", "shrinkClip"];
//     let isHasAnimation = classListType.some((item) => animationList.includes(item));
//     if (isHasAnimation) {
//       targetDom?.classList.remove(...animationList);
//     }
//   }
// };
const debounceAutoPlay = debounce(async () => {
  await sleep(100);
  handleAutoPlay();
}, 1000);

const nextClick = async (oldIndex: number, newIndex: number) => {
  canvasBgRef.value?.goToIndex(newIndex);
  debounceAutoPlay();
};
const prevClick = async (oldIndex: number, newIndex: number) => {
  canvasBgRef.value?.goToIndex(newIndex);
  debounceAutoPlay();
};

const handleOnMainSlideClick = async ({ index }: { index: number }) => {
  canvasBgRef.value?.goToIndex(index);
  await sleep(1000);
  handleAutoPlay();
};

async function infiniteRecursiveCarousel(el: HTMLElement): Promise<void> {
  if (stopCarousel || !autoplay.value) {
    console.log("轮播停止：", stopCarousel ? "手动停止标志触发" : "自动播放开关关闭");
    return;
  }
  try {
    // 1. 执行轮播切换
    let currentIndex = carousel3dRef.value?.currentIndex;
    if (isUndefined(currentIndex)) {
      return;
    }
    carousel3dRef.value?.goNext();
    let nextIndex = carousel3dRef.value?.currentIndex;
    if (isUndefined(nextIndex)) {
      return;
    }
    canvasBgRef.value?.goToIndex(nextIndex);
    await sleep(autoplayTimeout.value);
    // 2. 获取当前索引和当前幻灯片元素

    let firstSlide = el.querySelector(`.current`) as HTMLElement;

    // 3. 执行展开收缩动画，获取结果
    let res = await handleExpandAndShrink(firstSlide, slides.value[nextIndex], props.element);

    // 4. 只有动画执行成功（res为true），才继续递归执行下一轮（实现无限循环）
    if (res) {
      await infiniteRecursiveCarousel(el);
    } else {
      console.log("动画执行失败，停止无限轮播");
    }
  } catch (error) {
    console.error("无限轮播过程中发生错误：", error);
    // 异常后可选：延时重试，避免错误导致直接终止无限循环
    await sleep(2000);
    await infiniteRecursiveCarousel(el);
  }
}

const imageLoad = async (payLoad: any) => {
  result.value.push(payLoad);
  if (result.value.length === slides.value.length) {
    if (carousel3dRef.value) {
      let el = carousel3dRef.value.$el as HTMLElement;
      await downAndScale(el, slides.value[0], props.element);
      el.style.opacity = "1";
      handleEventAndCallbackEvent({
        id: props.element.id,
        triggerType: EventTypeEnum.DataChange,
        events: props.element.events,
        throwValue: slides.value
      });
      console.log("注册垂直卡片组件全局事件");
      addEvent({
        [`${ExhibitEnum.verticalCard}-${props.element.id}`]: {
          handleClick: (direction: string) => {
            console.log("点击事件触发", direction);
          },
          handleEvensChangeActiveSpinnerIndex: async (direction: string) => {
            if (direction === "left" || direction === "right") {
              if (!carousel3dRef.value || !canvasBgRef.value) {
                return;
              }
              if (direction === "left") {
                carousel3dRef.value.goNext();
              } else if (direction === "right") {
                carousel3dRef.value.goPrev();
              }
              let currentIndex = carousel3dRef.value?.currentIndex;
              if (!isUndefined(currentIndex)) {
                canvasBgRef.value.goToIndex(currentIndex);
                await sleep(1000);
                handleAutoPlay();
              }
            } else {
              let index = props.element.option.cardList.findIndex((item: any) => item.tabsName === direction);
              if (index !== -1) {
                if (!carousel3dRef.value || !canvasBgRef.value) {
                  return;
                }
                let currentElement = carousel3dRef.value?.$el as HTMLElement;
                const target = currentElement.querySelector(`.current`) as HTMLElement;
                let targetIndex = target?.dataset.index;
                if (targetIndex == index) {
                  return;
                }

                carousel3dRef.value.goSlide(index);
                let currentIndex = carousel3dRef.value.currentIndex;
                canvasBgRef.value.goToIndex(currentIndex);
                await sleep(1000);
                handleAutoPlay();
              }
            }
          }
        }
      });
      await handleAutoPlay();
    }
  }
};
onBeforeUnmount(() => {
  stopCarousel = true; // 设置停止标志，终止无限轮播
});
</script>
<style scoped lang="scss">
.vertical-card {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  position: relative;
  .bg-wrapper {
    width: 100%;
    height: 100%;
    position: absolute;

    top: 0;
    left: 0;
  }
  :deep(.carousel-3d-container) {
    opacity: 0;
    top: 0;
    transition:
      opacity 0.5s ease,
      top 0.5s ease;
  }
  /* 确保当前slide是绝对定位，left/top调整生效 */
  :deep(.current) {
    position: absolute;
    transform-origin: center center; /* 额外保障：动画变换原点为中心 */
  }
}
</style>
<style>
.moveDown {
  /* 第一阶段：仅下滑 */
  animation: moveDown 1s cubic-bezier(0.215, 0.61, 0.355, 1) 0s forwards;
}
.expandClip {
  animation: expandClip 4s ease-in-out 0s forwards;
}
.shrinkClip {
  /* 保持动画时长和缓动函数，确保过渡平滑 */
  animation: shrinkClip 4s ease-in-out 0s forwards;
}
@keyframes moveDown {
  0% {
    top: -100%;
    opacity: 0;
  }
  100% {
    top: 0;
    opacity: 1;
  }
}
@keyframes expandClip {
  0% {
    left: 0px;
    top: 0px;
    width: v-bind(carouselWidth + "px");
    height: v-bind(carouselHeight + "px");
  }
  100% {
    width: v-bind(targetWidth);
    height: v-bind(targetHeight);
    /* 放大后：中心坐标 = left + width/2 = -760 + 1920/2 = 200px；top + height/2 = -190 + 1080/2 = 350px */
    left: calc((v-bind(targetWidth) - v-bind(carouselWidth + "px")) / 2 * -1);
    top: calc((v-bind(targetHeight) - v-bind(carouselHeight + "px")) / 2 * -1);
  }
}
@keyframes shrinkClip {
  0% {
    /* 初始状态（放大后的状态）：中心坐标固定为 (200px, 350px) */
    width: v-bind(targetWidth);
    height: v-bind(targetHeight);
    left: calc((v-bind(targetWidth) - v-bind(carouselWidth + "px")) / 2 * -1); /* -760px */
    top: calc((v-bind(targetHeight) - v-bind(carouselHeight + "px")) / 2 * -1); /* -190px */
  }
  100% {
    /* 结束状态：宽高缩小为原始尺寸，同步调整left/top保持中心不变 */
    width: v-bind(carouselWidth + "px");
    height: v-bind(carouselHeight + "px");
    /* 核心计算：left = 中心横坐标 - 结束宽度/2 = 200px - 400px/2 = 0px */
    left: 0px;
    /* 核心计算：top = 中心纵坐标 - 结束高度/2 = 350px - 700px/2 = 0px */
    top: 0px;
  }
}
</style>
