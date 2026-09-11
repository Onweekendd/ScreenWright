<template>
  <sw-collapse-item
    title="纵向滚动条"
    v-model="selectTargetData[0].option.globalConfig.scrollYBarShow"
    @change="update"
    showIcon
    v-if="selectTargetData[0].option.globalConfig"
  >
    <template #title>
      <span
        >纵向滚动条
        <el-tooltip class="box-item" effect="dark" content="仅在动画关闭时，支持纵向滚动条" placement="top">
          <Icon type="QuestionFilled" size="12" />
        </el-tooltip>
      </span>
    </template>
    <template #content>
      <sw-collapse-item title="轨道" :label-width="73">
        <template #content>
          <el-form-item label="粗细" :label-width="73">
            <sw-input-number
              v-model="selectTargetData[0].option.globalConfig.globalScrollYTrackWidth"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="颜色" :label-width="73">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.globalConfig.globalScrollYTrackBackground"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="圆角" :label-width="73">
            <sw-slider
              v-model="selectTargetData[0].option.globalConfig.globalScrollYTrackBorderRadius"
              unit="%"
              @change="update"
            />
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="滑块">
        <template #content>
          <el-form-item label="粗细" :label-width="73">
            <sw-input-number
              v-model="selectTargetData[0].option.globalConfig.globalScrollYThumbWidth"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="颜色" :label-width="73">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.globalConfig.globalScrollYThumbBackground"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="圆角" :label-width="73">
            <sw-slider
              v-model="selectTargetData[0].option.globalConfig.globalScrollYThumbBorderRadius"
              unit="%"
              @change="update"
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
import { SwSlider } from "@screenwright/ui/slider";
import Icon from "@editor/base/Icon/index.vue";

import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
</script>
<style lang="scss" scoped>
</style>
