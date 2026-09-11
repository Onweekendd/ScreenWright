<template>
  <div class="progress-wrap video-progress" :id="`${element.id}`">
    <div
      ref="barContainer"
      class="progress-bar-container"
      :class="{ 'is-disabled': isDisabled }"
      role="slider"
      :aria-valuemin="0"
      :aria-valuemax="safeTotalTime"
      :aria-valuenow="displayCurrentTime"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
      @pointercancel="handlePointerCancel"
    >
      <div class="progress-track" :style="progressTrackStyle" />
      <div class="progress-buffered" :style="{ width: `${bufferedPercent}%` }" />
      <div class="progress-played" :style="progressPlayedStyle" />
      <div class="progress-dot" :style="{ left: `${activePercent}%` }" />
    </div>

    <div v-if="isShowProgress" class="time-text">
      <span>{{ formatTime(displayCurrentTime) }}</span>
      <span v-if="isShowDivider">/</span>
      <span v-if="isShowTotalProgress">{{ formatTime(safeTotalTime) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { lineargradientHandle } from "@screenwright/core";
import { EncodeEventTypeEnum, EventTypeEnum, InteractiveEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";
import { useActionEvent, useBaseData } from "@screenwright/composables";

interface Props {
  progress?: number;
  currentTime?: number;
  buffered?: number;
  element: ComponentType;
}
const props = withDefaults(defineProps<Props>(), {
  progress: 0,
  buffered: 0
});
const { addEvent } = useActionEvent();

interface SeekPayload {
  time: number;
  progress: number;
}

interface ProgressChangePayload {
  time: number;
  progress: number;
  source: "prop-currentTime" | "prop-progress" | "seek" | "seekStart" | "seekEnd" | "setTotalTime";
}

const { handleEventAndCallbackEvent, handleEncode } = useBaseData(props.element);

const emit = defineEmits<{
  "update:progress": [value: number];
  "update:currentTime": [value: number];
  seek: [payload: SeekPayload];
  seekStart: [payload: SeekPayload];
  seekEnd: [payload: SeekPayload];
  progressChange: [payload: ProgressChangePayload];
}>();

const barContainer = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);
const draftProgress = ref<number | null>(null);
const innerProgress = ref(0);
const innerCurrentTime = ref(0);
const totalTimeSeconds = ref(60);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const safeTotalTime = computed(() => Math.max(0, totalTimeSeconds.value || 0));
const bufferedPercent = computed(() => {
  const bufferedSeconds = Math.max(0, props.buffered || 0);
  if (!safeTotalTime.value) {
    return 0;
  }

  return Number(clamp((bufferedSeconds / safeTotalTime.value) * 100, 0, 100).toFixed(2));
});

const setTotalTime = (seconds: number) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) {
    return;
  }

  totalTimeSeconds.value = Math.max(0, seconds);
  innerCurrentTime.value = clamp(innerCurrentTime.value, 0, safeTotalTime.value);
  innerProgress.value = safeTotalTime.value
    ? Number(((innerCurrentTime.value / safeTotalTime.value) * 100).toFixed(2))
    : 0;

  handleProgressChanged({
    progress: innerProgress.value,
    time: innerCurrentTime.value,
    source: "setTotalTime"
  });
};

const isDisabled = computed(() => {
  return props.element.option.disabled;
});

const displayCurrentTime = computed(() => {
  return innerCurrentTime.value;
});
const progressTrackStyle = computed(() => {
  const defaultColor = props.element.option.defaultColor || "rgba(255, 255, 255, 0.2)";

  return {
    background: `${defaultColor}`
  };
});

const progressPlayedStyle = computed(() => {
  const seriesOpacity = props.element.option.seriesOpacity ?? 1;
  const lineargradientColor = lineargradientHandle(props.element.option.seriesBgColor, seriesOpacity);
  return {
    background: `${lineargradientColor}`,
    width: `${activePercent.value}%`
  };
});

const isShowProgress = computed(() => {
  return props.element.option.isShowProgress;
});
const isShowTotalProgress = computed(() => {
  return props.element.option.isShowTotalProgress;
});
const isShowDivider = computed(() => {
  return props.element.option.isShowDivider;
});

const handleProgressChanged = (payload: ProgressChangePayload) => {
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,
    throwValue: payload
  });
  if (
    props.element.encodes &&
    props.element.encodes.find((encode) => encode.trigger === EncodeEventTypeEnum.VideoControls)
  ) {
    const info = {
      type: "seek",
      value: payload.time,
      label: "videoToFastin"
    };
    handleEncode(info);
  }

  emit("progressChange", payload);
};

const playedPercent = computed(() => {
  return innerProgress.value;
});

