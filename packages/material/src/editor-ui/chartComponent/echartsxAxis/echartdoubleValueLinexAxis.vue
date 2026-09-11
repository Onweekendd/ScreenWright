<template>
  <div class="echartdoubleValueLinexAxis-config">
    <xAxisConfigTab
      :showAxiosLabelUtil="true"
      :showAxisType="false"
      :showAxisInterval="false"
      :showLabelLimit="false"
      :showAxisSplitLineType="false"
      :showAxisSplitLineIntervalLabel="false"
      :showAxisUnit="false"
    />
  </div>
</template>
<script setup lang="ts">
import xAxisConfigTab from "../../components/xAxisConfigTab/index.vue";
</script>
