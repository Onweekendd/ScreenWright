<template>
  <SwCollapseItem title="饼图样式" open>
    <template #content>
      <configPieStyle :type="TypeAttrs.ScalePie" :isShowBarCategoryGap="false" />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import configPieStyle from "../../../components/configPieStyle/index.vue";
import { TypeAttrs } from "../../../components/configPieStyle/useConfigPieStyle";
</script>
