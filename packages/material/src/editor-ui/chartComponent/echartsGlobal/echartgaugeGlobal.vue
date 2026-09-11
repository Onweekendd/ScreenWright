<template>
  <div class="echartgaugeGlobal">
    <SwCollapseItem title="刻度标签" @change="update" show-icon v-model="selectTargetData[0].option.axisLabelShow">
      <template #content>
        <el-form-item label="数值范围" :label-width="secondLabelWidth">
          <div class="flex flex-center-between fullWidth">
            <SwInputNumber width="90" @change="update" v-model="selectTargetData[0].option.min" bottomLabel="最小值" />
            <SwInputNumber width="90" @change="update" v-model="selectTargetData[0].option.max" bottomLabel="最大值" />
          </div>
        </el-form-item>
        <el-form-item label="距离" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.axisLabelDistance" unit="px" @change="update" />
        </el-form-item>
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="分段数" :label-width="secondLabelWidth">
          <sw-input-number controls @change="update" v-model="selectTargetData[0].option.splitNumber" :min="1" />
        </el-form-item>
        <el-form-item label="小数位数" title="小数位数" :label-width="secondLabelWidth">
          <sw-input-number controls @change="update" v-model="selectTargetData[0].option.axisLabelToFixed" :min="0" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="刻度线" @change="update" show-icon v-model="selectTargetData[0].option.splitLineShow">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.splitLineColor" @change="update" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.splitLineWidth" unit="px" @change="update" :min="0" />
        </el-form-item>
        <el-form-item label="长度" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.splitLineLength" unit="px" @change="update" :min="0" />
        </el-form-item>
        <el-form-item label="距离" :label-width="secondLabelWidth">
          <sw-input-number v-model.number="selectTargetData[0].option.splitLineDistance" unit="px" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="指针" @change="update" show-icon v-model="selectTargetData[0].option.pointerShow">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.pointerColor" @change="update" />
        </el-form-item>
        <el-form-item label="长度" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.pointerlength" unit="px" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="固定点" @change="update" show-icon v-model="selectTargetData[0].option.anchorShow">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.anchorColor" @change="update" />
        </el-form-item>
        <el-form-item label="尺寸" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.anchorSize" unit="px" :min="0" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="动画" @change="update" show-icon v-model="selectTargetData[0].option.animationShow">
      <template #content>
        <el-form-item label="动画时长" :label-width="secondLabelWidth">
          <sw-input-number @change="update" v-model="selectTargetData[0].option.animationDuration" unit="s" :min="0" />
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
import { secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "axisLabelFontFamily",
  fontSize: "axisLabelFontSize",
  color: "axisLabelColor",
  fontStyle: "axisLabelFontStyle",
  fontWeight: "axisLabelFontWeight"
});
</script>
