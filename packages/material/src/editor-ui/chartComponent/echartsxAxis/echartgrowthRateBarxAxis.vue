<template>
  <div class="echartstrip-bar-xAxis">
    <xAxisConfigTab
      :showHightLight="true"
      :showAxisUnit="false"
      :type="TypeAttrs.column"
      :showLabelLimit="false"
      :showAxisType="false"
    />
  </div>
</template>
<script setup lang="ts">
import xAxisConfigTab from "../../components/xAxisConfigTab/index.vue";
import { TypeAttrs } from "../../components/xAxisConfigTab/useAttrsByReverse";
</script>
