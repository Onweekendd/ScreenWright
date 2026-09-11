<!-- 数值标签配置 -->
<template>
  <div class="item-config-number">
    <SwCollapseItem @change="update" v-model="selectTargetData[0].option.seriesLabelShow" title="数值标签" showIcon>
      <template #content>
        <configNumericalLabel v-bind="$attrs" :labelWidth="props.labelWidth" />
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import configNumericalLabel from "../../../components/configNumericalLabel/index.vue";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const props = withDefaults(
  defineProps<{
    labelWidth?: string | number;
  }>(),
  {
    labelWidth: secondLabelWidth
  }
);
</script>
