<template>
  <div :class="['custom_bar', 'bartype_' + props.index]" ref="customBarRef" :style="combinedStyle">
    <div class="bar_name" :style="nameStyle">{{ props.name }}</div>
    <div class="bar_progress flex flex-justify-center flex-align-center" :style="barProgressStyle">
      <div class="progress_speed">
        <div class="speed_value" :style="speedValueStyle" />
      </div>
      <sw-count-up
        class="progress_value"
        :style="valueStyle"
        :end="parseFloat(`${props.value}`)"
        :decimals="pointNum"
        :title="props.value"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { SwCountUp } from "@screenwright/ui/SwCountUp";

interface Props {
  max: number;
  name: string;
  value: number;
  index: number;
  option: any;
  dataLength: number;
}

const props = withDefaults(defineProps<Props>(), {
  max: 9000,
  name: "扫一扫",
  value: 0,
  index: 0
});

const customBarRef = ref<HTMLElement | null>(null);
const colorList = ["#eed67c", "#d0d0d0", "#bd8b56", "#1cfeff"];

const pointNum = computed(() => {
  const str = String(props.value);
  return str.indexOf(".") >= 0 ? str.split(".")[1].length : 0;
});

// 样式相关计算属性
const nameStyle = computed(() => ({
  color: props.option.name?.fontColor,
  fontSize: `${props.option.name?.fontSize || 12}px`,
  fontWeight: props.option.name?.fontWeight,
  fontFamily: props.option.name?.fontFamily,
  fontStyle: props.option.name?.fontStyle,
  letterSpacing: `${props.option.name?.letterSpacing || 0}px`,
  textShadow: props.option.name?.isTextShadow
    ? `${props.option.name.textShadow?.color} ${props.option.name.textShadow?.x || 0}px ${
        props.option.name.textShadow?.y || 0
      }px ${props.option.name.textShadow?.blur}px`
    : "none",
  transform: `translate(${props.option.name?.textTranslateX || 0}px, ${props.option.name?.textTranslateY || 0}px)`
}));

const valueStyle = computed(() => ({
  color: props.option.value?.fontColor,
  fontSize: `${props.option.value?.fontSize || 12}px`,
  fontWeight: props.option.value?.fontWeight,
  fontFamily: props.option.value?.fontFamily,
  fontStyle: props.option.value?.fontStyle,
  letterSpacing: `${props.option.value?.letterSpacing || 0}px`,
  textShadow: props.option.value?.isTextShadow
    ? `${props.option.value.textShadow?.color} ${props.option.value.textShadow?.x || 0}px ${
        props.option.value.textShadow?.y || 0
      }px ${props.option.value.textShadow?.blur}px`
    : "none",
  transform: `translate(${props.option.value?.textTranslateX || 0}px, ${props.option.value?.textTranslateY || 0}px)`
}));

const barStyle = computed(() => {
  if (props.option.bar) {
    const num = Math.min(props.option.bar.showNum || 1, props.dataLength);
    return {
      height: `${100 / num}%`
    };
  }

  return {
    height: `${100 / props.dataLength}%`
  };
});

const barProgressStyle = computed(() => {
  if (props.option.bar?.margin) {
    return {
      padding: props.option.bar.margin.map((item: number) => `${item}px`).join(" ")
    };
  }
  return {};
});

const barColor = computed(() => {
  let color = "rgba(255, 255, 255, 0)";
  if (props.option.seriesTabs?.length) {
    props.option.seriesTabs.forEach((item: any) => {
      if (props.name === item.name) {
        color = item.color;
      }
    });
  }
  return color || colorList[props.index] || "#1cfeff";
});

const barWidth = computed(() => props.option.bar?.width || 100);
const barHeight = computed(() => props.option.bar?.height ?? 14);
const showBg = computed(() => (typeof props.option.name?.showBg === "boolean" ? props.option.name.showBg : true));
const showCircle = computed(() =>
  typeof props.option.bar?.showCircle === "boolean" ? props.option.bar.showCircle : true
);

const currentProgress = computed(() => {
  const current = props.value / props.max || 0;
  return `${current * 100}%`;
});

const cssVariables = computed(() => ({
  "--bar-color": barColor.value,
  "--progress": currentProgress.value,
  "--bar-width": `${barWidth.value}%`,
  "--bar-height": `${barHeight.value}px`,
  "--show-circle": showCircle.value ? "block" : "none"
}));

const combinedStyle = computed(() => ({
  ...barStyle.value,
  ...cssVariables.value
}));

const speedValueStyle = computed(() => ({
  height: `${barHeight.value}px`
}));

const initBarNameBgStyle = () => {
  if (typeof showBg.value === "boolean") {
    const elements = customBarRef.value?.getElementsByClassName("bar_name");
    if (elements && elements.length > 0) {
      const el = elements[0] as HTMLElement;
      el.classList.toggle("no-bg", !showBg.value);
    }
  }
};
watch(
  () => showBg.value,
  () => {
    nextTick(() => {
      initBarNameBgStyle();
    });
  }
);

onMounted(() => {
  nextTick(() => {
    initBarNameBgStyle();
  });
});
</script>

<style lang="scss">
@import "./barProgress.scss";
</style>
