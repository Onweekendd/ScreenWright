<template>
  <div class="echart-common-map-global">
    <template v-if="currentChildrenItem.type === 'flowLine'">
      <flowLineGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'mapPath'">
      <mapPathGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'fence'">
      <fenceGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'plane'">
      <planeGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'mapGlIcon'">
      <mapGlIconGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'mapBar'">
      <mapBarGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'mapScatter'">
      <mapScatterGlobal />
    </template>
    <template v-else-if="currentChildrenItem.type === 'regionOutline'">
      <regionOutlineGlobal />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useChildrenDrawer } from "../../useChildrenDrawer";
import fenceGlobal from "./fenceGlobal.vue";
import flowLineGlobal from "./flowLineGlobal.vue";
import mapBarGlobal from "./mapBarGlobal.vue";
import mapGlIconGlobal from "./mapGlIconGlobal.vue";
import mapPathGlobal from "./mapPathGlobal.vue";
import mapScatterGlobal from "./mapScatterGlobal.vue";
import planeGlobal from "./planeGlobal.vue";
import regionOutlineGlobal from "./regionOutlineGlobal.vue";

const { currentChildrenItem } = useChildrenDrawer();
</script>
