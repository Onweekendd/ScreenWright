<template>
  <SwCollapseItem :title="title" open>
    <template #content>
      <ItemSeriesWidth />
      <ItemBarColor v-if="showBarColor" />
      <ItemIntervalColor />
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";

import ItemBarColor from "../ItemBarColor/index.vue";
import ItemIntervalColor from "../ItemIntervalColor/index.vue";
import ItemSeriesWidth from "../ItemSeriesWidth/index.vue";

interface Props {
  title: string;
  showBarColor?: boolean;
}
withDefaults(defineProps<Props>(), {
  title: "",
  showBarColor: false
});
</script>
