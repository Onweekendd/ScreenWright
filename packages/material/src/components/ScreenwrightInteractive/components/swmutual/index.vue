<!-- 交互组件 -->
<template>
  <div class="ft-mutual" :style="mutualStyle">
    <div
      :class="{
        'default-mutual': true,
        hasHover: option.isHovered,
        ...componentClasses
      }"
      ref="mutualRef"
      :style="[styleFont, styleTransform]"
      @click.stop="(handleClick(dataChart[0], EventTypeEnum.Click), handleEncode(dataChart[0]))"
      @contextmenu.prevent="(handleClick(dataChart[0], EventTypeEnum.ContextmenuClick), handleEncode(dataChart[0]))"
      @mouseenter="handleMouseEvent(dataChart[0], EventTypeEnum.MouseEnter)"
      @mouseleave="handleMouseEvent(dataChart[0], EventTypeEnum.MouseLeave)"
    >
      <!-- 显示标签文本，支持位置偏移 -->
      <span
        :style="{
          transform: `translate(${option.textTranslateX || 0}px, ${option.textTranslateY || 0}px)`
        }"
        v-html="dataChart[0]?.label || ''"
        :data-translate="dataChart[0]?.label || ''"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";
import { sleep } from "@screenwright/core";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

defineOptions({
  name: "ftMutual"
});

const props = defineProps<{
  element: ComponentType;
}>();

const { option, dataChart, componentClasses, handleEncode, handleEventAndCallbackEvent } = useBaseData(props.element);

// const { handleEventAndCallbackEvent } = useEvent()

const { addEvent } = useActionEvent();

/**
 * 响应式状态定义
 * - mutualRef: 互动元素的DOM引用
 * - touchStyle: 点击时的样式配置
 * - touchTimer: 点击效果的定时器
 * - eventStatus: 事件状态标志，防止重复触发
 */
const mutualRef = ref<HTMLElement | null>(null);
const touchStyle = ref<{
  hoverFontColor?: string;
  hoverFontSize?: number;
  hoverFontFamily?: string;
  hoverBgImage?: string;
} | null>(null);
const touchTimer = ref<number | null>(null);
const eventStatus = ref<boolean>(false);

/**
 * 计算互动组件的基础样式
 * 根据配置决定鼠标指针样式
 */
const mutualStyle = computed<CSSProperties>(() => {
  return {
    cursor: option.value.isCursorPointer ? "pointer" : "default"
  };
});

/**
 * 计算字体样式
 * 根据当前是否处于触摸状态，应用不同的样式配置
 */
const styleFont = computed<CSSProperties>(() => {
  return {
    color: touchStyle.value ? touchStyle.value.hoverFontColor : option.value.fontColor,
    fontSize: `${(touchStyle.value ? touchStyle.value.hoverFontSize : option.value.fontSize) || 0}px`,
    fontFamily: touchStyle.value ? touchStyle.value.hoverFontFamily : option.value.fontFamily,
    backgroundImage: `url(${setMinioUrl(option.value.bgImage, true)})`
  };
});

/**
 * 计算变换样式
 * 应用旋转和倾斜变换效果
 */
const styleTransform = computed<CSSProperties>(() => {
  return {
    transform: `rotateX(${option.value.rotateX || 0}deg)
                rotateY(${option.value.rotateY || 0}deg)
                rotateZ(${option.value.rotateZ || 0}deg)
                skewX(${option.value.skewX || 0}deg)
                skewY(${option.value.skewY || 0}deg)`
  };
});

/**
 * 计算悬停样式
 * 当isHovered为true时应用的样式
 */
const styleHoverFont = computed<CSSProperties>(() => {
  return option.value.isHovered
    ? {
        color: option.value.hoverFontColor,
        fontSize: `${option.value.hoverFontSize || 24}px`,
        fontFamily: option.value.hoverFontFamily,
        background: `url(${setMinioUrl(option.value.hoverBgImage, true)})`
      }
    : {};
});

/**
 * 处理点击事件
 * @param info - 点击的数据信息
 */
const handleClick = async (info: any, type: EventTypeEnum) => {
  // 防止事件重复触发
  if (eventStatus.value) return;
  eventStatus.value = true;
  setClickBubble();

  handleEventAndCallbackEvent({
    throwValue: info,
    events: props.element.events,
    isExecuteOnlyConditionSatisfied: false,
    triggerType: type,
    id: props.element.id
  });

  // 处理事件和回调
  // handleEventAndCallbackEvent(props.element, info, isMsg, type)

  // 如果配置了点击气泡效果，添加气泡动画
  if (option.value.isClickBubble && mutualRef.value) {
    // 获取适用于当前浏览器的动画结束事件类型
    const eventType = getAnimationType(mutualRef.value as HTMLElement);
    mutualRef.value.classList.add("has-bubble");

    // 动画结束后移除气泡样式
    const handleAnimationEnd = () => {
      if (!mutualRef.value) return;
      mutualRef.value.removeEventListener(eventType, handleAnimationEnd);
      mutualRef.value.classList.remove("has-bubble");
    };

    // 监听动画结束事件
    mutualRef.value.addEventListener(eventType, handleAnimationEnd, false);
  }

  // 延迟重置事件状态，防止快速连续点击
  await sleep(500);
  eventStatus.value = false;
};

