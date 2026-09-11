<template>
  <div style="padding: 10px 0px; font-size: 12px">
    tips: 本组件支持海康生成出来的ws格式的url,若没正常展示，请先确认地址是否有效内且格式是海康的
  </div>
  <div class="h5Player-option">
    <el-form-item label="ws地址" :label-width="firstLabelWidth">
      <sw-input
        v-model="videoValue"
        type="textarea"
        placeholder="例: ws://222.75.96.94:559/openUrl/zdDgYXS"
        :minRows="1"
        :maxRow="5"
      />
    </el-form-item>
    <el-form-item label="背景颜色" :label-width="firstLabelWidth">
      <sw-single-color-picker v-model="selectTargetData[0].option.background" @change="update" />
    </el-form-item>
    <el-form-item label="默认边框颜色" :label-width="firstLabelWidth">
      <sw-single-color-picker v-model="selectTargetData[0].option.border" @change="update" />
    </el-form-item>
    <el-form-item label="高亮边框颜色" :label-width="firstLabelWidth">
      <sw-single-color-picker v-model="selectTargetData[0].option.borderSelect" @change="update" />
    </el-form-item>
    <el-form-item label="边框厚度" :label-width="firstLabelWidth">
      <sw-input-number v-model.number="selectTargetData[0].option.borderWidth" :min="0" @change="update" />
    </el-form-item>
    <el-form-item label="分屏规格" :label-width="firstLabelWidth">
      <sw-input-number v-model.number="selectTargetData[0].option.splitNum" :min="0" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { isPlainObject } from "lodash-es";

import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();

const videoValue = computed({
  get() {
    const data = selectTargetData.value[0].data;
    if (Array.isArray(data)) {
      return data[0].value;
    } else if (isPlainObject(data)) {
      return data.value;
    } else {
      return data;
    }
  },
  set(newValue) {
    const data = selectTargetData.value[0].data;

    if (Array.isArray(data)) {
      data[0].value = newValue;
    } else if (isPlainObject(data)) {
      data.value = newValue;
    } else {
      selectTargetData.value[0].data = newValue;
    }
    update();
  }
});
</script>
<style lang="scss" scoped>
:deep(.el-textarea .el-textarea__inner) {
  background-color: #000000 !important;
  --el-input-border-color: #333543;
}
</style>
