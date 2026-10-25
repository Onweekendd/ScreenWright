<template>
  <div class="sw-scroll-row-config">
    <el-form-item label="行高">
      <sw-input-number v-model="selectTargetData[0].option.rowStyle.height" unit="px" :controls="false" @change="update" />
    </el-form-item>
    <el-form-item label="字号">
      <sw-input-number v-model="selectTargetData[0].option.rowStyle.fontSize" unit="px" :controls="false" @change="update" />
    </el-form-item>
    <el-form-item label="文字颜色">
      <sw-single-color-picker v-model="selectTargetData[0].option.rowStyle.color" @change="update" />
    </el-form-item>
    <el-form-item label="背景色">
      <sw-single-color-picker v-model="selectTargetData[0].option.rowStyle.background" @change="update" />
    </el-form-item>
    <el-form-item label="对齐方式">
      <el-select v-model="selectTargetData[0].option.rowStyle.align" popper-class="sw-select-dropdown" @change="update">
        <el-option label="居左" value="left" />
        <el-option label="居中" value="center" />
        <el-option label="居右" value="right" />
      </el-select>
    </el-form-item>

    <sw-collapse-item title="斑马纹" showIcon @change="update" v-model="stripeEnabled">
      <template #content>
        <el-form-item label="偶数行背景色">
          <sw-single-color-picker v-model="selectTargetData[0].option.rowStyle.stripeBackground" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>

    <sw-collapse-item title="轮播滚动" showIcon @change="update" v-model="selectTargetData[0].option.scroll.enabled">
      <template #content>
        <el-form-item label="可视行数">
          <sw-input-number v-model="selectTargetData[0].option.scroll.visibleRows" :min="1" @change="update" />
        </el-form-item>
        <el-form-item label="每行耗时">
          <sw-input-number v-model="selectTargetData[0].option.scroll.speed" unit="s" :min="0.1" :step="0.1" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { useUpdateInstance } from "../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

// rowStyle 是必填字段（种子数据兜底），scroll 是可选字段，缺失时先补上再挂 v-model
if (!selectTargetData.value[0].option.rowStyle) {
  selectTargetData.value[0].option.rowStyle = {
    height: 40,
    fontSize: 14,
    color: "#ffffff",
    background: "transparent",
    align: "center"
  };
}
if (!selectTargetData.value[0].option.scroll) {
  selectTargetData.value[0].option.scroll = { enabled: false, visibleRows: 5, speed: 1 };
}

const stripeEnabled = computed({
  get: () => !!selectTargetData.value[0].option.rowStyle.stripeBackground,
  set: (val: boolean) => {
    if (!val) {
      selectTargetData.value[0].option.rowStyle.stripeBackground = "";
    } else if (!selectTargetData.value[0].option.rowStyle.stripeBackground) {
      selectTargetData.value[0].option.rowStyle.stripeBackground = "rgba(0,138,255,0.1)";
    }
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
