<template>
  <div class="item-line-style">
    <sw-collapse-item title="折线样式" open>
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-color-picker
            v-model:color="selectTargetData[0].option.seriesLineColor"
            v-model:opacity="selectTargetData[0].option.seriesLineOpacity"
            field="seriesLineColor"
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.seriesLineWidth" @change="update" />
        </el-form-item>
        <el-form-item label="曲线" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.seriesSmoothShow" @change="update" />
        </el-form-item>
        <el-form-item
          label="曲线张力"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.seriesSmoothShow"
        >
          <sw-slider v-model="selectTargetData[0].option.seriesSmooth" :max="1" :step="0.1" @change="update" />
        </el-form-item>
        <el-form-item label="空值连接" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.seriesConnectNulls" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>

<style scoped lang="scss">
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
