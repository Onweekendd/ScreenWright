<template>
  <div class="echartrankxAxis">
    <xAxisConfigTab :type="TypeAttrs.column" />
  </div>
</template>
<script setup lang="ts">
import xAxisConfigTab from "../../components/xAxisConfigTab/index.vue";
import { TypeAttrs } from "../../components/xAxisConfigTab/useAttrsByReverse";
</script>
