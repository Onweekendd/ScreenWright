<template>
  <div class="scroll-picker-global" v-if="selectTargetData[0].option.globalConfig">
    <el-form-item label="默认选中" :label-width="firstLabelWidth">
      <template #label>
        <span>默认选中</span>
        <el-tooltip class="item" effect="dark" placement="right">
          <Icon type="QuestionFilled" size="14" style="position: relative; top: 10px; left: 6px" />
          <template #content>
            <p>默认状态下选项卡选中页面：从1开始，0即不选中</p>
          </template>
        </el-tooltip>
      </template>
      <SwInputNumber
        controls
        v-model="selectTargetData[0].option.globalConfig.defaultSelected"
        :min="0"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="显示数" :label-width="firstLabelWidth">
      <SwInputNumber controls v-model="selectTargetData[0].option.globalConfig.showNum" :min="0" @change="update" />
    </el-form-item>

    <el-form-item label="选项间距" :label-width="firstLabelWidth">
      <SwInputNumber
        v-model="selectTargetData[0].option.globalConfig.tabInterval"
        :min="0"
        unit="px"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="排列方式" :label-width="firstLabelWidth">
      <sw-radio
        direction="row"
        :option="componentScopeOptions"
        v-model="selectTargetData[0].option.globalConfig.permutationType"
        @change="update"
      />
    </el-form-item>

    <el-form-item label="自动轮播" :label-width="firstLabelWidth">
      <el-checkbox @change="update" v-model="selectTargetData[0].option.globalConfig.autoCarousel" />
    </el-form-item>

    <el-form-item
      label="间隔时长"
      :label-width="firstLabelWidth"
      v-if="selectTargetData[0].option.globalConfig.autoCarousel"
    >
      <SwInputNumber
        v-model="selectTargetData[0].option.globalConfig.tabIntervalTime"
        :min="0"
        unit="s"
        @change="update"
      />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio as SwRadio } from "@screenwright/ui/radio";
import Icon from "@editor/base/Icon/index.vue";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const componentScopeOptions = [
  { label: "竖排", value: "column" },
  { label: "横排", value: "row" }
];
</script>
