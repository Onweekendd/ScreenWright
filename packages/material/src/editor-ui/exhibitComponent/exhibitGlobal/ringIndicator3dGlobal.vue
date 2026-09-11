<template>
  <div class="ring-indicator3d-global" v-if="selectTargetData[0].option.globalConfig">
    <el-form-item label="相机位置" :label-width="firstLabelWidth">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.globalConfig.cameraPositionX"
          bottomLabel="X"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.globalConfig.cameraPositionY"
          bottomLabel="Y"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.globalConfig.cameraPositionZ"
          bottomLabel="Z"
          :controls="false"
          @change="update"
        />
      </div>
    </el-form-item>
    <sw-collapse-item title="相机角度" open>
      <template #content>
        <el-form-item label="绕X轴" :label-width="secondLabelWidth">
          <sw-slider
            v-model="selectTargetData[0].option.globalConfig.cameraRotateX"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="绕Y轴" :label-width="secondLabelWidth">
          <sw-slider
            v-model="selectTargetData[0].option.globalConfig.cameraRotateY"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="绕Z轴" :label-width="secondLabelWidth">
          <sw-slider
            v-model="selectTargetData[0].option.globalConfig.cameraRotateZ"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <el-form-item label="半径" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.globalConfig.roateRadius"
        unit="px"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="视图距离" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.globalConfig.perspective"
        :controls="false"
        unit="px"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="滚动时长" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.globalConfig.transitionTime"
        unit="s"
        :controls="false"
        @change="update"
      />
    </el-form-item>
    <sw-collapse-item title="自动轮播" open>
      <template #content>
        <el-form-item label="自动轮播" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.globalConfig.autoPlay" @change="update" />
        </el-form-item>
        <el-form-item label="支持悬停" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.globalConfig.hoverPause" @change="update" />
        </el-form-item>
        <el-form-item label="轮播方向" :label-width="secondLabelWidth">
          <sw-radio
            v-model="selectTargetData[0].option.globalConfig.rotateDirection"
            :option="directionList"
            @change="update"
            direction="row"
          />
        </el-form-item>
        <el-form-item label="间隔时长" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.globalConfig.intervalTime"
            unit="s"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwRadio } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const directionList = ref([
  { label: "顺时针", value: 1 },
  { label: "逆时针", value: 0 }
]);
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
