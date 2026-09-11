<!-- 栅格进度条 -->
<template>
  <div
    class="rasterProgressBar"
    :style="{
      'pointer-events': isBuild ? 'none' : 'auto',
      width: width + 'px',
      height: height + 'px'
    }"
  >
    <div
      :class="{
        contentBox: true,
        'component-bind-events': true,
        'has-bind': events?.length && isBuild,
        'has-encode': encodes?.length && isBuild
      }"
    >
      <ProgressBarSvg
        :width="width"
        :height="height"
        :option="option"
        :uid="uid"
        :section-rect-list="sectionRectList"
        :value-proportion="valueProportion"
        :foreground-color="getForegroundColor"
      />

      <SeriesBackground :style="getSeriesBgStyle" />

      <SeriesText
        :text="getSeriesText"
        :text-style="getSeriesTextStyle"
        :unit-style="getSeriesUnitStyle"
        :option="option"
      />

      <SectionLabels
        :width="width"
        :option="option"
        :section-style="getSectionStyle"
        :section-unit-style="getSectionUnitStyle"
        :section-min="getSectionMin"
        :section-max="getSectionMax"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import ProgressBarSvg from "./components/ProgressBarSvg.vue";
import SectionLabels from "./components/SectionLabels.vue";
import SeriesBackground from "./components/SeriesBackground.vue";
import SeriesText from "./components/SeriesText.vue";
import { useRasterProgressBar } from "./useRasterProgressBar";

defineOptions({
  name: "rasterProgressBar"
});
const props = defineProps<{
  element: ComponentType;
}>();

const { option, dataChart, width, height, isBuild, events, encodes } = useBaseData(props.element);

const {
  uid,
  sectionRectList,
  valueProportion,
  getForegroundColor,
  getSeriesBgStyle,
  getSeriesTextStyle,
  getSeriesText,
  getSeriesUnitStyle,
  getSectionStyle,
  getSectionUnitStyle,
  getSectionMin,
  getSectionMax
} = useRasterProgressBar({
  option,
  dataChart,
  width,
  height
});
</script>

<style lang="scss" scoped>
.rasterProgressBar {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  position: relative;
  .contentBox {
    width: 100%;
    height: 100%;
    position: relative;
  }
}

.circle {
  animation: circle 5s linear infinite;
}
@keyframes circle {
  from {
    stroke-dasharray: 0 1131;
  }
  to {
    stroke-dasharray: 1131 0;
  }
}
</style>
