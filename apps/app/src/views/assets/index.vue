<template>
  <div class="assets">
    <div
      v-if="fileType && [FileTypeEnum.personalPageAssets, FileTypeEnum.personalSceneAssets].includes(fileType)"
      class="assets-header flex flex-align-center"
    >
      <el-button type="primary" round :icon="Plus" @click="handleAdd">上传素材</el-button>
    </div>
    <assetHeader
      @handleSelectAll="handleSelectAll"
      @handleBatchDelete="handleBatchDelete"
      :fileType="fileType!"
      :disabled="checkedItem.length === 0"
      :showIcon="showIcon"
      :showModel="showModel"
      :showVideo="showVideo"
      :showMaterial="showMaterial"
    />
    <assetList
      :fileType="fileType!"
      :getAssetsListData="getAssetsListData"
      :tableData="tableData"
      v-if="tableData.length > 0"
    />
    <el-empty :image="logoImg" description="暂无数据" v-else style="height: calc(100% - 136px)" />
    <Pagination
      :total="total"
      v-model:pageNum="params.current"
      v-model:pageSize="params.size"
      @pagination="handlePagination"
      style="margin-top: 20px"
    />
  </div>
</template>
<script lang="ts" setup>
import { computed, watch } from "vue";

import { Plus } from "@element-plus/icons-vue";

import logoImg from "@/assets/image/bg/empty.png";
import type { PaginationEvent } from "@/components/Pagination/index.vue";
import Pagination from "@/components/Pagination/index.vue";

import { FileTypeEnum } from "../build/components/buildTabs/assetsEditFrom/type";
import assetHeader from "./components/assetHeader.vue";
import assetList from "./components/assetList.vue";
import { useAsset } from "./useAsset";
import { useAssetAction } from "./useAssetAction";

const { tableData, fileType, params, currentNode, total, getAssetsListData } = useAsset();
const { checkedItem, handleAdd, handleBatchDelete, handleSelectAllDelete } = useAssetAction({ getAssetsListData });
const handlePagination = (val: PaginationEvent) => {
  params.value.current = val.page;
  params.value.size = val.pageSize;
  getAssetsListData();
};
const showVideo = computed(() => {
  return fileType.value === FileTypeEnum.personalPageAssets;
});
const showIcon = computed(() => {
  return fileType.value === FileTypeEnum.personalPageAssets || fileType.value === FileTypeEnum.personalSceneAssets;
});
const showModel = computed(() => {
  return fileType.value === FileTypeEnum.personalSceneAssets;
});

const showMaterial = computed(() => {
  return fileType.value === FileTypeEnum.personalSceneAssets;
});
const handleSelectAll = (val: boolean) => {
  handleSelectAllDelete(tableData, val);
};
watch(
  () => currentNode.value,
  async (nVal) => {
    if (nVal) {
      checkedItem.value = [];
    }
  },
  {
    immediate: true
  }
);
</script>
<style lang="scss" scoped>
@import "./style/assets.scss";
</style>
