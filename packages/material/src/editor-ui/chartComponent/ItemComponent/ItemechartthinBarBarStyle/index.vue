<!-- 细长柱状图柱体样式 -->
<template>
  <sw-collapse-item :title="title" open>
    <template #content>
      <ItemSeriesWidth />
      <ItemBarColor />
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import ItemBarColor from "../ItemBarColor/index.vue";
import ItemSeriesWidth from "../ItemSeriesWidth/index.vue";

withDefaults(
  defineProps<{
    title: string;
  }>(),
  {
    title: "柱体样式"
  }
);
</script>
