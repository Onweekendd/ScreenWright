<template>
  <div class="interface-debugger">
    <interFaceHeader @search="handleSearch" />
    <div class="interface-debugger-list">
      <el-scrollbar style="width: 100%; height: 100%">
        <interFaceList :listData="listData" :getListData="getListData" />
      </el-scrollbar>
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

import interFaceHeader from "./components/interFaceHeader.vue";
import interFaceList from "./components/interFaceList.vue";
import { useInterFace } from "./useInterFace";

const { listData, params, total, getListData, handleSearch } = useInterFace();
const handlePagination = (val: PaginationEvent) => {
  params.value.current = val.page;
  params.value.size = val.pageSize;
  getListData();
};
</script>
<style lang="scss" scoped>
.interface-debugger {
  width: 100%;
  height: 100%;
  .interface-debugger-list {
    height: calc(100% - 90px);
    padding-top: 20px;
  }
}
</style>