const activePercent = computed(() => {
  if (isDragging.value && draftProgress.value !== null) {
    return draftProgress.value;
  }
  return playedPercent.value;
});

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hour = Math.floor(safeSeconds / 3600);
  const min = Math.floor((safeSeconds % 3600) / 60);
  const sec = safeSeconds % 60;

  if (hour > 0) {
    return `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  }

  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
};

const emitSeekState = (progress: number, eventName: "seek" | "seekStart" | "seekEnd") => {
  const currentTime = safeTotalTime.value ? Number(((progress / 100) * safeTotalTime.value).toFixed(2)) : 0;
  innerProgress.value = progress;
  innerCurrentTime.value = currentTime;

  handleProgressChanged({
    progress,
    time: currentTime,
    source: eventName
  });

  emit("update:progress", progress);
  emit("update:currentTime", currentTime);

  const payload = { progress, time: currentTime };
  if (eventName === "seek") {
    emit("seek", payload);
    return;
  }

  if (eventName === "seekStart") {
    emit("seekStart", payload);
    return;
  }

  emit("seekEnd", payload);
};

const getEventClientX = (event: PointerEvent) => event.clientX;

const calcProgressByEvent = (event: PointerEvent) => {
  if (!barContainer.value) {
    return null;
  }

  const rect = barContainer.value.getBoundingClientRect();
  if (!rect.width) {
    return 0;
  }

  const percent = ((getEventClientX(event) - rect.left) / rect.width) * 100;
  return Number(clamp(percent, 0, 100).toFixed(2));
};

const capturePointer = (event: PointerEvent) => {
  const currentTarget = event.currentTarget;
  if (currentTarget instanceof HTMLElement && !currentTarget.hasPointerCapture(event.pointerId)) {
    currentTarget.setPointerCapture(event.pointerId);
  }
};

const releasePointer = (event: PointerEvent) => {
  const currentTarget = event.currentTarget;
  if (currentTarget instanceof HTMLElement && currentTarget.hasPointerCapture(event.pointerId)) {
    currentTarget.releasePointerCapture(event.pointerId);
  }
};

const handlePointerDown = (event: PointerEvent) => {
  if (isDisabled.value) {
    return;
  }

  event.preventDefault();
  capturePointer(event);

  const progress = calcProgressByEvent(event);
  if (progress === null) {
    return;
  }

  isDragging.value = true;
  draftProgress.value = progress;
  // emitSeekState(progress, "seekStart");
};

const handlePointerMove = (event: PointerEvent) => {
  if (!isDragging.value) {
    return;
  }

  event.preventDefault();
  const progress = calcProgressByEvent(event);
  if (progress === null) {
    return;
  }

  draftProgress.value = progress;
  // emitSeekState(progress, "seek");
};

const finishDrag = (event: PointerEvent) => {
  if (!isDragging.value) {
    return;
  }

  event.preventDefault();
  const progress = calcProgressByEvent(event) ?? draftProgress.value ?? playedPercent.value;
  const normalized = Number(clamp(progress, 0, 100).toFixed(2));
  emitSeekState(normalized, "seekEnd");
  draftProgress.value = null;
  isDragging.value = false;
  releasePointer(event);
};

const handlePointerUp = (event: PointerEvent) => finishDrag(event);
const handlePointerCancel = (event: PointerEvent) => finishDrag(event);

onMounted(() => {
  addEvent({
    [`${InteractiveEnum.videoProgress}-${props.element.id}`]: {
      setTotalTime: (seconds: number) => {
        setTotalTime(seconds);
      }
    }
  });
});
defineExpose({
  setTotalTime
});
</script>

<style lang="scss" scoped>
.progress-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  user-select: none;
  -webkit-user-select: none;
}

.progress-bar-container {
  position: relative;
  width: 100%;
  height: 16px;
  border-radius: 999px;
  cursor: pointer;
  overflow: visible;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;

  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.progress-track {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, #2a3142 0%, #1f2433 100%);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.progress-buffered {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.2) 0%, rgba(233, 238, 255, 0.4) 100%);
  border-radius: inherit;
  z-index: 1;
}

.progress-played {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: inherit;
  z-index: 2;
}

.progress-dot {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 24px;
  background: #fff;
  border: 2px solid #2f7bff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  box-shadow: 0 4px 16px rgba(13, 30, 76, 0.35);
  transition: transform 0.2s ease;
}

.progress-bar-container:hover .progress-dot {
  transform: translate(-50%, -50%) scale(1.16);
}

.time-text {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  line-height: 1;
  color: #a8b0c2;
  letter-spacing: 0.3px;
  user-select: none;
  -webkit-user-select: none;
}
</style>
