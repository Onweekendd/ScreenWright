<template>
  <div class="echartprogressGlobal">
    <SwCollapseItem title="进度条" open>
      <template #content>
        <el-form-item label="边距" :label-width="secondLabelWidth">
          <div class="flex flex-justify-between" style="width: 100%">
            <SwInputNumber @change="update" v-model="selectTargetData[0].option.gridTop" width="40" bottomLabel="上" />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.gridBottom"
              width="40"
              bottomLabel="下"
            />
            <SwInputNumber @change="update" v-model="selectTargetData[0].option.gridLeft" width="40" bottomLabel="左" />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.gridRight"
              width="40"
              bottomLabel="右"
            />
          </div>
        </el-form-item>

        <el-form-item label="高度" :label-width="secondLabelWidth">
          <sw-slider @change="update" v-model="selectTargetData[0].option.seriesBarWidth" :max="60" :min="1" />
        </el-form-item>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-color-picker
            v-model:color="selectTargetData[0].option.seriesColor"
            v-model:opacity="selectTargetData[0].option.seriesOpacity"
            field="seriesColor"
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="背景色" :label-width="secondLabelWidth">
          <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.barBackgroundColor" />
        </el-form-item>
        <el-form-item label="圆角" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.barBorderRadius" controls :min="0" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="动画" @change="update" show-icon v-model="selectTargetData[0].option.animationShow">
      <template #content>
        <el-form-item label="动画时长" :label-width="secondLabelWidth">
          <SwInputNumber
            @change="update"
            unit="s"
            v-model="selectTargetData[0].option.animationDuration"
            controls
            :min="0"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
</script>
