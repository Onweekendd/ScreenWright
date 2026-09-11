<template>
  <div
    :class="{
      imagesList3d: true,
      ...componentClasses
    }"
    :style="{ ...styleSizeName, ...styleDrap }"
  >
    <div
      :class="{
        'drag-container': true
      }"
      :style="styleContainer"
      ref="dragCarousel"
    >
      <div :class="['spin-container', option.rotateDirection > 0 ? '' : 'spin']" ref="spinCarousel" :style="styleSpin">
        <div
          :class="['spin-point', 'spin-point-' + item.id]"
          :style="styleSpinPoint"
          v-for="(item, index) in option.seriesTabsList"
          :key="item.id"
          @click.stop="handleClick(item, $event)"
        >
          <div
            class="point-box"
            :style="{ transform: `scale(${current === item.id ? option.activeObj.scaleZoom || 0 : 1})` }"
          >
            <video v-if="item.type === 'video'" autoplay loop muted>
              <source :src="setMinioUrl(getMinioUrl(item, index))" type="video/mp4" />
            </video>
            <img v-else :src="setMinioUrl(getMinioUrl(item, index))" alt="" />
            <div
              :style="current === item.id ? styleSeriesList.activeFont : styleSeriesList.defaultFont"
              :data-translate="dataChart[index] ? dataChart[index].title : item.defaultObj.title"
            >
              {{ dataChart[index] ? dataChart[index].title : item.defaultObj.title }}
            </div>
            <div
              :style="current === item.id ? styleSeriesList.activeFont2 : styleSeriesList.defaultFont2"
              :data-translate="dataChart[index] ? dataChart[index].content : item.defaultObj.content"
            >
              {{ dataChart[index] ? dataChart[index].content : item.defaultObj.content }}
            </div>
          </div>
        </div>
      </div>
      <div ref="groudBoard" class="ground" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { nextTick, onMounted, watch } from "vue";

import { cloneDeep } from "lodash-es";

import { useActionEvent } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import { ExhibitEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import type { SeriesTabItem } from "./useImageList";
import { useImageList } from "./useImageList";

const { addEvent } = useActionEvent();
const props = defineProps<{
  element: ComponentType;
}>();

const {
  current,
  radius,
  eventStatus,
  animationName,
  dataChart,
  events,
  option,
  componentClasses,
  styleSizeName,
  styleDrap,
  styleContainer,
  styleSpin,
  styleSpinPoint,
  styleSeriesList,
  getMinioUrl,
  applyTranform,
  playSpin,
  handleEventAndCallbackEvent
} = useImageList(props.element);
const dragCarousel = ref<HTMLDivElement | null>(null);
const spinCarousel = ref<HTMLDivElement | null>(null);
const groudBoard = ref<HTMLDivElement | null>(null);

const handleClick = async (info: any, target: any) => {
  if (!info || info.disabled) return;
  console.log("进行下一步判断", eventStatus.value);
  if (eventStatus.value) return;

  eventStatus.value = true;
  const index = option.value.seriesTabsList.findIndex((a: SeriesTabItem) => a.id == info.id);
  const dataInfo = cloneDeep(dataChart.value[index] || {});
  if (current.value === info.id) {
    dataInfo.id = null;
    current.value = null;
  } else {
    current.value = info.id;
  }

  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: events.value,

    throwValue: { ...info.defaultObj, ...dataInfo.value, id: info.id }
  });

  setDragContentCenter(target.currentTarget);
  await sleep(500);
  eventStatus.value = false;
};

