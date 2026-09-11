<template>
  <div class="item-both-way-bar-x">
    <sw-collapse-item
      title="轴标签"
      showIcon
      v-model="selectTargetData[0].option.xAxisLabelShow[xAxisIndex]"
      @change="update"
    >
      <template #content>
        <el-form-item label="最大值" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.xAxisMax[xAxisIndex]"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="距离" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.xAxisMargin[xAxisIndex]"
            unit="px"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="xAxisInput" @change="handleConfigTextChange" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item
      title="轴单位"
      showIcon
      v-model="selectTargetData[0].option.xAxisNameShow[xAxisIndex]"
      @change="update"
    >
      <template #content>
        <el-form-item label="内容" :label-width="secondLabelWidth">
          <sw-input v-model="selectTargetData[0].option.xAxisName[xAxisIndex]" @change="update" />
        </el-form-item>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="xAxisNameInput" @change="handleConfigTextChangeXAxisName" />
        </el-form-item>
        <el-form-item label="距离" :label-width="secondLabelWidth">
          <sw-slider
            v-model="selectTargetData[0].option.xAxisNameGap[xAxisIndex]"
            :min="-50"
            :max="50"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item
      title="轴线"
      showIcon
      v-model="selectTargetData[0].option.xAxisLineShow[xAxisIndex]"
      @change="update"
    >
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.xAxisLineColor[xAxisIndex]"
            field="xAxisLineColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.xAxisLineWidth[xAxisIndex]"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item
      title="刻度"
      showIcon
      v-model="selectTargetData[0].option.xAxisTickShow[xAxisIndex]"
      @change="update"
    >
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.xAxisTickColor[xAxisIndex]"
            field="xAxisTickColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.xAxisTickWidth[xAxisIndex]"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="长度" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.xAxisTickLength[xAxisIndex]"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item
      title="网格线"
      showIcon
      v-model="selectTargetData[0].option.xAxisSplitLineShow[xAxisIndex]"
      @change="update"
    >
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.xAxisSplitLineColor[xAxisIndex]"
            field="xAxisSplitLineColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.xAxisSplitLineWidth[xAxisIndex]"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { XAxisType } from "../../../components/xAxisConfigTab/type";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const props = withDefaults(
  defineProps<{
    active: string;
  }>(),
  {
    active: XAxisType.X_L
  }
);
const { selectTargetData, update } = useUpdateInstance();
const xAxisIndex = computed(() => {
  return props.active == XAxisType.X_L ? 0 : 1;
});
const { input: xAxisInput, handleConfigTextChange: handleConfigTextChange } = useFontStyleAttrs(
  {
    fontFamily: "xAxisFontFamily",
    fontSize: "xAxisFontSize",
    color: "xAxisColor",
    fontStyle: "xAxisFontStyle",
    fontWeight: "xAxisFontWeight"
  },
  xAxisIndex.value
);

const { input: xAxisNameInput, handleConfigTextChange: handleConfigTextChangeXAxisName } = useFontStyleAttrs(
  {
    fontFamily: "xAxisNameFontFamily",
    fontSize: "xAxisNameFontSize",
    color: "xAxisNameColor",
    fontStyle: "xAxisNameFontStyle",
    fontWeight: "xAxisNameFontWeight"
  },
  xAxisIndex.value
);
</script>
