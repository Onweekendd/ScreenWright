<template>
  <div class="echartloop-ring attrs">
    <sw-collapse-item title="图形" open>
      <template #content>
        <el-form-item label="半径" :label-width="secondLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.pieRadiusOuter" @change="update" v-if="useSlider" />
          <sw-input v-model="selectTargetData[0].option.pieRadiusOuter" @change="update" v-else />
        </el-form-item>
        <el-form-item label="类玫瑰图" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.pieRoseType" @change="update" />
        </el-form-item>
        <el-form-item label="最小半径" :label-width="secondLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.pieRadiusInner" @change="update" v-if="useSlider" />
          <sw-input v-model="selectTargetData[0].option.pieRadiusInner" @change="update" v-else />
        </el-form-item>
        <el-form-item label="间距基数" :label-width="secondLabelWidth" v-if="showPiePaddingNum">
          <sw-input-number
            v-model.number="selectTargetData[0].option.piePaddingNum"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="角度" open>
      <template #content>
        <el-form-item label="起始" :label-width="secondLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.pieStartAngle" :max="360" @change="update" />
        </el-form-item>
        <el-form-item label="反向" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.pieClockwise" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="描边" open>
      <template #content>
        <el-form-item label="宽度" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.itemBorderWidth" @change="update" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.itemBorderColor"
            field="itemBorderColor"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
withDefaults(
  defineProps<{
    useSlider?: boolean;
    showPiePaddingNum?: boolean;
  }>(),
  {
    useSlider: true,
    showPiePaddingNum: true
  }
);
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
