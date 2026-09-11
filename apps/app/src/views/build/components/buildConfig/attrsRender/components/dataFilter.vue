<template>
  <div class="data-filter">
    <div class="data-filter-check flex flex-align-center">
      <el-checkbox v-model="selectTargetData[0].openFilter" @change="handleOpenFilter"> 数据过滤器: </el-checkbox>
      <span v-if="selectTargetData[0].listenArgs.length === 0"> 当前未添加过滤器</span>
      <span v-else
        >已添加<span style="color: #3e43f4">{{ currentFilterNum }}</span
        >个过滤器</span
      >
      <el-tooltip effect="dark" placement="top">
        <template #content>
          <div class="theme-tip">
            添加过滤器，处理返回符合的数据，同时结合回调参数字段<br />
            过滤想要的数据内容，并且过滤器已添加的回调参数字段可<br />
            作为接口的动态参数，如参数 { "name": "${回调参数||默认值}" }
          </div>
        </template>
        <Icon type="QuestionFilled" class="tooltip-icon" size="14" />
      </el-tooltip>
    </div>
    <div class="filter-select flex flex-align-center">
      <el-select
        filterable
        popper-class="sw-select-dropdown"
        v-model="value"
        placeholder="请选择过滤器"
        style="width: 268px"
        @change="handleSelectDataFilter"
      >
        <el-option v-for="item in diffSelectFilter" :key="item.name" :label="item.name" :value="item.name" />
      </el-select>
      <div class="filter-create" @click="handleCreateFilter">
        <Icon type="iconfont-jiahao" />
      </div>
    </div>
    <div class="filter-ownList flex flex-justify-between flex-wrap">
      <div @click="handleItemClick(item)" class="filter-item" v-for="item in currentFilter" :key="item.id || item.name">
        {{ item.name }}
      </div>
    </div>
    <dataFilterDrawer v-model="visible" />
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";

import Icon from "@/components/Icon/index.vue";
import { useCallbackArguments } from "@/hooks/callbackArguments/useCallbackArguments";

import { useDataFilter } from "../../../../useDataFilter";
import type { Filter } from "../../../buildRender/type";
import { useUpdateInstance } from "../../useUpdateInstance";
import dataFilterDrawer from "../components/dataFilterDrawer/index.vue";

const { emitFilterTrigger, updateCallbackRelation } = useCallbackArguments();
const {
  diffSelectFilter,
  newDataFilter,
  currentFilter,
  currentFilterNum,
  hideAllFilter,
  addNewDataFilterToGlobal,
  handleSelectDataFilter
} = useDataFilter();
const { selectTargetData, update } = useUpdateInstance({
  history: false
});
const value = ref("");
const visible = ref(false);

const handleCreateFilter = () => {
  visible.value = true;
  addNewDataFilterToGlobal();
};
const handleItemClick = (item: Filter) => {
  hideAllFilter();
  visible.value = true;
  item.show = true;
};
const handleOpenFilter = () => {
  update();
  updateCallbackRelation(selectTargetData.value[0]);
  emitFilterTrigger(`${selectTargetData.value[0].id}`);
};

onBeforeUnmount(() => {
  newDataFilter.value = [];
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.data-filter {
  padding-top: 16px;
  font-size: 12px;
  border-top: 1px solid #393b4a;
  @include common-element-style(".el-select__wrapper");
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
}
.data-filter-check {
  @include checkbox-style();
  font-size: 12px;
  .el-checkbox__label {
    position: relative;
    .tooltip-icon {
      position: absolute;
      top: 9px;
    }
  }
}
.filter-select {
  margin: 6px 0;
}
.filter-create {
  box-sizing: border-box;
  margin-left: 10px;
  width: 25px;
  height: 25px;
  text-align: center;
  line-height: 25px;
  background: #181b24;
  opacity: 0.8;
  border: 1px solid;
  cursor: pointer;
  border-radius: 4px;
  border-image: linear-gradient(180deg, rgb(139, 88, 231), rgb(100, 44, 255)) 1 1;
}
.filter-ownList {
  width: 304px;
  .filter-item {
    margin-top: 16px;
    text-align: center;
    width: 146px;
    height: 22px;
    line-height: 18px;
    background: #282b36;
    border-radius: 2px;
    opacity: 1;
    border: 1px solid #2f313d;
    cursor: pointer;
  }
}
</style>
