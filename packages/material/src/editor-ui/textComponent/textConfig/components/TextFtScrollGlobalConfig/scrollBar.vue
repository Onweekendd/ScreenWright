<template>
  <sw-collapse-item title="滚动条" open>
    <template #content>
      <sw-collapse-item title="轨道">
        <template #content>
          <el-form-item label="粗细" :label-width="labelWidth">
            <sw-input-number
              v-model.number="selectTargetData[0].option.globalScrollYTrackWidth"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="颜色" :label-width="labelWidth">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.globalScrollYTrackBackground"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="圆角" :label-width="labelWidth">
            <sw-slider v-model="selectTargetData[0].option.globalScrollYTrackBorderRadius" unit="%" @change="update" />
          </el-form-item>
        </template>
      </sw-collapse-item>
      <sw-collapse-item title="滑块">
        <template #content>
          <el-form-item label="粗细" :label-width="labelWidth">
            <sw-input-number
              v-model.number="selectTargetData[0].option.globalScrollYThumbWidth"
              unit="px"
              :controls="false"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="颜色" :label-width="labelWidth">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.globalScrollYThumbBackground"
              @change="update"
            />
          </el-form-item>
          <el-form-item label="圆角" :label-width="labelWidth">
            <sw-slider v-model="selectTargetData[0].option.globalScrollYThumbBorderRadius" unit="%" @change="update" />
          </el-form-item>
        </template>
      </sw-collapse-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { watch } from "vue";

import { has } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { useUpdateInstance } from "../../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const labelWidth = 48;
const init = () => {
  console.log(has(selectTargetData.value[0].option, "globalScrollYTrackWidth"), "globalScrollYTrackWidth");
  if (!has(selectTargetData.value[0].option, "globalScrollYTrackWidth")) {
    Object.assign(selectTargetData.value[0].option, {
      globalScrollYTrackWidth: 5,
      globalScrollYTrackBackground: "rgba(0, 119, 255, 0.3)",
      globalScrollYTrackBorderRadius: 0,
      globalScrollYThumbWidth: 5,
      globalScrollYThumbBackground: "#0078ff",
      globalScrollYThumbBorderRadius: 0
    });

    update();
  }
};

watch(
  () => selectTargetData.value[0],
  (nval, oval) => {
    if (nval?.id == oval?.id || oval == null) {
      init();
    }
  },
  { immediate: true }
);
</script>
<style lang="scss" scoped>
</style>
