<template>
  <div class="ft-particles-line">
    <el-form-item label="启用连线" :label-width="firstLabelWidth">
      <el-switch
        class="ft-switch"
        v-model="selectTargetData[0].option.particles.line_linked.enable_auto"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="连线距离" :label-width="firstLabelWidth">
      <sw-slider
        v-model="selectTargetData[0].option.particles.line_linked.distance"
        :min="50"
        :max="300"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="连线颜色" :label-width="firstLabelWidth">
      <el-color-picker
        v-model="selectTargetData[0].option.particles.line_linked.color"
        style="position: relative; top: -7px; left: -4px; border: 0"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="连线透明度" :label-width="firstLabelWidth">
      <sw-slider
        v-model="selectTargetData[0].option.particles.line_linked.opacity"
        :min="0.1"
        :max="1"
        :step="0.1"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="连线宽度" :label-width="firstLabelWidth">
      <sw-slider
        v-model="selectTargetData[0].option.particles.line_linked.width"
        :min="0.5"
        :max="5"
        :step="0.5"
        @change="update"
      />
    </el-form-item>
    <div class="action-buttons">
      <el-button type="primary" size="small" @click="onParticlesReStart">重新加载</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
// import { ScreenwrightColorPicker } from "@screenwright/ui";
import { SwSlider } from "@screenwright/ui";
import { useActionEvent } from "@screenwright/composables";
import { ExhibitEnum } from "@screenwright/types";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { eventList } = useActionEvent();
const { selectTargetData, update } = useUpdateInstance();

const onParticlesReStart = () => {
  eventList.value[`${ExhibitEnum.SwParticles}-${selectTargetData.value[0].id}`].particlesReStart();
  console.log(
    `${ExhibitEnum.SwParticles}-${selectTargetData.value[0].id}`,
    eventList.value[`${ExhibitEnum.SwParticles}-${selectTargetData.value[0].id}`]
  );
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
:deep(.el-color-picker__trigger) {
  background-color: transparent !important; /* 示例：改变触发器的背景颜色 */
  border: none !important;
}
.action-buttons {
  margin-top: 10px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  .el-button {
    color: #ffffff;
    width: 90%;
    background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
  }
}
</style>
