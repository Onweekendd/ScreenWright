<template>
  <div class="time-container">
    <section class="time-line-main" ref="timeLineMain" :style="`transform: translateX(${-timeLineScrollLeft}px)`">
      <div
        class="time-line-item"
        :style="{ width: `${stepDistance}px` }"
        v-for="(item, index) in timeLineLength"
        :key="index"
        :id="`time-line-item-${index}`"
      >
        <span>{{ item }}s</span>
        <span class="tag" />

        <div class="time-line-item-sub-left" v-if="index !== 0">
          <span v-for="subIndex in 2" :key="`sub-${index}-${subIndex}`" class="tag" />
        </div>

        <div class="time-line-item-sub-right" v-if="index !== timeLineLength.length - 1">
          <span v-for="subIndex in 2" :key="`sub-${index}-${subIndex}`" class="tag" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import type { AnimationItem } from "../type";
import { useCustomAnimation } from "../useCustomAnimation";

// Props定义
const props = defineProps<{
  maxTime?: number;
  panelId?: number;
  activeStatusId?: string;
}>();

// 使用hooks
const { stepDistance, step, timeLineScrollLeft, selectId, getCurrentAnimationList } = useCustomAnimation();

// 模板引用
const timeLineMain = ref<HTMLDivElement>();

// 计算属性
const timeLineLength = computed((): number[] => {
  let num = Math.ceil(dynamicMaxTime.value / step.value);
  const arr: number[] = [];
  while (num > 0) {
    arr.unshift((num * step.value) / 1000);
    num--;
  }
  arr.unshift(0);
  return arr;
});

const currentAnimation = computed((): AnimationItem | undefined => {
  return animationList.value.find((v) => v.id === selectId.value);
});

const animationList = computed((): AnimationItem[] => {
  return getCurrentAnimationList({
    panelId: props.panelId,
    statusId: props.activeStatusId
  });
});

/**
 * 计算时间轴最大长度
 */
const dynamicMaxTime = computed((): number => {
  let time = props.maxTime || 6000;
  if (currentAnimation.value) {
    const arr = currentAnimation.value.componentSetting.filter((v) => v.animationType && v.duration);
    arr.forEach((v) => (time = Math.max(time, v.delay + v.duration)));
  }
  return time;
});
</script>

<style lang="scss" scoped>
$header-height: 36px;
.time-container {
  width: 100%;
  height: 100%;
  position: relative;

  transform: translateX(-2px);

  // 对齐
  .time-line-main {
    display: flex;
    align-items: flex-end;
    width: 100%;
    height: $header-height;
    box-sizing: border-box;
    background-color: rgb(46, 49, 63);

    position: relative;
    z-index: 2;
    .time-line-item {
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid rgba(13, 7, 7, 0.6);
      row-gap: 2px;
      flex-shrink: 0;
      justify-content: center;
      align-items: center;
      color: #b4b7c1;
      position: relative;
      .tag {
        width: 1px;
        height: 8px;
        background-color: rgba(180, 183, 193, 0.5);
      }

      .time-line-item-sub-left {
        position: absolute;
        bottom: 0;
        transform: translateX(-50%);
        width: 50%;
        height: 4px;
        .tag {
          width: 1px;
          height: 4px;
          background-color: rgba(180, 183, 193, 0.5);
          transform: translate(50%);
          position: absolute;
          right: 40%;

          &:nth-child(2) {
            right: 80%;
          }
        }
      }

      .time-line-item-sub-right {
        position: absolute;
        bottom: 0;
        transform: translateX(50%);
        width: 50%;
        height: 4px;
        .tag {
          width: 1px;
          height: 4px;
          background-color: rgba(180, 183, 193, 0.5);
          transform: translate(-50%);
          position: absolute;
          left: 40%;

          &:nth-child(2) {
            left: 80%;
          }
        }
      }
    }
  }
}
</style>
