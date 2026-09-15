<template>
  <div class="ft-swiperCard" :style="styleSizeName">
    <div
      :class="{
        contentBox: true,
        ...componentClasses
      }"
    >
      <div ref="carouselRef" class="carousel" @mouseenter="mouseenter" @mouseleave="mouseleave" @mousemove="mousemove">
        <template v-if="option.globalConfig.controlBtnShow">
          <ControlButton
            v-for="direction in ['l', 'r']"
            :key="direction"
            :direction="direction"
            v-bind="getControlButtonProps(direction)"
            @click="handleClick(direction)"
          />
        </template>

        <figure :id="`${uid}-spinner`" class="spinner">
          <SpinnerItem
            v-for="(item, index) in styleList"
            :key="`spinner-item-${index}`"
            :uid="uid"
            :item="item"
            :index="index"
            :transitionTime="transitionTime"
            :is-active="activeSpinnerIndex === index"
            :item-style="item"
            :data-item="dataChartItemList[index]"
            :card-item="option.cardList[index]"
            @click="handleClickSpinner"
          />
        </figure>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { isArray } from "lodash-es";

import { MediaEnum as mediaEnum } from "@screenwright/types";
import { useActionEvent } from "@screenwright/composables";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import ControlButton from "./components/ControlButton.vue";
import SpinnerItem from "./components/SpinnerItem.vue";
import { useSwiperCard } from "./useSwiperCard";

defineOptions({
  name: "ftSwiperCard"
});
const props = defineProps<{
  element: ComponentType;
}>();

const carouselRef = ref<HTMLElement>();
// 使用基础数据hook
const { addEvent } = useActionEvent();

// 使用轮播卡片hook
const {
  width,
  height,
  dataChart,
  option,
  componentClasses,
  styleSizeName,
  handleEventAndCallbackEvent,
  uid,
  reseting,
  timer,
  clickClockwise,
  styleList,
  activeSpinnerIndex,
  dataChartItemList,
  transitionTime,
  mouseenter,
  mouseleave,
  init,
  handleControlClick,
  handleClickSpinner,
  getControlButtonProps
} = useSwiperCard(props.element);

const mousemove = (e: MouseEvent) => {
  if (carouselRef.value !== null) {
    const rect = (carouselRef.value as HTMLElement).getBoundingClientRect();
    if (e.x > rect.x + rect.width / 2) {
      clickClockwise.value = true;
    } else {
      clickClockwise.value = false;
    }
  }
};

const handleClick = (direction: string) => {
  console.log("handleClick", direction);
  handleControlClick(direction);
  // handleEventAndCallbackEvent({
  //   id: props.element.id,
  //   triggerType: EventTypeEnum.Click,
  //   events: props.element.events,
  //   throwValue: props.element
  // });
};

// 监听宽高变化
watch(
  () => dataChart.value,
  (data) => {
    // 处理数据变化
    if (isArray(data) && data.length > 0) {
      dataChartItemList.value = data;
      reseting.value = true;
      init();
    }
  },
  { deep: true }
);

watch([() => width.value, () => height.value], () => {
  // 处理宽高和配置变化
  reseting.value = true;
  init();
});

watch(
  () => option.value,
  () => {
    // 处理宽高和配置变化
    reseting.value = true;
    init();
  },
  { deep: true, immediate: true }
);

// 组件挂载时初始化
onMounted(() => {
  init();
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: props.element
  });

  // 注册组件事件到全局事件系统
  addEvent({
    [`${mediaEnum.SwSwiperCard}-${props.element.id}`]: {
      handleClick,
      handleEvensChangeActiveSpinnerIndex: async (direction: string) => {
        if (direction === "left") {
          clickClockwise.value = false;
          handleControlClick("l");
        } else if (direction === "right") {
          clickClockwise.value = true;
          handleControlClick("r");
        } else {
          await nextTick();
          const index = props.element.option.cardList.findIndex((item: any) => item.tabsName === direction);
          if (index !== -1) {
            if (index <= (styleList.value.length - 1) / 2) {
              if (
                activeSpinnerIndex.value - index > (styleList.value.length - 1) / 2 ||
                activeSpinnerIndex.value - index < 0
              ) {
                clickClockwise.value = true;
              } else {
                clickClockwise.value = false;
              }
            } else {
              if (activeSpinnerIndex.value !== 0 && activeSpinnerIndex.value <= (styleList.value.length - 1) / 2) {
                if (
                  activeSpinnerIndex.value - index > (styleList.value.length - 1) / 2 ||
                  activeSpinnerIndex.value - index < 0
                ) {
                  clickClockwise.value = true;
                } else {
                  clickClockwise.value = false;
                }
              } else {
                if (activeSpinnerIndex.value !== 0 && activeSpinnerIndex.value <= (styleList.value.length - 1) / 2) {
                  if (
                    activeSpinnerIndex.value - index > (styleList.value.length - 1) / 2 ||
                    activeSpinnerIndex.value - index < 0
                  ) {
                    clickClockwise.value = true;
                  } else {
                    clickClockwise.value = false;
                  }
                } else {
                  if (activeSpinnerIndex.value > 0) {
                    if (
                      activeSpinnerIndex.value - index > (styleList.value.length - 1) / 2 ||
                      activeSpinnerIndex.value - index < 0
                    ) {
                      clickClockwise.value = true;
                    } else {
                      clickClockwise.value = false;
                    }
                  } else {
                    if (
                      activeSpinnerIndex.value - index > (styleList.value.length - 1) / 2 ||
                      activeSpinnerIndex.value - index < 0
                    ) {
                      clickClockwise.value = false;
                    } else {
                      clickClockwise.value = true;
                    }
                  }
                }
              }
              console.log(index, "indexindex", clickClockwise.value);
            }
            handleClickSpinner(null, null, index);
          }
        }
      }
    }
  });
});

onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
});
</script>

<style lang="scss" scoped>
.ft-swiperCard {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;

  .contentBox {
    width: 100%;
    height: 100%;

    .carousel {
      width: 100%;
      height: 100%;
      perspective: 2000px;
      figure.spinner {
        z-index: 1;
        transform-style: preserve-3d;
        width: 100%;
        height: 100%;
        transform: translateZ(0px) matrix3d(1, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1, 0, 0, 0, -2088.06, 1) translate(0%, 0%)
          rotateX(0deg) rotateY(0deg) rotateZ(0deg);
      }
    }
  }
}
</style>
