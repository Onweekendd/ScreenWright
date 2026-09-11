<template>
  <div class="right-animation-main" ref="timeManager" @wheel.self.stop="onwheel">
    <!-- <ProgressLine v-if="animationList.length > 0" :current-animation-props="currentAnimation" /> -->
    <div class="content" ref="contentBox">
      <div class="time-body" ref="timeBody" @wheel="onwheel">
        <div
          class="track-box"
          ref="trackBox"
          :style="`transform: translateX(${-timeLineScrollLeft}px)`"
          v-if="currentAnimation"
        >
          <div class="track" v-for="item in currentAnimation.componentSetting" :key="item.id">
            <TimeController
              :item="item"
              v-if="item.animationType && item.animationType !== 'none' && item.timingFunction !== 'none'"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";

import TimeController from "./components/TimeController.vue";
import type { AnimationItem } from "./type";
import { useCustomAnimation } from "./useCustomAnimation";

// Props定义
defineProps<{ currentAnimation: AnimationItem }>();

// 使用hooks
const { timeLineScrollLeft, setVisibleWidth, step, stepDistance, maxTime, visibleWidth, setStep, onTimeLineScroll } =
  useCustomAnimation();

// 模板引用
const timeManager = ref<HTMLElement>();
const contentBox = ref<HTMLElement>();
const timeBody = ref<HTMLElement>();
const trackBox = ref<HTMLElement>();

// 生命周期
onMounted(() => {
  if (visibleWidth.value === 0 && timeManager.value) {
    const width = timeManager.value.clientWidth;
    setVisibleWidth(width);
  }
});

// 方法
/**
 * 滚轮事件 - 用于缩放时间轴
 */
const onwheel = (e: WheelEvent) => {
  e.stopPropagation();
  e.preventDefault();

  const oldStep = step.value;
  const oldStepDistance = stepDistance.value;
  const oldTotalWidth = (maxTime.value / oldStep + 1) * oldStepDistance;

  const newStep = Math.min(10000, Math.max(100, Math.round(oldStep + e.deltaY)));
  setStep(newStep);

  const newStepDistance = stepDistance.value;
  const newTotalWidth = (maxTime.value / newStep + 1) * newStepDistance;

  if (!timeBody.value) return;

  const cursorX = e.clientX - timeBody.value.getBoundingClientRect().left;

  /* 滚动位置计算公式：
  \[ 
  newScrollLeft = \left(\frac{oldScrollLeft + cursorX}{oldTotalWidth}\right) \times newTotalWidth - cursorX 
  \]
  其中：
  - oldScrollLeft: 当前滚动位置 (timeLineScrollLeft.value)
  - cursorX: 光标相对于时间轴的X坐标
  - oldTotalWidth/newTotalWidth: 缩放前后时间轴总宽度
  */
  const relativePosition = (timeLineScrollLeft.value + cursorX) / oldTotalWidth;
  const newScrollLeft = Math.max(0, relativePosition * newTotalWidth - cursorX);

  const maxScroll = Math.max(0, newTotalWidth - visibleWidth.value);
  onTimeLineScroll(Math.min(maxScroll, newScrollLeft));
};
</script>

<style lang="scss" scoped>
$trackHeight: 36px;
.right-animation-main {
  box-sizing: border-box;
  background-color: rgb(46, 49, 63);
  transform: translateX(0);
  color: #b4b7c1;
  position: relative;
  padding-bottom: 15px;
  min-height: 100%;

  overflow-x: hidden;
  font-size: 12px;
  .content {
    width: 100%;
    height: 100%;
  }
  .time-body {
    width: max-content;
    display: flex;
    flex-direction: column;
    min-height: 100%;
    width: 100%;

    .track-box {
      flex-shrink: 1;
      flex-grow: 1;
      position: relative;

      .track {
        height: $trackHeight;
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