const setDragContentCenter = async (target: any) => {
  await nextTick();
  console.log(spinCarousel.value, dragCarousel.value, "setDragContentCenter 旋转判断");
  if (spinCarousel.value === null) return;
  if (dragCarousel.value === null) return;

  const animation = !animationName.value ? (spinCarousel.value.getAnimations()[0] as any).animationName : null;
  const rotateY = target.style.transform.match(/rotateY\(\d{1,3}(\.\d+)?deg\)/)[0];
  const rotateYVal = rotateY.slice(8, -1);
  dragCarousel.value.style.transition = "transform .5s ease";
  dragCarousel.value.style.transform = `rotateX(${option.value.rotateX}deg)
                            rotateY(-${rotateYVal})
                            rotateZ(${option.value.rotateZ}deg)
                            translateX(${option.value.translateX}px)
                            translateY(${option.value.translateY}px)
                            translateZ(${option.value.translateZ}px)`;
  if (animation) animationName.value = animation;
  spinCarousel.value.style.animationName = "none";
  await sleep(option.value.durationOfStay ? option.value.durationOfStay * 1000 : 2000);
  spinCarousel.value.style.animationName = animationName.value;
};

const initCarousel = (delayTime: number) => {
  if (spinCarousel.value === null) return;
  const aEle = spinCarousel.value.querySelectorAll(".spin-point");
  for (let i = 0; i < aEle.length; i++) {
    (aEle[i] as HTMLDivElement).style.transform =
      "rotateY(" + i * (360 / aEle.length) + "deg) translateZ(" + option.value.radius + "px)";
    (aEle[i] as HTMLDivElement).style.transition = "transform 1s";
    (aEle[i] as HTMLDivElement).style.transitionDelay = `${delayTime || (aEle.length - i) / 4} s`;
  }
};
const setCarouselCard = (initTime?: number) => {
  const positionObj = {
    sX: 0,
    sY: 0,
    nX: 0,
    nY: 0,
    desX: 0,
    desY: 0,
    tX: 0,
    tY: 10
  };

  setTimeout(initCarousel, initTime || 1000);
  if (dragCarousel.value === null) return;
  if (spinCarousel.value === null) return;
  if (groudBoard.value === null) return;

  groudBoard.value.style.width = `${radius.value * 3}px`;
  groudBoard.value.style.height = `${radius.value * 3}px`;

  // 为 dragCarousel.value 添加 timer 属性的类型声明
  interface DragCarouselElement extends HTMLDivElement {
    timer?: NodeJS.Timeout;
  }
  const dragElement = dragCarousel.value as DragCarouselElement;

  dragElement.parentNode?.addEventListener("pointerdown", function (e: Event) {
    const pointerEvent = e as PointerEvent;
    if (dragElement.timer) {
      clearInterval(dragElement.timer);
    }

    const startX = pointerEvent.clientX;
    const startY = pointerEvent.clientY;

    const handlePointerMove = function (e: PointerEvent) {
      if ((e.target as HTMLElement).parentElement?.parentElement?.className === "spin-point") return;

      const newX = e.clientX;
      const newY = e.clientY;
      positionObj.desX = newX - startX;
      positionObj.desY = newY - startY;
      positionObj.tX += positionObj.desX * 0.1;
      positionObj.tY += positionObj.desY * 0.1;

      if (dragElement) {
        applyTranform(dragElement);
      }
      positionObj.sX = newX;
      positionObj.sY = newY;
    };

    const handlePointerUp = function (e: PointerEvent) {
      if ((e.target as HTMLElement).parentElement?.parentElement?.className === "spin-point") {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerup", handlePointerUp);
        return;
      }

      dragElement.timer = setInterval(function () {
        positionObj.desX *= 0.95;
        positionObj.desY *= 0.95;
        positionObj.tX += positionObj.desX * 0.1;
        positionObj.tY += positionObj.desY * 0.1;
        if (dragElement) {
          applyTranform(dragElement);
        }
        playSpin(spinCarousel.value as HTMLDivElement, false);
        if (Math.abs(positionObj.desX) < 0.5 && Math.abs(positionObj.desY) < 0.5) {
          if (dragElement.timer) {
            clearInterval(dragElement.timer);
          }
          playSpin(spinCarousel.value as HTMLDivElement, true);
        }
      }, 17);

      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  });

  // 使用 WheelEvent 替代已废弃的 mousewheel
  dragElement.parentNode?.addEventListener("wheel", function (e: Event) {
    const wheelEvent = e as WheelEvent;
    wheelEvent.preventDefault();
    const d = wheelEvent.deltaY > 0 ? -1 : 1;
    radius.value += d;
    initCarousel(1);
  });
};

watch(
  () => dataChart.value,
  (val) => {
    if ((val && val.length > 0) || option.value.seriesTabsList.length) {
      const seriesItem = option.value.seriesTabsList[0];
      // 交互-自定义事件-含回调参数 2024-12-4
      // ,
      handleEventAndCallbackEvent({
        id: props.element.id,
        triggerType: EventTypeEnum.DataChange,
        events: events.value,

        throwValue: val[0] || { ...seriesItem.defaultObj }
      });
    }
  },
  { deep: true }
);

watch(
  () => option.value,
  () => {
    setCarouselCard(100);
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  setCarouselCard();
  addEvent({
    [`${ExhibitEnum.ImagesList3d}-${props.element.id}`]: {
      handleEvensChangeActiveSpinnerIndex: (actionSelect: string) => {
        if (spinCarousel.value == null) return;
        console.log(actionSelect, "actionSelect");
        const aEle = spinCarousel.value.querySelector(`.spin-point-${actionSelect}`);
        console.log(aEle, "aEle");
        if (aEle) (aEle as HTMLDivElement).click();
      }
    }
  });
});
</script>

<style lang="scss" scoped>
.default-carousel {
  height: 100%;
  width: 100%;
  position: relative;
}
.imagesList3d {
  overflow: hidden;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  // background: #111;
  perspective: 1000px;
  transform-style: preserve-3d;
  touch-action: none;

  .drag-container,
  .spin-container {
    position: relative;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    margin: auto;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    // -webkit-transform: rotateX(-10deg);
    // transform: rotateX(-10deg);
  }
  .spin-container {
    animation: 60s linear 0s infinite normal none running;
    animation-name: spinRevert;
    &.spin {
      animation-name: spin;
    }
    &:hover {
      animation-play-state: paused !important;
    }
  }

  .drag-container .spin-point {
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    text-align: center;
    // -webkit-box-shadow: 0 0 8px #fff;
    // box-shadow: 0 0 8px #fff;
    -webkit-box-reflect: below 10px linear-gradient(transparent, transparent, #0005);
    & > .point-box,
    .point-box > img,
    .point-box > video {
      width: 100%;
      height: 100%;
    }
  }

  .drag-container .spin-point:hover {
    // -webkit-box-shadow: 0 0 15px #fffd;
    // box-shadow: 0 0 15px #fffd;
    -webkit-box-reflect: below 10px linear-gradient(transparent, transparent, #0007);
  }

  .drag-container p {
    font-family: Serif;
    position: absolute;
    top: 100%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%) rotateX(90deg);
    transform: translate(-50%, -50%) rotateX(90deg);
    color: #fff;
  }

  .ground {
    width: 900px;
    height: 900px;
    position: absolute;
    top: 100%;
    left: 50%;
    -webkit-transform: translate(-50%, -50%) rotateX(90deg);
    transform: translate(-50%, -50%) rotateX(90deg);
    // background: -webkit-radial-gradient(center center, farthest-side , #9993, transparent);
  }
}
@keyframes spin {
  0% {
    -webkit-transform: rotateY(0deg);
    transform: rotateY(0deg);
  }
  100% {
    -webkit-transform: rotateY(360deg);
    transform: rotateY(360deg);
  }
}
@keyframes spinRevert {
  0% {
    -webkit-transform: rotateY(360deg);
    transform: rotateY(360deg);
  }
  100% {
    -webkit-transform: rotateY(0deg);
    transform: rotateY(0deg);
  }
}
</style>
