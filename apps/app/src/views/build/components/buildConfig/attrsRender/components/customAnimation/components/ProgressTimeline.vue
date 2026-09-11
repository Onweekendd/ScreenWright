<template>
  <section
    v-if="processLineTranslate > animationEditorWidth"
    class="progress-line"
    @mousedown="onMousedown"
    :style="{ transform: `translateX(${processLineTranslate}px)` }"
  >
    <div class="time-indicator">
      <div class="time-line-item">
        <span class="text"
          >{{ Number.isInteger(progressTime / 1000) ? progressTime / 1000 : (progressTime / 1000).toFixed(1) }}s</span
        >
        <span class="tag" />
      </div>
    </div>

    <div class="line" />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import type { AnimationItem } from "../type";
import { useCustomAnimation } from "../useCustomAnimation";
import { distance2Time, time2Distance } from "../util";

interface Props {
  currentAnimation?: AnimationItem;
  animationEditorWidth?: number;
  screenId: number;
  panelId?: number;
  activeStatusId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  animationEditorWidth: 0
});

const { step, stepDistance, progressTime, timeLineScrollLeft, changeProgressTime, isProgressRunning, maxProgressTime } =
  useCustomAnimation();

// 响应式数据
const progressLeft = ref(0);
const startX = ref(0);
const currentX = ref(0);
const startDragProgressLeft = ref(0);
const playTimer = ref<NodeJS.Timeout | null>(null);

const processLineTranslate = computed(() => {
  return progressLeft.value - timeLineScrollLeft.value + props.animationEditorWidth + 0.5;
});

const processLineStartX = computed(() => {
  return stepDistance.value / 2;
});

// 监听器
watch(step, (newVal, oldVal) => {
  if (oldVal && newVal) {
    progressLeft.value = (progressLeft.value - processLineStartX.value) * (oldVal / newVal) + processLineStartX.value;
  }
});

watch(
  () => props.currentAnimation?.id,
  () => {
    stopProgress();
  }
);

// 监听进度运行状态变化
watch(isProgressRunning, (isRunning) => {
  if (isRunning && maxProgressTime.value > 0) {
    startProgress();
  } else {
    stopProgress();
  }
});

// 方法
const onMousedown = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  startX.value = e.screenX;
  currentX.value = e.screenX;
  startDragProgressLeft.value = progressLeft.value;

  document.body.style.cursor = "ew-resize";

  document.addEventListener("mousemove", onMouseMouse);
  document.addEventListener("mouseup", onMouseup);
};

const onMouseMouse = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  currentX.value = e.screenX;
  const distance = currentX.value - startX.value;
  const unitLength = stepDistance.value / (step.value / 100);
  const newProgressLeft = distance + startDragProgressLeft.value;

  if (newProgressLeft < processLineStartX.value) {
    progressLeft.value = processLineStartX.value;
  } else {
    progressLeft.value = Math.round(distance / unitLength) * unitLength + startDragProgressLeft.value;
  }

  changeProgressTime(
    distance2Time({
      distance: progressLeft.value - processLineStartX.value,
      step: step.value,
      stepDistance: stepDistance.value
    })
  );
};

const onMouseup = (e: MouseEvent) => {
  e.stopPropagation();

  startX.value = 0;
  currentX.value = 0;

  document.body.style.cursor = "";

  document.removeEventListener("mousemove", onMouseMouse);
  document.removeEventListener("mouseup", onMouseup);
};

const startProgress = () => {
  stopProgress();
  let currentProgressTime = progressTime.value;

  const stepTime = 10;
  playTimer.value = setInterval(() => {
    currentProgressTime += stepTime;
    changeProgressTime(currentProgressTime);

    const distance = time2Distance({
      time: currentProgressTime,
      step: step.value,
      stepDistance: stepDistance.value
    });
    progressLeft.value = distance + processLineStartX.value;

    // 移除内部时间检查 - 完全依赖外部状态控制
    // 不再自己决定何时停止，由外部状态管理
  }, stepTime);
};

const stopProgress = () => {
  progressLeft.value = processLineStartX.value;
  changeProgressTime(0);

  if (playTimer.value) {
    clearInterval(playTimer.value);
    playTimer.value = null;
  }
};

// 生命周期
onMounted(() => {
  progressLeft.value = processLineStartX.value;
  changeProgressTime(0);

  // addEventListener("onAnimationStartPlay", () => {
  //   if (!currentAnimation.value) return

  //   currentAnimation.value.componentSetting
  //     .filter((componentSetting) => {
  //       const component = getComponentById(componentSetting.id)
  //       if (!component) return false

  //       // 简化判断逻辑：检查组件类型是否为load时返回true
  //       if (componentSetting.type === "load") return true

  //       // 检查动画是否可用：确保delay和duration已定义
  //       return componentSetting.delay !== undefined && componentSetting.duration !== undefined
  //     })
  //     .forEach((component: any) => {
  //       emitEvent(`onPreViewAnimation-${component.id}`, {
  //         componentSetting: component,
  //         animationMaxTime: maxAnimationTime.value
  //       })
  //     })

  //   startProgress()
  // })

  // addEventListener("onAnimationEndPlay", () => {
  //   if (!currentAnimation.value) return

  //   currentAnimation.value.componentSetting.forEach((component: any) => {
  //     emitEvent(`onStopAnimation-${component.id}`)
  //   })

  //   stopProgress()
  // })
});

onBeforeUnmount(() => {
  // offEvent("onAnimationStartPlay")
  // offEvent("onAnimationEndPlay")
  // offEvent("onAnimationTypeChange")
});
</script>

<style lang="scss" scoped>
.progress-line {
  width: 3px;
  height: calc(100% - 9px);

  position: absolute;
  z-index: 100;
  top: 9px;
  cursor: ew-resize;
  display: flex;
  flex-direction: column;
  align-items: center;

  .line {
    width: 1px;
    height: 100%;
    background-color: rgb(95, 156, 255);
  }

  .time-indicator {
    z-index: 100;
    top: 0;
    left: 0;
    font-size: 12px;

    .time-line-item {
      display: flex;
      flex-direction: column;

      flex-shrink: 0;
      justify-content: center;
      align-items: center;
      .text {
        background-color: rgb(95, 156, 255);
        color: #b4b7c1;
        padding: 0px 4px 1px 4px;
        border-radius: 6px;
      }
      .tag {
        width: 1px;
        height: 8px;

        background-color: rgb(95, 156, 255);
      }
    }
  }
}
</style>
