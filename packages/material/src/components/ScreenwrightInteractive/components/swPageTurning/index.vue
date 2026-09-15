<!-- 翻页 -->
<template>
  <div
    :class="{
      'ft-pageTurning': true,
      ...componentClasses
    }"
    :style="styleSizeName"
  >
    <div class="pageStatus">
      <div :style="buttonStyle" class="prevPage btnPage" @click="handleClick('prev')" />
      <div class="pageInfo" :style="pageStyle">
        <span class="fs-18 AlibabaPuHuiTiB" :style="pageIndexStyle">
          {{ option.isText ? currentPage : dataChartItem.pageIndex }}</span
        >
        <span v-if="!option.isText" :style="pageLineStyle">/</span>
        <span v-if="!option.isText" :style="pageTotalStyle">{{ dataChartItem.pageTotal }}</span>
      </div>
      <div :style="buttonStyle" class="nextPage btnPage" @click="handleClick('next')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useIntervalFn } from "@vueuse/core";

import { cloneDeep } from "lodash-es";

import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@material/minioUrl";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

defineOptions({
  name: "ftPageTurning"
});

// 定义类型
interface PageTurningData {
  pageIndex: number;
  pageTotal: number;
  textPage: string[];
  [key: string]: any;
}

// 定义props
const props = defineProps<{
  element: ComponentType;
}>();

// 使用基础数据
const { option, dataChart, events, width, height, componentClasses, handleEventAndCallbackEvent } = useBaseData(
  props.element
);
const { addEvent } = useActionEvent();

// 响应式状态
const dataChartItem = ref<PageTurningData>({
  pageIndex: 1,
  pageTotal: 1,
  textPage: ["分页一"]
});

// 使用vueuse的useIntervalFn替代原生setInterval
const { pause: stopInterval } = useIntervalFn(
  () => {
    handleClick("next");
  },
  1000, // 初始间隔，会在playAnimate中更新
  { immediate: false }
);

// 计算属性
const buttonStyle = computed<CSSProperties>(() => ({
  backgroundImage: `url(${setMinioUrl(option.value.backgroundImage)})`,
  backgroundSize: "100% 100%",
  backgroundRepeat: "no-repeat",
  width: `${option.value.buttonWidth}px`,
  height: `${option.value.buttonHeight}px`
}));

const styleSizeName = computed<CSSProperties>(() => ({
  width: `${width.value}px`,
  height: `${height.value}px`,
  lineHeight: `${height.value}px`
}));

const pageStyle = computed<CSSProperties>(() => ({
  filter: option.value.shadowShow
    ? `drop-shadow(${option.value.shadowColor} ${option.value.shadowX ? option.value.shadowX + "px" : 0} ${
        option.value.shadowY ? option.value.shadowY + "px" : 0
      } ${option.value.shadowFuzzy ? option.value.shadowFuzzy + "px" : 0})`
    : "",
  letterSpacing: `${option.value.letterSpacing}px`
}));

const pageIndexStyle = computed<CSSProperties>(() => ({
  fontFamily: option.value.fontFamily,
  fontSize: `${option.value.fontSize}px`,
  fontWeight: option.value.fontWeight || "normal",
  fontStyle: option.value.fontStyle || "normal",
  color: option.value.color
}));

const pageLineStyle = computed<CSSProperties>(() => ({
  fontFamily: option.value.fontFamilyLine,
  fontSize: `${option.value.fontSizeLine}px`,
  fontWeight: option.value.fontWeightLine || "normal",
  fontStyle: option.value.fontStyleLine || "normal",
  color: option.value.colorLine,
  padding: `0 ${option.value.split}px`
}));

const pageTotalStyle = computed<CSSProperties>(() => ({
  fontFamily: option.value.fontFamilyTotal,
  fontSize: `${option.value.fontSizeTotal}px`,
  fontWeight: option.value.fontWeightTotal || "normal",
  fontStyle: option.value.fontStyleTotal || "normal",
  color: option.value.colorTotal
}));

