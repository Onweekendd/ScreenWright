<template>
  <grid class="template-list-content" :key="listRefreshKey">
    <templateAdd @click="handleAddTemplate" />
    <templateItem :permissionMap="permissionMap" :item="item" v-for="item in screenList" :key="item.id" />
  </grid>
</template>
<script setup lang="ts">
import grid from "../grid/grid.vue";
import templateAdd from "./templateAdd.vue";
import templateItem from "./templateItem.vue";
import { useTemplateData } from "./useTemplateData";

const { screenList, handleAddTemplate, listRefreshKey, permissionMap } = useTemplateData();
</script>
<style lang="scss" scoped>
@import "../style/templateListContent.scss";
</style>
