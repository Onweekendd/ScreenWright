<template>
  <sw-collapse-item title="阴影" showIcon v-model="selectTargetData[0].option.shadowShow" @change="update">
    <template #content>
      <ItemTextShadow v-model="textShadowInput" @change="handleConfigTextShadowChange" :labelWidth="labelWidth" />
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import ItemTextShadow from "../../ItemComponent/ItemTextShadow/index.vue";
import { useItemTextShadowAttrs } from "../../ItemComponent/ItemTextShadow/useItemTextShadow";

interface Props {
  labelWidth?: number | string;
}
withDefaults(defineProps<Props>(), {
  labelWidth: 48
});
const { update, selectTargetData } = useUpdateInstance();
const { input: textShadowInput, handleConfigTextShadowChange } = useItemTextShadowAttrs({
  color: "shadowColor",
  x: "shadowX",
  y: "shadowY",
  blur: "shadowBlur",
  preFied: ""
});
</script>
