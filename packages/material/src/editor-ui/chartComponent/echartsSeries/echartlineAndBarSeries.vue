<template>
  <echartLineAndBarSeriesShared
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
import echartLineAndBarSeriesShared from "./echartLineAndBarSeriesShared.vue";
</script>
