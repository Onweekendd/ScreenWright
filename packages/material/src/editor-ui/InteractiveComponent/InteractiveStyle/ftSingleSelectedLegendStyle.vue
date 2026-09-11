<template>
  <div class="sw-single-selected-legend-style">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <singleDefaultStyle v-show="tabsActive === 'defaultObj'" />
    <singleSelectedStyle v-show="tabsActive === 'activeObj'" />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCoordinateTabs as SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";

import singleDefaultStyle from "../itemComponent/singleDefaultStyle/index.vue";
import singleSelectedStyle from "../itemComponent/singleSelectedStyle/index.vue";

// import { useUpdateInstance } from "../../useUpdateInstance"
const tabsActive = ref("defaultObj");
const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);
</script>
