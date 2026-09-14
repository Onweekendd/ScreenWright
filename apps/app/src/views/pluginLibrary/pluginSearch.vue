<template>
  <div class="plugin-search flex flex-justify-end flex-align-center">
    <SwInput
      width="166"
      @change="querySearch"
      v-model="params.name"
      placeholder="名称"
      @keyup.enter="querySearch"
      clearable
    />
    <div class="search-btn primary" @click.stop="querySearch">搜索</div>
  </div>
</template>
<script setup lang="ts">
import SwInput from "@/components/SwInput/index.vue";

import { usePluginLibrary } from "./usePluginLibrary";

const { params, getPluginList } = usePluginLibrary();
const querySearch = () => {
  // 这里可以添加搜索逻辑
  getPluginList();
};
</script>
<style lang="scss" scoped>
.plugin-search {
  .search-btn {
    padding: 0 20px;
    font-size: 12px;
    letter-spacing: 2px;
    cursor: pointer;
    white-space: nowrap;
    margin-right: 20px;
    height: 32px;
    line-height: 30px;
    border-radius: 4px 4px;
    margin-left: 20px;
    &.primary {
      background-image: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color));
    }
  }
  :deep(.el-input__inner) {
    --el-input-inner-height: 28px !important;
  }
}
</style>
