<!-- 处理滤镜类型阈值组件 -->
<template>
  <SwCollapseItem title="滤镜类型阈值" v-if="input">
    <template #content>
      <el-form-item label="色相" label-width="50px">
        <SwSlider @change="handleChange('hueRotate')" :max="360" :step="1" unit="deg" v-model="input.hueRotate" />
      </el-form-item>
      <el-form-item label="饱和度" label-width="50px">
        <SwSlider @change="handleChange('saturate')" :max="100" :step="1" unit="%" v-model="input.saturate" />
      </el-form-item>
      <el-form-item label="亮度" label-width="50px">
        <SwSlider @change="handleChange('brightness')" :max="100" :step="1" unit="%" v-model="input.brightness" />
      </el-form-item>
      <el-form-item label="对比度" label-width="50px">
        <SwSlider @change="handleChange('contrast')" :max="100" :step="1" unit="%" v-model="input.contrast" />
      </el-form-item>
      <el-form-item label="灰度" label-width="50px">
        <SwSlider @change="handleChange('grayscale')" :max="100" :step="1" unit="%" v-model="input.grayscale" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>

<script setup lang="ts">
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwSlider from "@/components/SwSlider/index.vue";

import type { configScreenFilterProps } from "./configScreenFilter";
import { configScreenFilterEmits } from "./configScreenFilter";
import { useConfigScreenFilter } from "./useConfigScreenFilter";

const props = defineProps<configScreenFilterProps>();
const emit = defineEmits(configScreenFilterEmits);
const { input, handleChange } = useConfigScreenFilter(props, emit);
</script>
