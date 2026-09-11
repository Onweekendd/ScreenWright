<template>
  <xAxisConfigTab
    :showLabelLimit="false"
    :showAxisSplitLineType="false"
    axisSplitLineIntervalLabel="虚线间隔"
    :isShowNumberSlider="false"
  />
</template>

<script setup lang="ts">
import xAxisConfigTab from "@editor/components/xAxisConfigTab/index.vue";
</script>
