<template>
  <div class="echart-common-map-global">
    <template v-if="currentChildrenItem.type === 'mapLines'">
      <lineGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'mapEffectScatter'">
      <mapEffectScatterGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'mapGlScatter'">
      <mapGlScatterGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'heatmap'">
      <heatmapGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'colormap'">
      <colormapGlobal />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useChildrenDrawer } from "../../useChildrenDrawer";
import colormapGlobal from "./colormapGlobal.vue";
import heatmapGlobal from "./heatmapGlobal.vue";
import lineGlobal from "./lineGlobal.vue";
import mapEffectScatterGlobal from "./mapEffectScatterGlobal.vue";
import mapGlScatterGlobal from "./mapGlScatterGlobal.vue";

const { currentChildrenItem } = useChildrenDrawer();
console.log(currentChildrenItem.value, "currentChildrenItem");
</script>
