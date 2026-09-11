<template>
  <div class="echartstrip-bar-xAxis">
    <xAxisConfigTab
      :showLabelLimit="false"
      :showAxisSplitLineType="false"
      axisSplitLineIntervalLabel="虚线间隔"
      :isShowNumberSlider="false"
    />
  </div>
</template>
<script setup lang="ts">
import xAxisConfigTab from "../../components/xAxisConfigTab/index.vue";
</script>
