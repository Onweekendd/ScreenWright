<!-- 饼图样式组件 -->
<template>
  <div class="config-pie-style">
    <el-form-item label="圆心位置" :label-width="secondLabelWidth">
      <div class="flex flex-center flex-justify-between" style="width: 100%">
        <SwInputNumber v-model="x" @change="update" width="90" />
        <SwInputNumber v-model="y" @change="update" width="90" />
      </div>
    </el-form-item>
    <el-form-item label="半径" :label-width="secondLabelWidth">
      <div class="flex flex-center" style="width: 100%">
        <SwSlider v-model="max" @change="update" />
      </div>
    </el-form-item>
    <el-form-item label="最小半径" :label-width="secondLabelWidth">
      <div class="flex flex-center" style="width: 100%">
        <SwSlider v-model="Min" @change="update" />
      </div>
    </el-form-item>
    <el-form-item label="间隔" :label-width="secondLabelWidth" v-if="isShowBarCategoryGap">
      <div class="flex flex-center" style="width: 100%">
        <SwSlider v-model="barCategoryGap" @change="update" />
      </div>
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import type { configDistanceProps } from "./useConfigPieStyle";
import { useConfigPieStyle } from "./useConfigPieStyle";

const { update } = useUpdateInstance();
const props = withDefaults(defineProps<configDistanceProps>(), {
  isShowBarCategoryGap: true
});
const { x, y, max, Min, barCategoryGap } = useConfigPieStyle(props);
</script>
