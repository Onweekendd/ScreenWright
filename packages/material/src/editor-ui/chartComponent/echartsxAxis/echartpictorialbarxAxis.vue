<template>
  <div class="echartpictorialbarxAxis">
    <xAxisConfigTab
      :showLabelLimit="false"
      :showyAxisSplitLineType="false"
      :showAxisSplitLineType="false"
      axisSplitLineIntervalLabel="虚线间隔"
    />
  </div>
</template>
<script setup lang="ts">
import xAxisConfigTab from "../../components/xAxisConfigTab/index.vue";
</script>
