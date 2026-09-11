<template>
  <div class="sw-single-selected-legend-global">
    <SwCollapseItem title="选中框" open>
      <template #content>
        <el-form-item label="边距" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxPaddingTop"
              width="40"
              bottomLabel="上"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxPaddingBottom"
              width="40"
              bottomLabel="下"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxPaddingLeft"
              width="40"
              bottomLabel="左"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxPaddingRight"
              width="40"
              bottomLabel="右"
            />
          </div>
        </el-form-item>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxWidth"
              unit="px"
              bottomLabel="宽度"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.checkboxHeight"
              unit="px"
              bottomLabel="高度"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="背景" open>
      <template #content>
        <el-form-item label="类型" :label-width="secondLabelWidth">
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
          v-if="selectTargetData[0].option.backgroundBackgroundType === 'color'"
          :label-width="secondLabelWidth"
        >
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundBackgroundColor" @change="update" />
        </el-form-item>

        <el-form-item
          label="图片"
          v-if="selectTargetData[0].option.backgroundBackgroundType === 'custom'"
          :label-width="secondLabelWidth"
        >
          <SwUpload v-model="selectTargetData[0].option.backgroundBackgroundImage" @change="update" @delete="update" />
        </el-form-item>
        <el-form-item label="边框颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.backgroundBorderColor" @change="update" />
        </el-form-item>
        <el-form-item label="圆角" :label-width="secondLabelWidth">
          <SwSlider
            :min="0"
            :max="100"
            :step="1"
            v-model="selectTargetData[0].option.backgroundBorderRadius"
            @change="update"
          />
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

import { secondLabelWidth } from "@editor/textComponent/textConfig/textConfig";
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
