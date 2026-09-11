<!-- echartpluralRosePie类型的图例标签 -->
<template>
  <SwCollapseItem @change="update" v-model="selectTargetData[0].option.legendShow" title="图例" showIcon>
    <template #content>
      <configLegend />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import configLegend from "../../../components/configLegend/index.vue";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
