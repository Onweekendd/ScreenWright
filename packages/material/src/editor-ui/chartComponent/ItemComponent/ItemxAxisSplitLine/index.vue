<template>
  <sw-collapse-item title="网格线" showIcon v-model="selectTargetData[0].option.xAxisSplitLineShow" @change="update">
    <template #content>
      <el-form-item label="类型" :label-width="secondLabelWidth">
        <el-select
          v-model="selectTargetData[0].option.xAxisSplitLineType"
          @change="update"
          popper-class="sw-select-dropdown"
        >
          <el-option v-for="item in lineType" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="颜色" :label-width="secondLabelWidth">
        <sw-single-color-picker v-model="selectTargetData[0].option.xAxisSplitLineColor" @change="update" />
      </el-form-item>
      <el-form-item label="粗细" :label-width="secondLabelWidth">
        <sw-input-number
          v-model.number="selectTargetData[0].option.xAxisSplitLineWidth"
          @change="update"
          unit="px"
          :min="0"
          :controls="false"
        />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { has } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { lineType, secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

type OptionType = {
  xAxisSplitLineShow?: boolean;
  xAxisSplitLineColor?: string;
  xAxisSplitLineType?: string;
  xAxisSplitLineWidth?: number;
  [key: string]: string | number | boolean | undefined;
};

const setDefaultOption = () => {
  if (!selectTargetData.value[0]) {
    return;
  }

  const option = selectTargetData.value[0].option as OptionType;
  const newKeyList = [
    {
      key: "xAxisSplitLineShow",
      value: true
    },
    {
      key: "xAxisSplitLineColor",
      value: "rgba(255,255,255,.20)"
    },
    {
      key: "xAxisSplitLineType",
      value: "dashed"
    },
    {
      key: "xAxisSplitLineWidth",
      value: 1
    }
  ];
  for (let i = 0; i < newKeyList.length; i++) {
    const keyItem = newKeyList[i];
    if (!has(option, keyItem.key)) {
      option[keyItem.key] = keyItem.value;
    }
  }
};

onMounted(() => {
  setDefaultOption();
});
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
