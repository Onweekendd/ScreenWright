<template>
  <sw-collapse-item title="阴影" v-model="selectTargetData[0].option.shadowShow" @change="update" showIcon>
    <template #content>
      <ItemTextShadow
        label="阴影"
        v-model="textShadowInput"
        @change="handleConfigTextShadowChange"
        :labelWidth="secondLabelWidth"
      />
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { useItemTextShadowAttrs } from "../../../textConfig/ItemComponent/ItemTextShadow/useItemTextShadow";
import ItemTextShadow from "../../ItemComponent/ItemTextShadow/index.vue";
import { secondLabelWidth } from "../../textConfig";

const { update, selectTargetData } = useUpdateInstance();
const { input: textShadowInput, handleConfigTextShadowChange } = useItemTextShadowAttrs({
  color: "shadowColor",
  x: "shadowX",
  y: "shadowY",
  blur: "shadowFuzzy",
  preFied: ""
});
</script>
