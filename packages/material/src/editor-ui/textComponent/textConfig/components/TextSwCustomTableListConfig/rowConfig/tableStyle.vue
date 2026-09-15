<template>
  <sw-collapse-item title="表样式">
    <template #content>
      <el-form-item label="行宽" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.rowConfig.listRowWidth"
          unit="px"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="行高" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.rowConfig.listRowHeight"
          unit="px"
          :controls="false"
          @change="update"
        />
      </el-form-item>
      <sw-collapse-item title="行背景">
        <template #content>
          <el-form-item label="填充方式" title="填充方式" :label-width="thirdLabelWidth">
            <el-select
              v-model="selectTargetData[0].option.rowConfig.listRowBgType"
              popper-class="sw-select-dropdown"
              @change="update"
            >
              <el-option v-for="item in backgroundType" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item
            label="颜色"
            v-if="selectTargetData[0].option.rowConfig.listRowBgType === 'color'"
            :label-width="thirdLabelWidth"
          >
            <sw-single-color-picker
              field="seriesXTableBackground"
              v-model="selectTargetData[0].option.rowConfig.listRowBgColor"
              @change="update"
            />
          </el-form-item>
          <el-form-item
            label="图片"
            v-if="selectTargetData[0].option.rowConfig.listRowBgType === 'custom'"
            :label-width="thirdLabelWidth"
          >
            <sw-upload
              v-model="selectTargetData[0].option.rowConfig.listRowBgImage"
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
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { useUpdateInstance } from "../../../../../useUpdateInstance";
import { backgroundType } from "../../../constants";
import { secondLabelWidth, thirdLabelWidth } from "../../../textConfig";

const { update, selectTargetData } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
