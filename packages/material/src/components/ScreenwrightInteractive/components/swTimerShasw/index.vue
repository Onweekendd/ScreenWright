<template>
  <div
    :class="{
      'parts-step': true,
      'component-bind-events': true,
      'has-bind': events?.length && isBuild.value,
      'has-encode': encodes?.length && isBuild.value
    }"
    ref="stepBodyDom"
  >
    <div class="step-layout" :style="{ margin: `0 ${option.margin}px` }">
      <div class="step-list" :style="{ transform: `translateX(-${moveTranslate}%)` }">
        <TimerShaftItem
          v-for="(year, index) in dataList"
          :key="year.value"
          :item="year"
          :index="index"
          :percent-size="percentSize"
          :default-style="styleDefaultFont"
          :active-style="styleActiveFont"
          :is-prewrap="option.isPrewrap"
          @item-click="handleSelect"
        />
      </div>
    </div>
    <TimerShaftControl
      :play-status="playStatus"
      :icon-size="option.iconSize"
      :icon-left="option.iconLeft"
      :arrow-left="option.arrowLeft"
      :arrow-right="option.arrowRight"
      @control-click="onControl"
    />
  </div>
</template>

<script setup lang="ts">
import type { Ref } from "vue";
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import TimerShaftControl from "./components/TimerShaswControl.vue";
// 引入子组件
import TimerShaftItem from "./components/TimerShaswItem.vue";
import { useTimerShaftEvents } from "./hooks/useTimerShaswEvents";
// 引入hooks
import { useTimerShaftState } from "./hooks/useTimerShaswState";
import { useTimerShaftStyle } from "./hooks/useTimerShaswStyle";

defineOptions({
  name: "ftTimerShaft"
});

// 定义props
const props = defineProps<{
  element: ComponentType;
}>();

// 使用基础数据
const { option, dataChart, events, encodes, isBuild, handleEventAndCallbackEvent } = useBaseData(props.element);
const { addEvent } = useActionEvent();

// DOM引用
const stepBodyDom = ref<HTMLElement | null>(null);

// 使用事件处理hook
const eventsManager = useTimerShaftEvents(props.element);

// 定义setActive函数
const setActive = (idx: number, distance?: number, isAutoPlay = false) => {
  // 暂存引用，避免循环依赖

  eventsManager.setActive(dataList, currentSelect, moveTranslate, idx, distance, isAutoPlay);
};

// 使用状态管理hook
const {
  dataList,
  playStatus,
  moveTranslate,
  currentSelect,
  percentSize,
  init: initState,
  initData,
  onControl,
  onSelect,
  cleanup
} = useTimerShaftState({
  element: props.element,
  option,
  dataChart,
  events,
  setActive
});
const handleSelect = (event: Event | null, info: any) => {
  console.log(event, "event");
  if (event) onSelect(event, info);
  // handleEventAndCallbackEvent({
  //   id: props.element.id,
  //   triggerType: EventTypeEnum.Click,
  //   events: props.element.events,

  //   throwValue: info
  // });
};

// 使用样式处理hook
const { styleDefaultFont, styleActiveFont, initStyle } = useTimerShaftStyle({
  option,
  stepBodyDom: stepBodyDom as unknown as Ref<HTMLElement | null>
});

// 初始化方法
const init = () => {
  // 初始化样式
  initStyle();
  // 初始化状态
  initState();
};

// 监听配置
watch(
  () => option.value,
  () => {
    nextTick(() => {
      console.log("option changed", option.value);
      init();
      initData();
    });
  },
  { deep: true }
);

watch(
  () => dataChart.value,
  () => {
    console.log("data changed", dataChart.value);
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,
      throwValue: option.value
    });
  },
  { deep: true }
);

// 监听播放状态
watch(playStatus, (status) => {
  eventsManager.emitPlayStatus(status);
});

// 生命周期
onMounted(() => {
  nextTick(() => {
    init();
    initData();

    // 注册组件事件 - 将handleSelect包装为handleClick
    const handleClick = (throwValue: any) => {
      handleSelect(null, throwValue);
    };

    addEvent({
      [`${interactiveEnum.SwTimerShaft}-${props.element.id}`]: { handleClick }
    });
  });
});

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
.parts-step {
  width: 100%;
  position: relative;
  color: var(--lineBg);
  overflow: hidden;
  .step-layout {
    height: 100%;
    overflow: hidden;
    position: relative;
    mask: linear-gradient(
      to left,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 1) 10%,
      rgba(0, 0, 0, 1),
      rgba(0, 0, 0, 1) 90%,
      rgba(0, 0, 0, 0) 100%
    );
    -webkit-mask: -webkit-linear-gradient(
      to left,
      rgba(0, 0, 0, 0) 0%,
      rgba(0, 0, 0, 1) 10%,
      rgba(0, 0, 0, 1),
      rgba(0, 0, 0, 1) 90%,
      rgba(0, 0, 0, 0) 100%
    );
    &::before {
      content: "";
      width: 100%;
      height: var(--lineHeight);
      background-color: var(--lineBg);
      position: absolute;
      top: 30%;
      transform: translate(0, -50%);
    }
  }
  .step-list {
    width: 100%;
    height: 100%;
    position: relative;
    --defaultSize: 6;
    --ActiveSize: 16;
    transition: transform 0.5s ease;
  }
}
</style>
