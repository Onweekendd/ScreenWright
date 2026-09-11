<template>
  <div class="mask-layer-global">
    <el-form-item label="遮罩类型" :label-width="firstLabelWidth">
      <el-select v-model="selectTargetData[0].option.markType" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in markType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="事件穿透" :label-width="firstLabelWidth">
      <el-switch
        v-model="selectTargetData[0].option.pointerEvents"
        active-text="开启"
        inactive-text="关闭"
        @change="update"
        class="ft-switch"
      />
    </el-form-item>
    <template v-if="selectTargetData[0].option.markType === 'linearGradient'">
      <el-form-item label="遮罩位置" :label-width="firstLabelWidth">
        <el-select
          v-model="selectTargetData[0].option.linearGradient.markPosition"
          popper-class="sw-select-dropdown"
          @change="update"
        >
          <el-option v-for="item in markPosition" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="遮罩半径" :label-width="firstLabelWidth">
        <sw-slider v-model="selectTargetData[0].option.linearGradient.markRadius" @change="update" />
      </el-form-item>
      <el-form-item label="遮罩颜色" :label-width="firstLabelWidth">
        <sw-single-color-picker v-model="selectTargetData[0].option.linearGradient.markColor" @change="update" />
      </el-form-item>
      <el-form-item label="遮罩透明度" :label-width="firstLabelWidth">
        <sw-slider v-model="selectTargetData[0].option.linearGradient.markOpacity" @change="update" />
      </el-form-item>
    </template>

    <template v-if="selectTargetData[0].option.markType === 'radioactiveGradation'">
      <el-form-item label="遮罩透明半径" :label-width="firstLabelWidth">
        <sw-slider v-model="selectTargetData[0].option.radioactiveGradation.markOpacityRadius" @change="update" />
      </el-form-item>
      <el-form-item label="遮罩不透明半径" :label-width="firstLabelWidth">
        <sw-slider v-model="selectTargetData[0].option.radioactiveGradation.markUnOpacityRadius" @change="update" />
      </el-form-item>
      <el-form-item label="遮罩颜色" :label-width="firstLabelWidth">
        <sw-single-color-picker v-model="selectTargetData[0].option.radioactiveGradation.markColor" @change="update" />
      </el-form-item>
      <el-form-item label="遮罩透明度" :label-width="firstLabelWidth">
        <sw-slider v-model="selectTargetData[0].option.radioactiveGradation.markOpacity" @change="update" />
      </el-form-item>
      <SwCollapseItem
        show-icon
        title="刻度"
        @change="update"
        v-model="selectTargetData[0].option.radioactiveGradation.showLengthWidthRatio"
      >
        <template #content>
          <el-form-item label="长宽比值" :label-width="secondLabelWidth">
            <sw-slider
              v-model="selectTargetData[0].option.radioactiveGradation.lengthWidthRatio"
              :min="-1"
              :max="1"
              :step="0.01"
              @change="update"
            />
          </el-form-item>
        </template>
      </SwCollapseItem>
    </template>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";

import { firstLabelWidth, secondLabelWidth } from "@editor/constants";
import { useUpdateInstance } from "@editor/useUpdateInstance";
import { markPosition, markType } from "../dict";

const { update, selectTargetData } = useUpdateInstance();
console.log(selectTargetData.value[0], "selectTargetData.value[0]");
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
