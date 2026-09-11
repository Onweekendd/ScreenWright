<template>
  <div class="ft-particles-global">
    <el-form-item label="背景颜色" :label-width="firstLabelWidth">
      <el-color-picker
        v-model="selectTargetData[0].option.backgroundColor"
        style="position: relative; top: -7px; left: -4px; border: 0"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="粒子数量" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.particles.nb" :min="10" :max="500" @change="update" />
    </el-form-item>

    <el-form-item label="粒子颜色" :label-width="firstLabelWidth">
      <el-color-picker
        v-model="selectTargetData[0].option.particles.color"
        style="position: relative; top: -7px; left: -4px; border: 0"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="粒子形状" :label-width="firstLabelWidth">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="selectTargetData[0].option.particles.shape"
        placeholder="Select"
        style="width: 100%"
        @change="update"
      >
        <el-option v-for="item in shapeOption" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="粒子大小" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.particles.size" :min="1" :max="10" @change="update" />
    </el-form-item>
    <el-form-item label="随机大小" :label-width="firstLabelWidth">
      <el-switch class="ft-switch" v-model="selectTargetData[0].option.particles.size_random" @change="update" />
    </el-form-item>

    <div class="action-buttons">
      <el-button type="primary" size="small" @click="onParticlesReStart">重新加载</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwSlider } from "@screenwright/ui";
import { useActionEvent } from "@screenwright/composables";
import { ExhibitEnum } from "@screenwright/types";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { eventList } = useActionEvent();
const { selectTargetData, update } = useUpdateInstance();

const shapeOption = ref([
  {
    label: "圆形",
    value: "circle"
  },
  {
    label: "方形",
    value: "edge"
  },
  {
    label: "三角形",
    value: "triangle"
  }
]);

const onParticlesReStart = () => {
  eventList.value[`${ExhibitEnum.FtParticles}-${selectTargetData.value[0].id}`].particlesReStart();
  console.log(
    `${ExhibitEnum.FtParticles}-${selectTargetData.value[0].id}`,
    eventList.value[`${ExhibitEnum.FtParticles}-${selectTargetData.value[0].id}`]
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
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
  }
}
</style>
