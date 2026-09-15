<template>
  <div class="ft-flop-flip">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <template v-if="tabsActive === 'prefixObj'">
      <ftFlopPerformancePrefix attrsValue="prefixObj" />
    </template>
    <template v-if="tabsActive === 'valueObj'">
      <ftFlopPerformanceValue />
    </template>
    <template v-if="tabsActive === 'suffixObj'">
      <ftFlopPerformancePrefix attrsValue="suffixObj" />
    </template>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";

import ftFlopPerformancePrefix from "../component/ft-flop-performance-prefix.vue";
import ftFlopPerformanceValue from "../component/ft-flop-performance-value.vue";

const tabsActive = ref("prefixObj");
const coordinateOption = ref([
  {
    label: "前缀",
    value: "prefixObj"
  },
  {
    label: "数值",
    value: "valueObj"
  },
  {
    label: "后缀",
    value: "suffixObj"
  }
]);
</script>
