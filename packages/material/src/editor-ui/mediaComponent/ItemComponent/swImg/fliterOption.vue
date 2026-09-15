<template>
  <div class="fliter-option">
    <SwCollapseItem title="高斯模糊" v-model="selectTargetData[0].option.gaussianBlurShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.gaussianBlur"
            unit="px"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="亮度" v-model="selectTargetData[0].option.brightnessShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.brightness" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="对比度" v-model="selectTargetData[0].option.contrastShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.contrast" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="灰度" v-model="selectTargetData[0].option.grayscaleShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.grayscale" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="色相" v-model="selectTargetData[0].option.hueShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.hue" :max="360" :step="1" unit="°" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="反色" v-model="selectTargetData[0].option.invertShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.invert" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="饱和度" v-model="selectTargetData[0].option.saturateShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.saturate" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="褐色" v-model="selectTargetData[0].option.sepiaShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="值" :label-width="secondLabelWidth">
          <SwSlider v-model="selectTargetData[0].option.sepia" :max="100" :step="1" unit="%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="阴影" v-model="selectTargetData[0].option.shadowShow" @change="update" showIcon>
      <template #content>
        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <FrontColorPicker v-model="selectTargetData[0].option.shadowColor" @change="update" style="top: 5px" />
            <sw-input-number
              v-model="selectTargetData[0].option.shadowX"
              bottomLabel="X"
              :controls="false"
              @change="update"
              width="48"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.shadowY"
              bottomLabel="Y"
              :controls="false"
              @change="update"
              width="48"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.shadowFuzzy"
              bottomLabel="模糊"
              :controls="false"
              @change="update"
              width="48"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ScreenwrightColorPicker as FrontColorPicker } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
