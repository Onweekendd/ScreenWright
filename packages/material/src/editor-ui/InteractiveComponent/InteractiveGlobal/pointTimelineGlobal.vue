<template>
  <div class="point-time-line" v-if="selectTargetData[0].option.globalConfig">
    <el-form-item label="默认展开" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.globalConfig.defaultExpansion" />
    </el-form-item>
    <el-form-item label="交叉展示" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.globalConfig.crossDisplay" />
    </el-form-item>
    <el-form-item label="排列方向" :label-width="firstLabelWidth">
      <SwRadio
        direction="row"
        :option="componentScopeOptions"
        v-model="selectTargetData[0].option.globalConfig.arrangementDirection"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="起始边距" :label-width="firstLabelWidth">
      <SwInputNumber @change="update" controls :min="0" v-model="selectTargetData[0].option.globalConfig.initMargin" />
    </el-form-item>

    <el-form-item label="轴段间距" :label-width="firstLabelWidth">
      <SwInputNumber @change="update" controls :min="0" v-model="selectTargetData[0].option.globalConfig.shaftMargin" />
    </el-form-item>

    <el-form-item
      label="距离中轴线间距"
      v-if="
        !(
          selectTargetData[0].option.globalConfig.arrangementDirection === 'column' &&
          !selectTargetData[0].option.globalConfig.crossDisplay
        )
      "
      :label-width="firstLabelWidth"
    >
      <SwInputNumber
        @change="update"
        controls
        v-model="selectTargetData[0].option.globalConfig.centralAxisMargin"
        :min="0"
      />
    </el-form-item>

    <el-form-item :label-width="firstLabelWidth">
      <template #label>
        <span>默认选中</span>
        <el-tooltip class="item" effect="dark" placement="right">
          <Icon type="QuestionFilled" size="14" style="position: relative; top: 10px; left: 6px" />
          <template #content>
            <p>从1开始，0即不选中</p>
          </template>
        </el-tooltip>
      </template>
      <SwInputNumber
        @change="update"
        controls
        v-model="selectTargetData[0].option.globalConfig.defaultSelected"
        :min="0"
      />
    </el-form-item>
    <SwCollapseItem title="轴线样式">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.globalConfig.axisColor" />
        </el-form-item>

        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <SwInputNumber @change="update" v-model="selectTargetData[0].option.globalConfig.axisWidth" :min="0" />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio as SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const componentScopeOptions = [
  { label: "竖排", value: "column" },
  { label: "横排", value: "row" }
];
</script>
