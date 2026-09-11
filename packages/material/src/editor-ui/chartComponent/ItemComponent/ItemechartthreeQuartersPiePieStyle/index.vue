<!-- 环状饼图-饼图样式 -->
<template>
  <sw-collapse-item title="饼图样式">
    <template #content>
      <el-form-item label="剩余颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker
          v-model="selectTargetData[0].option.seriesRemainColor"
          field="seriesTopColor"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="底部颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker
          v-model="selectTargetData[0].option.seriesBottomColor"
          field="seriesBottomColor"
          @change="update"
        />
      </el-form-item>
      <el-form-item label="偏移" :label-width="secondLabelWidth">
        <div class="input-wrap flex flex-center-between">
          <sw-input-number
            v-model="selectTargetData[0].option.seriesOffsetX"
            unit="%"
            bottomLabel="X"
            :controls="false"
            width="90"
            @change="update"
          />
          <sw-input-number
            v-model="selectTargetData[0].option.seriesOffsetY"
            unit="%"
            bottomLabel="Y"
            :controls="false"
            width="90"
            @change="update"
          />
        </div>
      </el-form-item>
      <el-form-item label="半径" :label-width="secondLabelWidth">
        <sw-slider v-model="selectTargetData[0].option.pieRadiusOuter" @change="update" :min="0" :max="100" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
<style lang="scss" scoped>
.input-wrap {
  width: 100%;
}
</style>
