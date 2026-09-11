<template>
  <div class="source" v-loading="loading">
    <div class="create-source flex flex-align-item flex-justify-between">
      <div class="create-source-left">
        <el-button type="primary" round :icon="Plus" @click="addDataSource">添加数据源</el-button>
      </div>
      <div class="create-source-right">
        <el-input
          :suffix-icon="Search"
          @change="getTableListData"
          style="width: 240px"
          v-model="name"
          placeholder="请输入内容"
          clearable
        />
      </div>
    </div>
    <subMenu :tabsList="tabsList" :menuActive="menuActive" @click="menuClick" />

    <sourceList @actionClick="actionClick" />
    <Pagination
      :total="total"
      v-model:pageNum="params.current"
      v-model:pageSize="params.size"
      @pagination="handlePagination"
    />
  </div>
</template>
<script setup lang="ts">
import { Plus, Search } from "@element-plus/icons-vue";

import type { PaginationEvent } from "@/components/Pagination/index.vue";
import Pagination from "@/components/Pagination/index.vue";
import type { DbItem } from "@/model/DataModel";

import sourceList from "./components/sourceList.vue";
import subMenu from "./components/subMenu.vue";
import { useActionMenu } from "./useActionMenu";
import { useSourceList } from "./useSourceList";

const { params, total, name, tabsList, menuActive, loading, menuClick, getTableListData } = useSourceList();
const { addDataSource, previewDataSource, downloadUrl, deleteDataSource, editDataSource } = useActionMenu({
  refresh: getTableListData,
  menuActive
});
const actionClick = (evt: any, row: DbItem) => {
  if (evt === "preview") {
    previewDataSource(row);
  } else if (evt === "edit") {
    editDataSource(row);
  } else if (evt === "delete") {
    deleteDataSource(row);
  } else if (evt === "download") {
    downloadUrl(row);
  }
};

const handlePagination = (e: PaginationEvent) => {
  params.value.current = e.page;
  params.value.size = e.pageSize;
  getTableListData();
};
</script>
<style lang="scss" scoped>
@import "./style/source.scss";
</style>
