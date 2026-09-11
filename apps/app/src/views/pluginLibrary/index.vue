<template>
  <div class="pluginLibrary" v-loading="loading">
    <pluginSearch />
    <pluginList />
    <Pagination
      :total="total"
      v-model:pageNum="params.current"
      v-model:pageSize="params.size"
      @pagination="handlePagination"
    />
  </div>
</template>
<script setup lang="ts">
import type { PaginationEvent } from "@/components/Pagination/index.vue";
import Pagination from "@/components/Pagination/index.vue";

import pluginList from "./pluginList.vue";
import pluginSearch from "./pluginSearch.vue";
import { usePluginLibrary } from "./usePluginLibrary";

const { params, total, loading, getPluginList } = usePluginLibrary();
const handlePagination = (val: PaginationEvent) => {
  params.value.current = val.page;
  params.value.size = val.pageSize;
  getPluginList();
};
</script>
<style lang="scss" scoped>
.pluginLibrary {
  width: 100%;
  height: 100%;
}
</style>
