<template>
  <div class="sw-scroll-global">
    <el-form-item label="数据刷新">
      <el-checkbox v-model="selectTargetData[0].option.refresh" @change="update" />
    </el-form-item>

    <sw-collapse-item title="表头" showIcon @change="update" v-model="selectTargetData[0].option.header.show">
      <template #content>
        <el-form-item label="高度">
          <sw-input-number v-model="selectTargetData[0].option.header.height" unit="px" :controls="false" @change="update" />
        </el-form-item>
        <el-form-item label="字号">
          <sw-input-number v-model="selectTargetData[0].option.header.fontSize" unit="px" :controls="false" @change="update" />
        </el-form-item>
        <el-form-item label="文字颜色">
          <sw-single-color-picker v-model="selectTargetData[0].option.header.color" @change="update" />
        </el-form-item>
        <el-form-item label="背景色">
          <sw-single-color-picker v-model="selectTargetData[0].option.header.background" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>

    <sw-collapse-item title="序号列" showIcon @change="update" v-model="rowIndexShow">
      <template #content>
        <el-form-item label="标题">
          <sw-input v-model="selectTargetData[0].option.rowIndex.title" @change="update" />
        </el-form-item>
        <el-form-item label="列宽">
          <sw-input-number v-model="selectTargetData[0].option.rowIndex.width" unit="px" :controls="false" @change="update" />
        </el-form-item>
        <el-form-item label="起始值">
          <sw-input-number v-model="selectTargetData[0].option.rowIndex.startFrom" :controls="false" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

// header 是必填字段，理论上创建组件时后端种子数据就带齐；rowIndex 是可选字段，
// 两者都做一次兜底，避免种子数据缺字段时面板直接崩溃
if (!selectTargetData.value[0].option.header) {
  selectTargetData.value[0].option.header = {
    show: true,
    height: 40,
    background: "rgba(0,138,255,0.3)",
    color: "#ffffff",
    fontSize: 14
  };
}
if (!selectTargetData.value[0].option.rowIndex) {
  selectTargetData.value[0].option.rowIndex = { show: false, title: "序号", width: 50, startFrom: 1 };
}

const rowIndexShow = computed({
  get: () => selectTargetData.value[0].option.rowIndex.show,
  set: (val: boolean) => {
    selectTargetData.value[0].option.rowIndex.show = val;
  }
});
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 12px;
}
</style>
