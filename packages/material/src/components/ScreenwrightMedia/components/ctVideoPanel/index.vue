<template>
  <div
    :class="{
      'ct-video-panel': true,
      'component-bind-events': true,
      'has-bind': events.length && isBuild.value,
      'has-encode': encodes.length && isBuild.value
    }"
    :style="styleDefaultItem"
    ref="ctVideoPanelRef"
  >
    <video-grid
      v-if="!isCarousel"
      :id="id"
      :element="element"
      :data-list="dataList"
      :page-data="pageData"
      :option="option"
      :current="current"
      :page-total="pageTotal"
      :style-config="styleConfig"
      :is-build="isBuild.value"
      @change-page="changePage"
      @click="handleMediaClick"
    />

    <video-carousel
      v-else
      :id="id"
      :element="element"
      :data-list="dataList"
      :option="option"
      :carousel="carousel"
      :height="height"
      :current="current"
      :style-config="styleConfig"
      :is-build="isBuild.value"
      @click="handleMediaClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useIntervalFn } from "@vueuse/core";

import { isArray } from "lodash-es";

import { MediaEnum as mediaEnum } from "@screenwright/types";
import { useActionEvent } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import type { CarouselOption, StyleConfig, VideoItem } from "../types";
import VideoCarousel from "./components/VideoCarousel.vue";
import VideoGrid from "./components/VideoGrid.vue";
import pageIcon from "./images/page-icon.png";

// Props定义
const props = defineProps<{
  element: ComponentType;
}>();
defineOptions({
  name: "ctVideoPanel"
});
// 使用useMedia
const { encodes, events, option, dataChart, isBuild, height, styleSizeName, id, handleEventAndCallbackEvent } =
  useBaseData(props.element);

const { addEvent } = useActionEvent();

// Emits定义
const emits = defineEmits<{
  (e: "click", data: VideoItem): void;
  // (e: "update:current", index: number): void
}>();

// Refs
const ctVideoPanelRef = ref<HTMLElement>();

// 响应式状态
const carousel = ref<CarouselOption>({
  interval: 3000,
  arrow: "hover",
  arrowImg: "",
  isRotate: false,
  type: "",
  direction: "horizontal",
  indicator: "none"
});
const current = ref(1);

const dataList = computed<VideoItem[]>(() => {
  let arr = [];
  if (isArray(dataChart.value) && dataChart.value.length) {
    arr = dataChart.value;
  } else {
    arr = option.value.seriesList
      ? option.value.seriesList.map((item: any) => {
          return {
            name: item?.title || "",
            url: item?.urlMode === "url" ? item.url : item.customUrl || ""
          };
        })
      : [];
  }
  return arr;
});

const styleDefaultItem = computed(() => ({
  background:
    option.value.backgroundType == "color"
      ? option.value.backgroundColor
      : `url(${setMinioUrl(option.value.backgroundImage) || setMinioUrl(option.value.background)}) 50% 50% / ${
          option.value.backgroundImageType
        } no-repeat`
}));
const pageSize = computed(() => Math.round(option.value.rows * option.value.columns) || 2);
const total = computed(() => dataList.value?.length || 0);
const pageTotal = computed(() => Math.ceil(total.value / pageSize.value));

const pageData = computed(() => {
  const fromNum = (current.value - 1) * pageSize.value;
  const toNum = current.value * pageSize.value;
  return option.value.showPage ? dataList.value?.slice(fromNum || 0, toNum) : dataList.value;
});

