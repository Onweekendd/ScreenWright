<template>
  <div class="asset-list" v-loading="loading">
    <el-scrollbar style="width: 100%; height: 100%">
      <Grid class="asset-list__grid">
        <assetItem
          @handleCopy="handleCopy"
          @handleUseDetail="handleUseDetail"
          @handleDelete="handleDelete"
          @handleCheckboxChange="handleCheckboxChange"
          @handlePreview="handlePreview"
          @handleEdit="handleEdit"
          @handleExport="handleExport"
          :fileType="fileType"
          :checkedItem="checkedItem"
          v-for="item in tableData"
          :key="item.id"
          :item="item"
        />
      </Grid>
    </el-scrollbar>
  </div>
</template>
<script setup lang="ts">
import type { CheckboxValueType } from "element-plus";

import Grid from "@/components/ScreenwrightList/components/grid/grid.vue";
import type { assetItem as assetItemProps } from "@/model/Assets";
import type { FileTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";

import { useAssetAction } from "../useAssetAction";
import assetItem from "./assetItem.vue";

interface Props {
  tableData: assetItemProps[];
  getAssetsListData: () => void;
  fileType: FileTypeEnum;
}
const props = defineProps<Props>();
const { loading, checkedItem, handleUseDetail, handleCopy, handleExport, handleDelete, handleEdit, handlePreview } =
  useAssetAction({
    getAssetsListData: props.getAssetsListData
  });
const handleCheckboxChange = (val: CheckboxValueType, item: assetItemProps) => {
  if (val) {
    checkedItem.value?.push(item);
  } else {
    checkedItem.value = checkedItem.value?.filter((i) => i.id !== item.id);
  }
};
</script>
<style lang="scss" scoped>
.asset-list {
  width: 100%;
  height: calc(100% - 136px);
  padding-top: 20px;
  .asset-list__grid {
    padding-right: 20px;
  }
}
</style>
