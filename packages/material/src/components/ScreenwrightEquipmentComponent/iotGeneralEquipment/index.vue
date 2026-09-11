<template>
  <div class="iot-general-equipment" :style="mutualStyle">
    <div
      :class="{
        'default-mutual': true,
        ...componentClasses,
        hasHover: option.isHovered
      }"
      ref="mutual"
      :style="[styleFont, styleTransform]"
      @click.stop="(handleClick(dataChart[0]), handleEncodes(dataChart[0]))"
      @contextmenu.prevent="(handleClick(dataChart[0], 'contextmenuClick'), handleEncodes(dataChart[0]))"
      @mouseenter="handleMouseEvent('mouseEnter', dataChart[0])"
      @mouseleave="handleMouseEvent('mouseLeave', dataChart[0])"
    >
      <span
        :style="{
          transform: `translate(${option.textTranslateX || 0}px, ${option.textTranslateY || 0}px)`
        }"
        >{{ getLabel(dataChart[0]) }}</span
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { useGeneral } from "./useGeneral";

interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const {
  option,
  dataChart,
  componentClasses,
  mutualStyle,
  styleFont,
  styleTransform,
  styleHoverFont,
  touchTimer,
  eventStatus,
  encodeStatus,
  iotConfig,
  getLabel,
  setClickBubble,
  handleEventAndCallbackEvent,
  handleEncode,
  getAnimationType,
  sendIotMessage
} = useGeneral(props.element);
const mutual = ref<HTMLDivElement | null>(null);

const setHoverStyle = async () => {
  await nextTick();
  const fields = ["color", "fontSize", "fontFamily", "background"];
  fields.forEach((field) => {
    if (mutual.value !== null) {
      mutual.value.style.setProperty(`--hover-${field}`, styleHoverFont.value[field] || "");
    }
  });
  (mutual.value as HTMLDivElement).style.setProperty(`--fontSize`, `${styleHoverFont.value.fontSize}px`);
};

const handleClick = async (info: any, type = "click") => {
  if (eventStatus.value) return;

  eventStatus.value = true;
  setClickBubble();
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: type == "click" ? EventTypeEnum.Click : EventTypeEnum.ContextmenuClick,
    events: props.element.events,

    throwValue: info
  });
  if (mutual.value && props.element.option.isClickBubble) {
    const eventType = getAnimationType(mutual.value as HTMLDivElement);
    mutual.value.classList.add("has-bubble");
    const handleAnimationEnd = () => {
      if (mutual.value) {
        mutual.value.removeEventListener(eventType, handleAnimationEnd);
        mutual.value.classList.remove("has-bubble");
      }
    };

    mutual.value.addEventListener(eventType, handleAnimationEnd, false);
  }

  handleIotMessageEnd();

  await sleep(500);
  eventStatus.value = false;
};

const handleEncodes = async (info: any) => {
  if (encodeStatus.value) return;
  encodeStatus.value = true;
  handleEncode(info);
  await sleep(500);
  encodeStatus.value = false;
};

const handleIotMessageEnd = async () => {
  await sendIotMessage({
    params: {
      ...iotConfig.value,
      ...iotConfig.value?.params
    }
  });
};
const handleMouseEvent = (eventType: string, info: any) => {
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: eventType == "mouseEnter" ? EventTypeEnum.MouseEnter : EventTypeEnum.MouseLeave,
    events: props.element.events,

    throwValue: info
  });
};

watch(
  () => dataChart.value,
  (val) => {
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.DataChange,
      events: props.element.events,

      throwValue: val[0]
    });
  }
);

watch(
  () => option.value.isHovered,
  (val) => {
    if (val) setHoverStyle();
  }
);

onMounted(() => {
  setHoverStyle();
});

onBeforeUnmount(() => {
  clearTimeout(touchTimer.value as NodeJS.Timeout);
  eventStatus.value = false;
  encodeStatus.value = false;
});
</script>

<style lang="scss" scoped>
.iot-general-equipment {
  width: 100%;
  height: 100%;
}
.default-mutual {
  height: 100%;
  text-align: center;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  display: flex !important;
  align-items: center;
  justify-content: center;
  --hover-color: rgba(255, 255, 255, 1);
  --hover-fontSize: 16px;
  --hover-fontFamily: "sans-serif";
  --hover-background: none;
  --bubbleSize: 250px;
  transition: all 1s linear;

  &.hasHover:hover {
    color: var(--hover-color) !important;
    font-size: var(--hover-fontSize) !important;
    font-family: var(--hover-fontFamily) !important;
    background-image: var(--hover-background) !important;
  }
  &.has-bubble::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(rgba(255, 255, 255, 0.2) 10%, rgba(255, 255, 255, 0.1), transparent);
    transform: translate(-50%, -50%);
    transform-origin: center;
    animation: bubbleAni 0.5s ease-in;
    @keyframes bubbleAni {
      0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
      }
      50% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(1.5);
        opacity: 0;
      }
    }
  }
}
</style>
