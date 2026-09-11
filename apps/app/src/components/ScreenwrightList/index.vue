<template>
  <div class="fan-top-container" v-loading="loading">
    <div class="fan-top-container-list">
      <templateList />
    </div>
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

import templateList from "./components/templateList/index.vue";
import { useTemplateData } from "./components/templateList/useTemplateData";

const { params, total, loading, getTemplateListApi } = useTemplateData();
const handlePagination = (val: PaginationEvent) => {
  params.value.current = val.page;
  params.value.size = val.pageSize;
  getTemplateListApi(params.value);
};
</script>
<style lang="scss" scoped>
.fan-top-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  .fan-top-container-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
}
</style>
