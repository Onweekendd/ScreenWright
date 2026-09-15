<template>
  <div class="ft-legend-global">
    <SwCollapseItem title="节点" open>
      <template #content>
        <el-form-item label="常态展开" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.expandAll" @change="update" />
        </el-form-item>
        <el-form-item label="选中框间距" :label-width="secondLabelWidth">
          <SwInputNumber
            @change="update"
            v-model="selectTargetData[0].option.expandSpace"
            :min="0"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="选中框尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%" v-if="selectTargetData[0].option">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxWidth"
              unit="px"
              bottomLabel="宽"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxHeight"
              unit="px"
              bottomLabel="高"
            />
          </div>
        </el-form-item>
        <el-form-item label="边距" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" v-if="selectTargetData[0].option">
            <SwInputNumber @change="update" v-model="selectTargetData[0].option.checkboxPaddingTop" bottomLabel="上" />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxPaddingBottom"
              bottomLabel="下"
            />
            <SwInputNumber @change="update" v-model="selectTargetData[0].option.checkboxPaddingLeft" bottomLabel="左" />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxPaddingRight"
              bottomLabel="右"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="背景" open>
      <template #content>
        <el-form-item label="填充方式" :label-width="secondLabelWidth">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="selectTargetData[0].option.backgroundBackgroundType"
            @change="update"
          >
            <el-option label="颜色" value="color" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item
          label="背景颜色"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.backgroundBackgroundType == 'color'"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundBackgroundColor" @change="update" />
        </el-form-item>

        <el-form-item
          label="图片"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.backgroundBackgroundType === 'custom'"
        >
          <SwUpload v-model="selectTargetData[0].option.backgroundBackgroundImage" @change="update" @delete="update" />
        </el-form-item>

        <el-form-item label="边框颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundBorderColor" />
        </el-form-item>
        <el-form-item label="圆角" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.backgroundBorderRadius" :min="0" :max="100" :step="1" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider as SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-select__wrapper) {
  min-height: 24px;
}
</style>
