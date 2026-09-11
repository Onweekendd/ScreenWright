<template>
  <div class="ft-countup-v2-flip">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <template v-if="tabsActive === 'prefixObj'">
      <ft-countup-v2-prefix />
    </template>
    <template v-if="tabsActive === 'valueObj'">
      <ft-countup-v2-value />
    </template>
    <template v-if="tabsActive === 'suffixObj'">
      <ft-countup-v2-suffix />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";

import ftCountupV2Prefix from "../component/ft-countup-v2-prefix.vue";
import ftCountupV2Suffix from "../component/ft-countup-v2-suffix.vue";
import ftCountupV2Value from "../component/ft-countup-v2-value.vue";

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
