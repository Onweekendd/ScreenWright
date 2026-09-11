<!-- 水印文本配置 -->
<template>
  <SwCollapseItem title="水印文本配置" v-if="input" class="config-water-collapse-item">
    <template #content>
      <el-form-item label="内容" label-width="60px">
        <SwInput v-model="input.text" @change="handleChange('text')" />
      </el-form-item>
      <el-form-item label="文本样式" label-width="60px">
        <configTextStyle v-model="input" @change="handleLabelTypeChange" />
      </el-form-item>
      <el-form-item label="旋转角度" label-width="60px">
        <SwSlider v-model="input.degree" :max="180" :min="-180" unit="deg" :step="1" @change="handleChange('degree')" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwInput from "@/components/SwInput/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";

import type { StyleProps } from "../configTextStyle/configTextStyle";
import configTextStyle from "../configTextStyle/index.vue";
import type { configWaterProps, WaterMark } from "./configWater";
import { configWaterEmits } from "./configWater";
import { useWaterConfig } from "./useWaterConfig";

const props = defineProps<configWaterProps>();
const emit = defineEmits(configWaterEmits);
const { input, handleChange } = useWaterConfig(props, emit);
const handleLabelTypeChange = (key: keyof StyleProps) => {
  handleChange(key as keyof WaterMark);
};
</script>
<style lang="scss" scoped>
.config-water-collapse-item {
  :deep(.el-form-item) {
    margin-bottom: 10px;
  }
  .btn-wrapper {
    .button {
      min-width: 25px;
      height: 25px;
      background: #181b24;
      border-radius: 4px 4px 4px 4px;
      opacity: 0.8;
      border: 1px solid #393b4a;
      font-size: 16px;
      font-family:
        Source Han Sans CN-Normal,
        Source Han Sans CN;
      font-weight: 400;
      color: #ffffff;
      text-align: center;
      cursor: pointer;
      &.btn_active {
        border-color: #642cff;
        color: #642cff;
      }
      &:nth-child(1) {
        margin-right: 12px;
      }
    }
  }
}
</style>
