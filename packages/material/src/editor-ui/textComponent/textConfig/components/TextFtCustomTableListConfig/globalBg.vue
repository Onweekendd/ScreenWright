<template>
  <sw-collapse-item
    title="背景"
    :label-width="73"
    v-model="selectTargetData[0].option.globalConfig.globalBgShow"
    showIcon
    @change="update"
    v-if="selectTargetData[0].option.globalConfig"
  >
    <template #content>
      <el-form-item label="填充方式" title="填充方式" :label-width="73">
        <el-select
          v-model="selectTargetData[0].option.globalConfig.globalBgType"
          @change="update"
          popper-class="sw-select-dropdown"
        >
          <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="颜色"
        v-if="selectTargetData[0].option.globalConfig.globalBgType === 'color'"
        :label-width="73"
      >
        <sw-single-color-picker v-model="selectTargetData[0].option.globalConfig.globalBgColor" @change="update" />
      </el-form-item>
      <el-form-item
        label="图片"
        v-if="selectTargetData[0].option.globalConfig.globalBgType === 'custom'"
        :label-width="73"
      >
        <sw-upload v-model="selectTargetData[0].option.globalConfig.globalBgImage" @change="update" @delete="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import { backgroundType } from "../../constants";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
