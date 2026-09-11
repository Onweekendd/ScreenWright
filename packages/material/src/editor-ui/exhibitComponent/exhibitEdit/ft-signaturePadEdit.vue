<template>
  <div class="ft-signature-pad-control">
    <el-form-item label="显示导出" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.actionControls.export" @change="update" />
    </el-form-item>

    <el-form-item label="导出接口">
      <sw-radio
        @change="update"
        direction="row"
        v-model="selectTargetData[0].option.exportType"
        :option="activeExportSelection"
        style="margin-left: 10px"
      />
    </el-form-item>

    <request-setting v-if="selectTargetData[0].option.exportType === 'customInterface'" />

    <el-form-item label="显示清除" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.actionControls.clear" @change="update" />
    </el-form-item>

    <el-form-item label="显示撤销" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.actionControls.undo" @change="update" />
    </el-form-item>

    <el-form-item label="显示重做" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.actionControls.redo" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { SwRadio } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import RequestSetting from "./RequstSetting/index.vue";

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
@include checkbox-style();
</style>
