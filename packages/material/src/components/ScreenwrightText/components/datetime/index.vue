<template>
  <div class="ft-datetime" :style="styleSizeName" ref="main" @click="handleClick">
    <div ref="box" class="flex" :style="styleBox">
      <div :style="styleName">{{ nowDate }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import dayjs from "dayjs";

import { getAlign } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";

import { useBaseData } from "@screenwright/composables";

import { getDayText } from "./../utils";

defineOptions({
  name: "Datetime"
});
const props = defineProps<{ element: ComponentType }>();
const { styleSizeName, option } = useBaseData(props.element);
const date = ref<number>(new Date().getTime());
const timer = ref<NodeJS.Timer | null>(null);

// 计算当前显示的日期时间
const nowDate = computed(() => {
  if (option.value.format === "day") {
    return "星期" + getDayText();
  }
  const format = (option.value.format || "yyyy-MM-dd HH:mm:ss").replace("dd", "DD").replace("yyyy", "YYYY");
  return dayjs(date.value).format(format);
});

// 计算垂直对齐方式
const textAlignVertical = computed(() => {
  return getAlign(option.value.textAlignVertical);
});

// 计算文本样式
const styleName = computed(() => ({
  width: "100%",
  fontFamily: option.value.fontFamily || "Source Han Sans CN-Normal, Source Han Sans CN",
  fontSize: `${option.value.fontSize}px`,
  color: option.value.color || "rgba(255, 255, 255, 1)",
  fontWeight: option.value.fontWeight || "normal",
  fontStyle: option.value.fontStyle || "normal",
  letterSpacing: `${option.value.split}px`,
  textIndent: `${option.value.split}px`,
  backgroundColor: option.value.backgroundColor
}));

// 计算容器样式
const styleBox = computed(() => ({
  width: "100%",
  height: "100%",
  textAlign: option.value.textAlign || "center",
  alignItems: textAlignVertical.value
}));

// 处理点击事件
const handleClick = () => {
  // props.clickFormatter?.({
  //   data: dataChart.value
  // })
};

// 组件挂载时启动定时器
onMounted(() => {
  timer.value = setInterval(() => {
    date.value = new Date().getTime();
  }, 1000);
});

// 组件卸载前清除定时器
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value);
  }
});
</script>

<style scoped lang="scss">
.ft-datetime {
  width: 100%;
  height: 100%;
}
</style>
