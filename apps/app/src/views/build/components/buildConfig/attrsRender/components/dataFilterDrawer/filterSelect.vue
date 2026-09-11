<template>
  <div class="filter-select flex flex-align-center">
    <span class="filter-label">选择过滤器:</span>
    <el-select
      @change="handleSelectDataFilter"
      popper-class="sw-select-dropdown"
      v-model="value"
      placeholder="请选择过滤器"
      style="width: 268px"
      filterable
    >
      <el-option v-for="item in diffSelectFilter" :key="item.name" :value="item.name">
        {{ item.name }}
      </el-option>
    </el-select>
    <el-button :disabled="isCanAddFilter" class="filter-create" type="text" @click="handleCreateFilter">
      <Icon type="iconfont-jiahao" size="12" />
      新建过滤器
    </el-button>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import Icon from "@/components/Icon/index.vue";

import { useDataFilter } from "../../../../../useDataFilter";

const { diffSelectFilter, isCanAddFilter, addDataFilterToComponent, handleSelectDataFilter } = useDataFilter();
const value = ref("");

const handleCreateFilter = () => {
  if (isCanAddFilter.value) {
    return;
  }
  addDataFilterToComponent();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.filter-select {
  @include common-element-style(".el-select__wrapper");
  margin-bottom: 16px;
  .filter-label {
    height: 20px;
    line-height: 20px;
    margin-right: 20px;
  }
  :deep(.el-select__wrapper) {
    min-height: 24px;
  }
  .filter-create {
    width: 89px;
    margin-left: 8px;
    font-size: 12px;
    height: 22px;
    padding: 0;
    color: #9483ff !important;
    border: 1px solid #9483ff !important;
    .sw-icon {
      margin-right: 3px;
    }
  }
}
</style>
