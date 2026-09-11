<template>
  <div class="echart-loop-ring-pie-loop-animation">
    <el-form-item label="开启" :label-width="firstLabelWidth">
      <el-checkbox v-model="selectTargetData[0].option.tooltipLoop" @change="update" />
    </el-form-item>
    <el-form-item label="停留时间" :label-width="firstLabelWidth">
      <sw-input-number v-model="selectTargetData[0].option.tooltipLoopInterval" unit="s" :min="1" @change="update" />
    </el-form-item>
    <sw-collapse-item title="放大效果" v-model="selectTargetData[0].option.seriesEmphasisScale" showIcon>
      <template #content>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.seriesEmphasisScaleSize"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <ItemPieConfigNumber
      :showIcon="false"
      :showConfigPieNumber="false"
      :showSeriesLabelValueLeftPadding="false"
      :showSeriesLabelValueBottomPadding="true"
    />
  </div>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import ItemPieConfigNumber from "../ItemComponent/ItemPieConfigNumber/index.vue";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
