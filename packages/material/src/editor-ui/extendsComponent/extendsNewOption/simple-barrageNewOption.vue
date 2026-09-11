<template>
  <div class="simple-barrage-new-option">
    <el-form-item label="图片宽度" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.imageWidth"
        unit="px"
        :controls="false"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="图片高度" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.imageHeight"
        unit="px"
        :controls="false"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="缩放比例" :label-width="firstLabelWidth">
      <sw-input-number
        v-model.number="selectTargetData[0].option.scale"
        :min="0.1"
        :max="10"
        :step="0.1"
        :controls="false"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="导出接口" :label-width="firstLabelWidth">
      <el-radio-group v-model="selectTargetData[0].option.importType" @change="update">
        <el-radio v-for="item in activeExportSelection" :key="item.value" :label="item.value">
          {{ item.label }}
        </el-radio>
      </el-radio-group>
    </el-form-item>

    <import-settings
      v-if="selectTargetData[0].option.importType === 'customInterface'"
      v-model="selectTargetData[0].option.importConfig"
      @update:modelValue="update"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwInputNumber } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ImportSettings from "../components/ImportSettings.vue";

const { selectTargetData, update } = useUpdateInstance();

const activeExportSelection = ref([
  {
    label: "系统接口",
    value: "systemInterface"
  },
  {
    label: "自定义接口",
    value: "customInterface"
  }
]);
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include common-element-style(".el-input__wrapper");
@include radio-style();
</style>
