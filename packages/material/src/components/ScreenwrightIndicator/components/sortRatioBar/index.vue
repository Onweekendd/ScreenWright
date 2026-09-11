<!-- 分类占比条 -->
<template>
  <div class="sortRatioBar" :style="containerStyle">
    <div :class="contentBoxClasses" :style="contentBoxStyle">
      <div
        v-for="(listItem, listIndex) in listData"
        :key="listIndex"
        class="seriesItemBox"
        :style="{ width: getSeriesItemBoxWidth(listItem) }"
      >
        <div class="block" :style="getBlockStyle(listItem)" />
        <div
          v-if="option.textConfig.isUsed && listItemIsinSeriesList(listItem)"
          class="tag"
          :style="getTagStyle(listItem)"
        >
          <span
            v-if="option.textConfig.tagShow"
            class="tagName"
            :style="getTagNameStyle"
            :data-translate="listItem.name"
          >
            {{ listItem.name }}
          </span>
          <span v-if="option.textConfig.indexShow" class="tagValue" :style="getTagValuePosition(listItem)">
            {{ listItem.value.toFixed(option.textConfig.decimalPlace) }}
            <span class="tagUnit" :style="getTagUnitFullStyle(listItem)" :data-translate="getTagUnitText(listItem)">
              {{ getTagUnitText(listItem) }}
            </span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import { useSortRatioBar } from "./useSortRatioBar";

defineOptions({
  name: "sortRatioBar"
});
const props = defineProps<{
  element: ComponentType;
}>();

const { option, width, height, isBuild, events, encodes, dataChart: inputData } = useBaseData(props.element);
// 使用自定义hook处理数据和样式
const {
  listData,
  getSeriesItemBoxWidth,
  getBlockStyle,
  getTagTranslateXY,
  getTagValueStyle,
  getTagUnitText,
  getTagUnitStyle,
  listItemIsinSeriesList
} = useSortRatioBar(inputData, option);

// 容器样式
const containerStyle = computed<CSSProperties>(() => ({
  "pointer-events": isBuild.value ? "none" : "auto",
  width: width.value,
  height: height.value
}));

// 内容盒子类名
const contentBoxClasses = computed(() => ({
  contentBox: true,
  flex: true,
  "component-bind-events": true,
  "has-bind": events?.value?.length && isBuild.value,
  "has-encode": encodes?.value?.length && isBuild.value
}));

// 内容盒子样式
const contentBoxStyle = computed<CSSProperties>(() => ({
  background: `${option.value.globalConfig.bgColor}`
}));

// 标签样式
const getTagStyle = (listItem: any) => {
  return {
    transform: `translate(${option.value.textConfig.translateX}px, calc(-100% + ${option.value.textConfig.translateY}px))`,
    ...getTagTranslateXY(listItem)
  };
};

// 标签名称样式
const getTagNameStyle = computed<CSSProperties>(() => {
  return {
    fontFamily: `${option.value.textConfig.tagFontFamily}`,
    fontSize: `${option.value.textConfig.tagFontSize}px`,
    lineHeight: `${option.value.textConfig.tagLineHeight}px`,
    letterSpacing: `${option.value.textConfig.tagLetterSpacing}px`,
    color: `${option.value.textConfig.tagColor}`,
    fontStyle: `${option.value.textConfig.tagFontStyle}`,
    fontWeight: `${option.value.textConfig.tagFontWeight}`
  };
});

// 标签值位置
const getTagValuePosition = (listItem: any) => {
  return {
    top: `${option.value.textConfig.indexTranslateY}px`,
    left: `${option.value.textConfig.indexTranslateX}px`,
    ...getTagValueStyle(listItem)
  };
};

// 标签单位完整样式
const getTagUnitFullStyle = (listItem: any) => {
  return {
    ...getTagValueStyle(listItem),
    ...getTagUnitStyle(listItem)
  };
};
</script>

<style lang="scss" scoped>
.sortRatioBar {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  .contentBox {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    justify-content: space-between;
    .seriesItemBox {
      position: relative;
      .block {
        width: 100%;
        height: 100%;
      }
      .tag {
        width: 100%;
        position: absolute;
        top: 0;
        text-align: center;
        .tagValue,
        .tagUnit {
          position: relative;
        }
      }
    }
  }
}
</style>
