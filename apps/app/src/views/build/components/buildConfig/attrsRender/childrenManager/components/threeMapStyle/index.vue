<template>
  <div class="three-map-style">
    <template v-if="currentChildrenItem.type === 'mapGlIcon'">
      <mapGlIconStyle />
    </template>
  </div>
</template>
<script setup lang="ts">
import { useChildrenDrawer } from "../../useChildrenDrawer";
import mapGlIconStyle from "./mapGlIconStyle.vue";

const { currentChildrenItem } = useChildrenDrawer();
</script>
