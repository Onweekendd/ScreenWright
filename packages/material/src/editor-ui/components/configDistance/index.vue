<!-- 处理边距属性 -->
<template>
  <div class="config-distance flex flex-justify-between" v-if="selectTargetData[0] && selectTargetData[0].option">
    <SwInputNumber @change="update" v-model="top" width="40" bottomLabel="上" />
    <SwInputNumber @change="update" v-model="bottom" width="40" bottomLabel="下" />
    <SwInputNumber @change="update" v-model="left" width="40" bottomLabel="左" />
    <SwInputNumber @change="update" v-model="right" width="40" bottomLabel="右" />
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../useUpdateInstance";
import type { configDistanceProps } from "./configDistance";
import { TypeAttrs } from "./configDistance";
import { useAttrsByType } from "./useAttrsByType";

const props = withDefaults(defineProps<configDistanceProps>(), {
  type: TypeAttrs.bar
});
const { update, selectTargetData } = useUpdateInstance();
const { top, bottom, left, right } = useAttrsByType(props);
</script>
<style lang="scss" scoped>
.config-distance {
  width: 100%;
}
</style>
