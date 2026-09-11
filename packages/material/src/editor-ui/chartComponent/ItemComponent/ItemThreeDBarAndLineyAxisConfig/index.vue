<template>
  <div class="item-three-d-bar-and-line-y-axis-config">
    <sw-collapse-item title="轴标签" showIcon v-model="selectTargetData[0].option.yAxisLabelShow[yAxisIndex]">
      <template #content>
        <el-form-item label="数值范围" :label-width="secondLabelWidth" v-if="showNumberMaxAndMin">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.yAxisMin[yAxisIndex]"
              bottomLabel="最小值"
              :min="0"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.yAxisMax[yAxisIndex]"
              bottomLabel="最大值"
              :min="0"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="距离" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.yAxisMargin[yAxisIndex]"
            unit="px"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item
      title="轴单位"
      showIcon
      v-model="selectTargetData[0].option.yAxisNameShow[yAxisIndex]"
      @change="update"
      v-if="isShowXAxisName"
    >
      <template #content>
        <el-form-item label="内容" :label-width="secondLabelWidth">
          <sw-input v-model="selectTargetData[0].option.yAxisName[yAxisIndex]" />
        </el-form-item>

        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="inputYAxisStyle" @change="handleYAxisStyleChange" />
        </el-form-item>
        <el-form-item label="边距" :label-width="secondLabelWidth">
          <div class="config-distance flex flex-justify-between fullWidth" v-if="selectTargetData[0].option">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.yAxisNamePaddingTop[yAxisIndex]"
              width="40"
              bottomLabel="上"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.yAxisNamePaddingBottom[yAxisIndex]"
              width="40"
              bottomLabel="下"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.yAxisNamePaddingLeft[yAxisIndex]"
              width="40"
              bottomLabel="左"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.yAxisNamePaddingRight[yAxisIndex]"
              width="40"
              bottomLabel="右"
            />
          </div>
        </el-form-item>
      </template>
    </sw-collapse-item>

    <sw-collapse-item
      title="轴线"
      showIcon
      v-model="selectTargetData[0].option.yAxisLineShow[yAxisIndex]"
      @change="update"
    >
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.yAxisLineColor[yAxisIndex]" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.yAxisLineWidth[yAxisIndex]"
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
      v-model="selectTargetData[0].option.yAxisTickShow[yAxisIndex]"
      @change="update"
    >
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.yAxisTickColor[yAxisIndex]" @change="update" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.yAxisTickWidth[yAxisIndex]"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="长度" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.yAxisTickLength[yAxisIndex]"
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
      v-model="selectTargetData[0].option.yAxisSplitLineShow[yAxisIndex]"
      showIcon
      @change="update"
    >
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.yAxisSplitLineColor[yAxisIndex]"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.yAxisSplitLineWidth[yAxisIndex]"
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
import { ref, watch } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const props = withDefaults(defineProps<{ type: string; isShowXAxisName?: boolean; showNumberMaxAndMin?: boolean }>(), {
  isShowXAxisName: false,
  showNumberMaxAndMin: false
});
const { selectTargetData, update } = useUpdateInstance();
const yAxisIndex = ref(0);
watch(
  () => props.type,
  (val) => {
    yAxisIndex.value = val === "Y_L" ? 0 : 1;
    console.log(yAxisIndex.value, "yAxisIndex");
  },
  {
    immediate: true
  }
);
const { input, handleConfigTextChange } = useFontStyleAttrs(
  {
    fontFamily: "yAxisFontFamily",
    fontSize: "yAxisFontSize",
    color: "yAxisColor",
    fontStyle: "yAxisFontStyle",
    fontWeight: "yAxisFontWeight"
  },
  yAxisIndex.value
);
const { input: inputYAxisStyle, handleConfigTextChange: handleYAxisStyleChange } = useFontStyleAttrs(
  {
    fontFamily: "yAxisNameFontFamily",
    fontSize: "yAxisNameFontSize",
    color: "yAxisNameColor",
    fontStyle: "yAxisNameFontStyle",
    fontWeight: "yAxisNameFontWeight"
  },
  yAxisIndex.value
);
</script>
