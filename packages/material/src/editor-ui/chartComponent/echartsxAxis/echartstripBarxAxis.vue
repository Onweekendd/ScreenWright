<template>
  <div class="echartstrip-bar-xAxis">
    <xAxisConfigTab :type="TypeAttrs.column" :showLabelLimit="false" />
  </div>
</template>
<script setup lang="ts">
import xAxisConfigTab from "../../components/xAxisConfigTab/index.vue";
import { TypeAttrs } from "../../components/xAxisConfigTab/useAttrsByReverse";
</script>
