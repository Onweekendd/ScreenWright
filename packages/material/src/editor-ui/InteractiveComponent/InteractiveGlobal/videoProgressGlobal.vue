<template>
  <div class="video-progress-global">
    <div class="flex flex-justify-between" style="width: 80%">
      <el-form-item label="显示进度" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isShowProgress" @change="update" />
      </el-form-item>
      <el-form-item label="显示总进度" :label-width="secondLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isShowTotalProgress" @change="update" />
      </el-form-item>
    </div>

    <div class="flex flex-justify-between" style="width: 80%">
      <el-form-item label="禁用" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.disabled" @change="update" />
      </el-form-item>
      <el-form-item label="显示分割线" :label-width="secondLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.isShowDivider" @change="update" />
      </el-form-item>
    </div>
    <SwCollapseItem title="常规配置">
      <template #content>
        <el-form-item label="默认条形色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.defaultColor" @change="update" />
        </el-form-item>
        <el-form-item label="高亮条形色" :label-width="secondLabelWidth">
          <SwColorPicker
            :options="{ colorTypeOption: 'linear-gradient,single', returnType: 'rgba' }"
            v-model:color="selectTargetData[0].option.seriesBgColor"
            v-model:opacity="selectTargetData[0].option.seriesOpacity"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
const { selectTargetData, update } = useUpdateInstance();
</script>
