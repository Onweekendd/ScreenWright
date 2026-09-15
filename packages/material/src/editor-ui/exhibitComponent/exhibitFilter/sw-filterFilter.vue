<template>
  <div class="ft-filter-filter" v-if="selectTargetData[0].component.prop === 'sw-filter'">
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.backdropFilter.show"
      :title="selectTargetData[0].option.backdropFilter.name"
      showIcon
    >
      <template #content>
        <el-form-item label="模糊" :labelWidth="secondLabelWidth">
          <SwInputNumber
            v-model="selectTargetData[0].option.backdropFilter.blur"
            controls
            width="100%"
            :min="0"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="饱和度" :labelWidth="secondLabelWidth">
          <SwSlider
            :min="0"
            :max="100"
            v-model="selectTargetData[0].option.backdropFilter.saturate"
            controls
            width="100%"
            @change="update"
          />
        </el-form-item>

        <el-form-item label="是否渐变" :labelWidth="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.backdropFilter.isGradient" @change="update" />
        </el-form-item>
        <el-form-item
          label="颜色"
          :labelWidth="secondLabelWidth"
          v-if="selectTargetData[0].option.backdropFilter.isGradient"
        >
          <Ft-color-picker
            v-model:color="selectTargetData[0].option.backdropFilter.background"
            @change="update"
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            inputDisabled
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.blur.show"
      :title="selectTargetData[0].option.blur.name"
      showIcon
    >
      <template #content>
        <el-form-item label="值" :labelWidth="secondLabelWidth">
          <SwSlider :min="0" v-model="selectTargetData[0].option.blur.value" width="100%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.brightness.show"
      :title="selectTargetData[0].option.brightness.name"
      showIcon
    >
      <template #content>
        <el-form-item label="值" :labelWidth="secondLabelWidth">
          <SwSlider :min="0" v-model="selectTargetData[0].option.brightness.value" width="100%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.contras.show"
      :title="selectTargetData[0].option.contras.name"
      showIcon
    >
      <template #content>
        <el-form-item label="值" :labelWidth="secondLabelWidth">
          <SwSlider :min="0" v-model="selectTargetData[0].option.contras.value" width="100%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.grayscale.show"
      :title="selectTargetData[0].option.grayscale.name"
      showIcon
    >
      <template #content>
        <el-form-item label="值" :labelWidth="secondLabelWidth">
          <SwSlider :min="0" v-model="selectTargetData[0].option.grayscale.value" width="100%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.hueRotate.show"
      :title="selectTargetData[0].option.hueRotate.name"
      showIcon
    >
      <template #content>
        <el-form-item label="值" :labelWidth="secondLabelWidth">
          <SwSlider :min="0" v-model="selectTargetData[0].option.hueRotate.value" width="100%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.invert.show"
      :title="selectTargetData[0].option.invert.name"
      showIcon
    >
      <template #content>
        <el-form-item label="值" :labelWidth="secondLabelWidth">
          <SwSlider :min="0" v-model="selectTargetData[0].option.invert.value" width="100%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.saturate.show"
      :title="selectTargetData[0].option.saturate.name"
      showIcon
    >
      <template #content>
        <el-form-item label="值" :labelWidth="secondLabelWidth">
          <SwSlider :min="0" v-model="selectTargetData[0].option.saturate.value" width="100%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>

    <SwCollapseItem
      @change="update"
      v-model="selectTargetData[0].option.sepia.show"
      :title="selectTargetData[0].option.sepia.name"
      showIcon
    >
      <template #content>
        <el-form-item label="值" :labelWidth="secondLabelWidth">
          <SwSlider :min="0" v-model="selectTargetData[0].option.sepia.value" width="100%" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui";
import { SwColorPicker } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