/**
 * 获取当前浏览器支持的动画结束事件名称
 * @param element - 要检查的DOM元素
 * @returns 适用的动画结束事件名称
 */
const getAnimationType = (element: HTMLElement | null): string => {
  if (!element) return "animationend";

  // 检查浏览器支持的动画前缀
  if ("animation" in element.style) return "animationend";
  if ("WebkitAnimation" in element.style) return "webkitAnimationEnd";
  if ("MozAnimation" in element.style) return "animationend";
  if ("OAnimation" in element.style) return "oAnimationEnd";

  return "animationend";
};

/**
 * 处理鼠标事件（进入和离开）
 * @param type - 事件类型："mouseEnter" 或 "mouseLeave"
 * @param info - 事件相关的数据信息
 */
const handleMouseEvent = (info: any, type: EventTypeEnum) => {
  handleEventAndCallbackEvent({
    throwValue: info,
    events: props.element.events,
    isExecuteOnlyConditionSatisfied: false,
    triggerType: type,
    id: props.element.id
  });
};

/**
 * 设置悬停样式
 * 将计算出的悬停样式应用到CSS变量中
 */
const setHoverStyle = () => {
  if (!mutualRef.value) return;

  // 应用所有悬停样式字段
  const fields = ["color", "fontSize", "fontFamily", "background"];
  fields.forEach((field) => {
    const value = styleHoverFont.value[field as keyof CSSProperties];
    mutualRef.value?.style.setProperty(`--hover-${field}`, typeof value === "string" ? value : "");
  });

  // 特别处理fontSize
  const fontSize = styleHoverFont.value.fontSize;
  mutualRef.value.style.setProperty(`--fontSize`, typeof fontSize === "string" ? fontSize : `${fontSize}px`);
};

/**
 * 设置点击气泡效果
 * 应用气泡样式并设置定时器移除效果
 */
const setClickBubble = () => {
  if (option.value.isClickBubble) {
    // 应用悬停样式作为点击效果
    const { hoverFontColor, hoverFontSize, hoverFontFamily, hoverBgImage } = option.value;
    touchStyle.value = { hoverFontColor, hoverFontSize, hoverFontFamily, hoverBgImage };

    // 清除已有的定时器
    if (touchTimer.value) {
      clearTimeout(touchTimer.value);
    }

    // 设置定时器，1秒后移除点击效果
    touchTimer.value = window.setTimeout(() => {
      touchStyle.value = null;
      if (touchTimer.value) {
        clearTimeout(touchTimer.value);
        touchTimer.value = null;
      }
    }, 1000);
  }
};

/**
 * 监听数据变化
 * 当图表数据变化时，触发组件回调
 */
watch(
  () => dataChart.value,
  (val) => {
    if (val && val.length > 0) {
      handleEventAndCallbackEvent({
        throwValue: val[0],
        events: props.element.events,
        isExecuteOnlyConditionSatisfied: false,
        triggerType: EventTypeEnum.DataChange,
        id: props.element.id
      });
    }
  },
  { immediate: true }
);

/**
 * 监听悬停状态的变化
 * 当isHovered变为true时设置悬停样式
 */
watch(
  () => option.value.isHovered,
  (val) => {
    if (val) {
      setHoverStyle();
    }
  }
);

const opacity = computed(() => {
  return option.value.opacity === undefined ? 1 : option.value.opacity;
});

/**
 * 组件挂载时的生命周期钩子
 * 初始化悬停样式
 */
onMounted(() => {
  setHoverStyle();

  addEvent({
    [`${interactiveEnum.FtMutual}-${props.element.id}`]: {
      handleClick: (info: any) => {
        handleClick(info, EventTypeEnum.Click);
      }
    }
  });
});

/**
 * 组件卸载前的生命周期钩子
 * 清理定时器和状态
 */
onBeforeUnmount(() => {
  if (touchTimer.value) {
    clearTimeout(touchTimer.value);
    touchTimer.value = null;
  }
  eventStatus.value = false;
});
</script>

<style lang="scss" scoped>
.ft-mutual {
  height: 100%;
  width: 100%;
  opacity: v-bind(opacity) !important;

  .default-mutual {
    height: 100%;
    text-align: center;
    background-repeat: no-repeat;
    background-size: 100% 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
    /* CSS变量，用于悬停效果 */
    --hover-color: rgba(255, 255, 255, 1);
    --hover-fontSize: 16px;
    --hover-fontFamily: "sans-serif";
    --hover-background: none;
    --bubbleSize: 250px;
    transition: all 1s linear;

    /* 悬停效果 */
    &.hasHover:hover {
      color: var(--hover-color) !important;
      font-size: var(--hover-fontSize) !important;
      font-family: var(--hover-fontFamily) !important;
      background-image: var(--hover-background) !important;
    }

    /* 点击气泡效果 */
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
      /* 气泡动画关键帧 */
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
}
</style>
