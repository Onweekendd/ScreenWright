<template>
  <div class="echart-zebra-bar-and-line-x-axis">
    <!-- 坐标轴配置 -->
    <xAxisConfigTab
      :type="TypeAttrs.column_l"
      :showLabelLimit="false"
      :showAxisSplitLineType="false"
      axisSplitLineIntervalLabel="虚线间隔"
      :showYAxisMinMax="false"
      :isShowNumberSlider="false"
    />
  </div>
</template>

<script setup lang="ts">
import xAxisConfigTab from "../../components/xAxisConfigTab/index.vue";
import { TypeAttrs } from "../../components/xAxisConfigTab/useAttrsByReverse";
</script>
