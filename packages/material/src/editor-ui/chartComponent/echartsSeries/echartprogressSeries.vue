<template>
  <div class="echartprogressSeries">
    <el-form-item label="启用" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.xAxisShow" />
    </el-form-item>
    <SwCollapseItem title="刻度标签" @change="update" show-icon v-model="selectTargetData[0].option.xAxisLabelShow">
      <template #content>
        <el-form-item label="数值范围" :label-width="secondLabelWidth">
          <div class="flex flex-center-between fullWidth">
            <SwInputNumber
              @change="update"
              width="90"
              v-model="selectTargetData[0].option.xAxisMin"
              bottomLabel="最小值"
            />
            <SwInputNumber
              @change="update"
              width="90"
              v-model="selectTargetData[0].option.xAxisMax"
              bottomLabel="最大值"
            />
          </div>
        </el-form-item>
        <el-form-item label="距离" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.xAxisMargin" unit="px" />
        </el-form-item>
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="分段数" :label-width="secondLabelWidth">
          <sw-input-number @change="update" v-model="selectTargetData[0].option.xAxisSplitNumber" :min="1" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="刻度线" @change="update" show-icon v-model="selectTargetData[0].option.xAxisSplitLineShow">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.xAxisSplitLineColor" @change="update" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.xAxisSplitLineWidth"
            unit="px"
            :min="0"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "xAxisFontFamily",
  fontSize: "xAxisFontSize",
  color: "xAxisColor",
  fontStyle: "xAxisFontStyle",
  fontWeight: "xAxisFontWeight"
});
</script>
