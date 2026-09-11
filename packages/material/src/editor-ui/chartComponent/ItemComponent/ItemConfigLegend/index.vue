<template>
  <!-- 图例配置 -->
  <SwCollapseItem @change="update" v-model="selectTargetData[0].option.legendShow" title="图例" showIcon>
    <template #content>
      <!-- 图例配置基础组件 -->
      <configLegend :labelWidth="secondLabelWidth" v-bind="$attrs" />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import configLegend from "../../../components/configLegend/index.vue";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
