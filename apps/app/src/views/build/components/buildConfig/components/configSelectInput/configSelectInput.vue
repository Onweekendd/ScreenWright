<template>
  <div class="config-select-input">
    <el-select
      popper-class="sw-select-dropdown"
      class="sw-select"
      v-model="selectValue"
      placeholder="请选择分组"
      style="width: 226px; margin-bottom: 12px"
      @change="handleSelectValueChange"
    >
      <el-option v-for="item in screenType" :key="item.alias" :label="item.label" :value="item.alias" />
    </el-select>
    <el-row :span="24" class="flex flex-center-between">
      <el-col :span="10">
        <sw-input-number @change="handleWidthChange" v-model="w" :controls="false" unit="W" />
      </el-col>
      <el-col :span="10">
        <sw-input-number v-model="h" :controls="false" unit="H" @change="handleHeightChange" />
      </el-col>
    </el-row>
  </div>
</template>
<script setup lang="ts">
import SwInputNumber from "@/components/SwInputNumber/index.vue";

import type { configSelectInputProps } from "./configSelectInput";
import { configSelectInputEmits } from "./configSelectInput";
import { screenType } from "./screenType";
import { useConfigSelectInput } from "./useConfigSelectInput";

const props = defineProps<configSelectInputProps>();
const emit = defineEmits(configSelectInputEmits);
const { w, h, selectValue, handleWidthChange, handleSelectValueChange, handleHeightChange } = useConfigSelectInput(
  props,
  emit
);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.config-select-input {
  --el-input-text-color: #859094;
  :deep(.el-form-item) {
    margin-top: 0;
    margin-bottom: 16px;
    padding: 0;
    margin-left: 0 !important;
  }
  :deep(.el-form-item__content) {
    .el-select__wrapper {
      min-height: 28px;
    }
  }

  @include common-element-style(".el-select__wrapper", true, true);
  @include common-element-style(".el-input__wrapper", true, true);
}
</style>
