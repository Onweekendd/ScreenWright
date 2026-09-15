<template>
  <sw-collapse-item title="鼠标悬停" v-model="selectTargetData[0].option.rowConfig.hoverShow" @change="update" showIcon>
    <template #content>
      <sw-collapse-item title="背景" open>
        <template #content>
          <el-form-item label="填充方式" :label-width="thirdLabelWidth">
            <el-select
              v-model="selectTargetData[0].option.rowConfig.hoverBgType"
              popper-class="sw-select-dropdown"
              @change="update"
            >
              <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item
            label="颜色"
            v-if="selectTargetData[0].option.rowConfig.hoverBgType === 'color'"
            :label-width="thirdLabelWidth"
          >
            <sw-single-color-picker
              field="hoverBgColor"
              v-model="selectTargetData[0].option.rowConfig.hoverBgColor"
              @change="update"
            />
          </el-form-item>
          <el-form-item
            label="图片"
            v-if="selectTargetData[0].option.rowConfig.hoverBgType === 'custom'"
            :label-width="thirdLabelWidth"
          >
            <sw-upload
              v-model="selectTargetData[0].option.rowConfig.hoverBgImage"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { backgroundType } from "../../../constants";
import { thirdLabelWidth } from "../../../textConfig";

const { update, selectTargetData } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