const currentPage = computed<string>(() => {
  if (option.value.isText && dataChartItem.value?.textPage?.[dataChartItem.value.pageIndex - 1]) {
    return dataChartItem.value.textPage[dataChartItem.value.pageIndex - 1];
  }
  return "";
});

const autoPlay = computed<boolean>(() => !!option.value.isPlay);

// 方法
// 初始化数据
const initData = (): void => {
  const baseDataChartItem: PageTurningData = {
    pageIndex: 1,
    pageTotal: 1,
    textPage: ["分页一"]
  };

  let newData: PageTurningData;
  if (Array.isArray(dataChart.value)) {
    newData = cloneDeep(dataChart.value[0] || baseDataChartItem);
  } else {
    newData = cloneDeep(dataChart.value || baseDataChartItem);
  }

  // 字符串转数字
  if (typeof newData.pageIndex === "string") {
    newData.pageIndex = Number(newData.pageIndex);
  }
  if (typeof newData.pageTotal === "string") {
    newData.pageTotal = Number(newData.pageTotal);
  }

  // 如果启用文本页
  if (option.value.isText) {
    newData.pageIndex = 1;
    newData.pageTotal = newData.textPage?.length || 1;
  }

  dataChartItem.value = newData;
};

// 点击处理
const handleClick = (type: "prev" | "next"): void => {
  const { pageIndex, pageTotal } = dataChartItem.value;
  const isLoop = option.value.isLoop;

  if (type === "prev") {
    dataChartItem.value.pageIndex = pageIndex !== 1 ? pageIndex - 1 : isLoop ? pageTotal : 1;
  } else {
    dataChartItem.value.pageIndex = pageIndex !== pageTotal ? pageIndex + 1 : isLoop ? 1 : pageTotal;
  }

  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: dataChartItem.value
  });
  // handleEventAndCallbackEvent(props.element, { ...dataChartItem.value })
};

// 播放动画
const playAnimate = (): void => {
  stopInterval();

  if (!autoPlay.value || !option.value.intervalTime) return;

  const time = parseFloat(option.value.intervalTime || "0");
  if (time <= 0) return;

  // 更新间隔时间并开始
  useIntervalFn(() => handleClick("next"), time * 1000, { immediate: false }).resume();
};

// 监听数据变化
watch(
  () => dataChart.value,
  (nv, _ov) => {
    // const oldVal = Array.isArray(ov) ? ov[0] : ov
    const info = dataChartItem.value;

    initData();

    if (nv) {
      if (events.value?.length && events.value.find((a: any) => a.trigger === "dataChange")) {
        // handleEventAndCallbackEvent(props.element, info, undefined, "dataChange")
        handleEventAndCallbackEvent({
          id: props.element.id,
          triggerType: EventTypeEnum.DataChange,
          events: props.element.events,

          throwValue: info
        });
      }

      // 当前选中的index变化了才执行回调
      // if (info.pageIndex !== oldVal?.pageIndex) {
      //   callbackEvent(info)
      // }
    }
  },
  { deep: true }
);

// 监听配置变化
watch(
  () => option.value,
  () => {
    initData();
  },
  { deep: true }
);

// 监听间隔时间变化
watch(
  [() => option.value.intervalTime, () => autoPlay.value],
  () => {
    playAnimate();
  },
  { immediate: true }
);

// 生命周期
onMounted(() => {
  initData();

  // 注册组件事件 - 包装为标准的handleClick
  const handleClickEvent = (throwValue: any) => {
    // 根据传入参数判断操作类型或直接执行点击
    if (throwValue && typeof throwValue === "object" && "action" in throwValue) {
      handleClick(throwValue.action);
    } else {
      // 默认执行下一页操作
      handleClick("next");
    }
  };

  addEvent({
    [`${interactiveEnum.FtPageTurning}-${props.element.id}`]: { handleClick: handleClickEvent }
  });
});

onBeforeUnmount(() => {
  stopInterval();
});
</script>

<style lang="scss" scoped>
.pageStatus {
  display: flex;
  align-items: center;
  justify-content: center;
  .btnPage {
    cursor: pointer;
  }
}
.prevPage {
  transform: rotateY(180deg);
}
</style>
