<template>
  <sw-collapse-item title="柱状样式" open>
    <template #content>
      <el-form-item label="柱体宽度" :label-width="secondLabelWidth">
        <sw-slider @change="update" v-model="selectTargetData[0].option.seriesWidth[currentIndex]" :max="40" :min="1" />
      </el-form-item>
      <el-form-item label="柱体颜色" :label-width="secondLabelWidth" v-if="activeTab === '系列1'">
        <sw-color-picker
          @change="update"
          :options="{ colorTypeOption: 'linear-gradient,single' }"
          v-model:color="selectTargetData[0].option.barBodyColor[currentIndex]"
          v-model:opacity="selectTargetData[0].option.barBodyOpacity[currentIndex]"
          :inputWidth="80"
        />
      </el-form-item>
      <template v-if="activeTab === '系列2'">
        <el-form-item label="边框颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker @change="update" v-model="selectTargetData[0].option.barBorderColor" />
        </el-form-item>
        <el-form-item label="柱体颜色" :label-width="secondLabelWidth">
          <sw-color-picker
            @change="update"
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="selectTargetData[0].option.barBodyColor[currentIndex]"
            v-model:opacity="selectTargetData[0].option.barBodyOpacity[currentIndex]"
          />
        </el-form-item>
        <el-form-item label="边框大小" v-if="activeTab === '系列2'" :label-width="secondLabelWidth">
          <sw-slider @change="update" v-model="selectTargetData[0].option.borderWidth" :max="40" :min="1" />
        </el-form-item>
      </template>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
defineProps<{
  currentIndex: number;
  activeTab: string;
}>();
</script>
