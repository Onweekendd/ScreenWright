<!-- 折叠面板 -->
<template>
  <div class="sw-custom-collapse" :style="styleSizeName">
    <div class="collapase-container" :style="containerStyle">
      <div v-for="(item, index) in collapaseList" :key="index">
        <collapse-title :item="item" :titleStyle="titleStyle" :option="option" @change="changeCollapse" />
        <collapse-content
          :item="item"
          :isExpanded="accordionList.includes(item.index)"
          :contentStyle="contentStyle"
          :detailStyle="detailStyle"
          :radiusStyle="radiusStyle"
          :option="option"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentType } from "@screenwright/types";
import { isArray } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, onMounted, ref, watch } from "vue";

import { setMinioUrl } from "@material/minioUrl";
import { useBaseData } from "@screenwright/composables";

import CollapseContent from "./CollapseContent.vue";
import CollapseTitle from "./CollapseTitle.vue";

defineOptions({
  name: "ftCustomCollapse"
});
const props = defineProps<{ element: ComponentType }>();
const { option, styleSizeName, dataChart: inputData } = useBaseData(props.element);
const accordionList = ref<number[]>([]);

// 计算属性
const collapaseList = computed(() => {
  if (!isArray(inputData.value)) {
    return [];
  }
  return inputData.value && inputData.value.length
    ? inputData.value.map((item: { title: string; value: string; type: string }, i: number) => ({
        ...option.value.seriesTabsList[i],
        index: i + 1,
        title: item.title || option.value.seriesTabsList[i]?.title,
        value: item.value || option.value.seriesTabsList[i]?.value,
        type: item.type || option.value.seriesTabsList[i]?.type
      }))
    : option.value.seriesTabsList.map((subItem: any, j: number) => ({
        ...subItem,
        index: j + 1
      }));
});

const containerStyle = computed<CSSProperties>(() => ({
  padding: `${option.value.paddingTop || 0}px ${option.value.paddingLeft || 0}px`,
  backgroundSize: `${option.value.backgroudSize || "100% 100%"}`,
  backgroundImage: `url(${setMinioUrl(option.value.backgroudImage)})`
}));

const titleStyle = computed<CSSProperties>(() => ({
  color: option.value.fontColor,
  height: `${option.value.titleHeight || 30}px`,
  fontSize: `${option.value.fontSize || 12}px`,
  letterSpacing: `${option.value.letterSpacing || 0}px`,
  fontWeight: option.value.fontWeight === "bolder" || option.value.fontWeight === true ? "bold" : "normal",
  fontFamily: option.value.fontFamily,
  fontStyle: option.value.fontStyle === "italic" || option.value.fontStyle === true ? "italic" : "normal",
  textShadow: option.value.isTextShadow
    ? `${option.value.textShadow.color} ${option.value.textShadow.x || 0}px ${option.value.textShadow.y || 0}px ${
        option.value.textShadow.blur
      }px`
    : "none",
  justifyContent: `${option.value.textAlign || "center"}`,
  backgroundSize: `${option.value.titleBgSize || "100% 100%"}`,
  backgroundImage: `url(${setMinioUrl(option.value.titleBgImage)})`
}));

const contentStyle = computed<CSSProperties>(() => ({
  color: option.value.fontColor2,
  fontSize: `${option.value.fontSize2 || 12}px`,
  letterSpacing: `${option.value.letterSpacing2 || 0}px`,
  lineHeight: `${option.value.lineHeight2 || 30}px`,
  fontWeight: option.value.fontWeight2 === "bolder" || option.value.fontWeight2 === true ? "bold" : "normal",
  fontFamily: option.value.fontFamily2,
  fontStyle: option.value.fontStyle2 === "italic" || option.value.fontStyle2 === true ? "italic" : "normal",
  textShadow: option.value.isTextShadow2
    ? `${option.value.textShadow2.color} ${option.value.textShadow2.x || 0}px ${option.value.textShadow2.y || 0}px ${
        option.value.textShadow2.blur
      }px`
    : "none",
  transform: `translate(${option.value.translateX || 0}px, ${option.value.translateY || 0}px)`
}));

const detailStyle = computed<CSSProperties>(() => {
  const padTop = option.value.paddingTop2 || 0;
  const padLeft = option.value.paddingLeft2 || 0;
  return {
    width: `calc(${option.value.imageWidth || 100}% - ${padLeft}px`,
    height: `calc(${option.value.imageHeight || 100}% - ${padTop}px`,
    padding: `${padTop}px ${padLeft}px`,
    backgroundSize: `${option.value.contentBgSize || "100% 100%"}`,
    backgroundImage: `url(${setMinioUrl(option.value.contentBgImage)})`
  };
});

const radiusStyle = computed<CSSProperties>(() => ({
  borderRadius: `${option.value.radiusTop || 0}% ${option.value.radiusRight || 0}% ${option.value.radiusBottom || 0}% ${
    option.value.radiusLeft || 0
  }%`,
  overflow: "hidden"
}));

// 方法
const initComponent = () => {
  accordionList.value = [];
  if (option.value.accordionKeys) {
    const keys = [...new Set(`${option.value.accordionKeys}`.split(","))];
    accordionList.value = keys.map((key) => parseInt(key));
  } else {
    accordionList.value = [1];
  }
};

const changeCollapse = (info: { index: number }) => {
  const idx = accordionList.value.findIndex((i) => info.index == i);
  if (idx >= 0) {
    accordionList.value.splice(idx, 1);
  } else {
    accordionList.value.push(info.index);
  }
};

// 生命周期
onMounted(() => {
  initComponent();
});

watch(
  () => option.value,
  () => {
    initComponent();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.customCollapse {
  overflow: hidden;
}
.collapase-container {
  height: 100%;
  overflow: auto;
  background-repeat: no-repeat;
  background-size: cover;
}
</style>
