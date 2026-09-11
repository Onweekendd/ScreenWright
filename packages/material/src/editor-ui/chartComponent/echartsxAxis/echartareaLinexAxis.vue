<template>
  <div class="echart-area-line-x-axis">
    <xAxisConfigTab
      :showLabelLimit="false"
      :showAxisSplitLineType="false"
      :isShowNumberSlider="false"
      axisSplitLineIntervalLabel="虚线间隔"
    />
  </div>
</template>

<script setup lang="ts">
import xAxisConfigTab from "../../components/xAxisConfigTab/index.vue";
</script>
