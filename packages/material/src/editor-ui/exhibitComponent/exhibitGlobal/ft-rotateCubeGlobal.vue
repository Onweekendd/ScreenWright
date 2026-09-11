<template>
  <div class="ft-rotate-cube-global">
    <el-form-item label="透视距离 (rem)" :label-width="firstLabelWidth">
      <sw-input-number
        v-model="selectTargetData[0].option.perspectiveDistance"
        :min="0"
        :max="500"
        :step="1"
        :controls="true"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="旋转灵敏度" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.sensitivity" :min="0" :max="1" :step="0.01" @change="update" />
    </el-form-item>
    <el-form-item label="初始旋转角度" :label-width="firstLabelWidth">
      <div class="rotation-inputs">
        <div class="rotation-input">
          <span>X轴:</span>
          <sw-input-number
            v-model="selectTargetData[0].option.initialRotation.x"
            :min="0"
            :max="360"
            :controls="true"
            @change="update"
          />
        </div>
        <div class="rotation-input">
          <span>Y轴:</span>
          <sw-input-number
            v-model="selectTargetData[0].option.initialRotation.y"
            :min="0"
            :max="360"
            :controls="true"
            @change="update"
          />
        </div>
        <div class="rotation-input">
          <span>Z轴:</span>
          <sw-input-number
            v-model="selectTargetData[0].option.initialRotation.z"
            :min="0"
            :max="360"
            :controls="true"
            @change="update"
          />
        </div>
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
.rotation-inputs {
  width: 100%;
  .rotation-input {
    display: flex;
    align-items: center;

    span {
      width: 50px;
      margin-right: 5px;
    }
  }
}
</style>