const isCarousel = computed(() => Boolean(option.value?.isCarousel));
// 样式配置
const styleConfig = computed<StyleConfig>(() => ({
  defaultItem: styleSizeName.value,
  itemLi: {
    width: `calc(100% / ${option.value.columns} - 4px)`,
    height: `calc(100% / ${option.value.rows} - 6px)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%"
  },
  videoTitle: {
    background:
      option.value.titleBgType !== "color"
        ? `url(${setMinioUrl(option.value.titleBgImage)}) 50% 50% / ${option.value.titleBgImageType} no-repeat`
        : option.value.titleBgColor || "rgba(15,22,34,0.6)"
  },
  defaultIcon: {
    width: `${option.value.iconWidth || 60}px`,
    height: `${option.value.iconHeight || 50}px`,
    display: option.value.videoIcon ? "inline-block" : "none",
    "background-image": option.value.videoIcon ? `url(${setMinioUrl(option.value.videoIcon)})` : ""
  },
  defaultFont: {
    color: option.value.fontColor,
    fontSize: `${option.value.fontSize || 12}px`,
    fontWeight: option.value.fontWeight,
    fontFamily: option.value.fontFamily,
    fontStyle: option.value.fontStyle,
    textShadow: option.value.isTextShadow
      ? `${option.value.textShadow.color} ${option.value.textShadow.x || 0}px ${option.value.textShadow.y || 0}px ${
          option.value.textShadow.blur
        }px`
      : "none",
    transform: `translate(${option.value.textTranslateX || 0}px, ${option.value.textTranslateY || 0}px)`,
    textAlign: option.value.textAlign || "left",
    width: `calc(100% - ${option.value.showVideoIcon ? option.value.iconWidth : 0}px)`
  },
  stylePager: {
    height: `${option.value.pagerHeight || 40}px`
  },
  stylePagerfont: {
    color: option.value.pagerfontColor || "rgba(255,255,255,1)",
    fontSize: `${option.value.pagerfontSize || 20}px`,
    letterSpacing: `${option.value.pagerletterSpacing || 0}px`,
    fontWeight: option.value.pagerfontWeight
  },
  stylePageIcon: {
    width: `${option.value.pageIconWidth || 20}px`,
    height: `${option.value.pageIconHeight || 20}px`,
    backgroundImage: `url(${setMinioUrl(option.value.pageIconImage)})`
  },
  styleVideoBorder: {
    backgroundSize: `${option.value.borderBgSize || "100% 100%"}`,
    backgroundImage: `url(${setMinioUrl(option.value.borderBgImage)})`
  },
  totalfont: {
    color: option.value.pagerfontColor2 || "rgba(37,255,251,1)",
    fontSize: `${option.value.pagerfontSize2 || 16}px`,
    letterSpacing: `${option.value.pagerletterSpacing2 || 0}px`,
    fontWeight: option.value.pagerfontWeight2,
    fontFamily: option.value.pagerfontFamily2,
    fontStyle: option.value.pagerfontStyle2
  },
  pageIcon: {
    width: `${option.value.pagerIconWidth || 44}px`,
    height: `${option.value.pagerIconHeight || 24}px`,
    "background-image": `url(${setMinioUrl(option.value.pageIcon) || pageIcon})`
  },
  pager: {
    height: `${option.value.pagerHeight || 40}px`
  },
  pagerfont: {
    color: option.value.pagerfontColor || "rgba(255,255,255,1)",
    fontSize: `${option.value.pagerfontSize || 20}px`,
    letterSpacing: `${option.value.pagerletterSpacing || 0}px`,
    fontWeight: option.value.pagerfontWeight,
    fontFamily: option.value.pagerfontFamily,
    fontStyle: option.value.pagerfontStyle
  }
}));

// Methods
const changePage = (index: number) => {
  if (index < 1 || index > pageTotal.value) return false;
  current.value = index;
  // option.value.seriesList = option.value.seriesList.slice((index - 1) * pageSize.value, index * pageSize.value)
  // if (index < 1 || index > pageTotal.value) return

  // emit("update:current", index)
};

const handleMediaClick = (data: VideoItem) => {
  // handleClick({ type, data, index })
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: data
  });
  emits("click", data);
};

// 点击处理函数（供外部调用）
const handleClick = (info: any) => {
  handleMediaClick(info);
};

// 自动翻页
const { pause, resume } = useIntervalFn(
  () => {
    const index = current.value + 1 > pageTotal.value ? 1 : current.value + 1;
    changePage(index);
  },
  (option.value.pagerTime || 10) * 1000,
  { immediate: false }
);

// 监听器
watch(
  () => option.value.carousel,
  (val) => {
    if (val) {
      carousel.value = val;
    }
  },
  { deep: true }
);

watch(
  () => dataChart.value,
  (val) => {
    console.log("查看data chart 变化", val);
  },
  { deep: true }
);

// 生命周期
onMounted(() => {
  if (option.value?.isCarousel) {
    option.value.carousel = carousel.value;
  }

  if (option.value.autoPager && !isBuild.value) {
    console.log("开始自动翻页");
    resume();
  }
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.DataChange,
    events: props.element.events,

    throwValue: props.element
  });

  // 注册组件事件到全局事件系统
  addEvent({
    [`${mediaEnum.CtVideoPanel}-${props.element.id}`]: {
      handleClick,
      handleNextClick: () => {
        const index = current.value + 1 > pageTotal.value ? 1 : current.value + 1;
        changePage(index);
      },
      handlePrevClick: () => {
        const index = current.value - 1 < 1 ? pageTotal.value : current.value - 1;
        changePage(index);
      }
    }
  });
});

onBeforeUnmount(() => {
  pause();
});
</script>

<style lang="scss" scoped>
.ct-video-panel {
  height: 100%;
  width: 100%;
}
</style>
