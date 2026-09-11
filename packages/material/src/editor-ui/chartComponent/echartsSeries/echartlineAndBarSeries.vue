<template>
  <echartzebraBarAndLineSeries
    :showSeriesWidth="false"
    :showIntervalColor="false"
    :useSingleColorPicker="true"
    :showSeriesAreaColor="true"
    :showSeriesLabel="true"
    :showMarkLineLabelCustom="false"
    :showTextDynamic="true"
    :typeDisabled="false"
    :isShowYAxisIndex="true"
  />
</template>

<script setup lang="ts">
import echartzebraBarAndLineSeries from "./echartzebraBarAndLineSeries.vue";
</script>
