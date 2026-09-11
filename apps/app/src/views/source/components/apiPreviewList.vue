<template>
  <div class="api-preview-list">
    <el-tabs v-model="params.activeName" class="demo-tabs">
      <el-tab-pane label="Header" :name="activeNameEnum.Header">
        <apiPreviewTable :listData="params.data[activeNameEnum.Header].listData" @add="handleAddClick" />
      </el-tab-pane>
      <el-tab-pane label="Query" :name="activeNameEnum.Query">
        <apiPreviewTable :listData="params.data[activeNameEnum.Query].listData" @add="handleAddClick" />
      </el-tab-pane>
      <el-tab-pane label="Body" :name="activeNameEnum.Body">
        <apiPreviewBody />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
<script lang="ts" setup>
import apiPreviewBody from "./apiPreviewBody.vue";
import apiPreviewTable from "./apiPreviewTable.vue";
import { activeNameEnum } from "./constant";
import { useApiPreviewParams } from "./useApiPreviewParams";

const { params, handleAddClick } = useApiPreviewParams();
</script>
<style lang="scss" scoped>
@import "../style/apiPreviewList.scss";
</style>
