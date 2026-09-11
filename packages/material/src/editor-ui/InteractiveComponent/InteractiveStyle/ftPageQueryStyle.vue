<template>
  <div class="ft-page-query-style">
    <SwCoordinateTabs v-model="tabsActive" :option="coordinateOption" />
    <pageQueryDefault v-show="tabsActive === 'defaultObj'" />
    <pageQueryHover v-show="tabsActive === 'hoverObj'" />
    <pageQueryActive v-show="tabsActive === 'activeObj'" />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCoordinateTabs as SwCoordinateTabs } from "@screenwright/ui/coordinate-tabs";

import pageQueryActive from "../itemComponent/pageQueryActive/index.vue";
import pageQueryDefault from "../itemComponent/pageQueryDefault/index.vue";
import pageQueryHover from "../itemComponent/pageQueryHover/index.vue";

const tabsActive = ref("defaultObj");
const coordinateOption = ref([
  {
    label: "默认",
    value: "defaultObj"
  },
  {
    label: "悬浮",
    value: "hoverObj"
  },
  {
    label: "选中",
    value: "activeObj"
  }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 24px;
}
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
