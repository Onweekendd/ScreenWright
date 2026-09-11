<template>
  <sw-collapse-item title="数值标签" showIcon v-model="selectTargetData[0].option.valueShow[currentIndex]">
    <template #content>
      <el-form-item label="文本样式" :label-width="secondLabelWidth">
        <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
      </el-form-item>
      <template v-if="activeTab === '系列1'">
        <el-form-item label="分隔线大小" :label-width="secondLabelWidth">
          <sw-slider @change="update" v-model="selectTargetData[0].option.splitLineFontSize" :max="40" :min="1" />
        </el-form-item>
        <el-form-item label="分隔线颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            field="splitLineColor"
            v-model="selectTargetData[0].option.splitLineColor"
            width="80"
          />
        </el-form-item>
      </template>
      <el-form-item label="偏移" :label-width="secondLabelWidth">
        <div class="flex flex-center-between">
          <sw-input-number
            v-model.number="selectTargetData[0].option.valueOffSetX[currentIndex]"
            unit="px"
            bottomLabel="X"
            :controls="false"
            @change="update"
          />
          <sw-input-number
            v-model.number="selectTargetData[0].option.valueOffSetY[currentIndex]"
            unit="px"
            bottomLabel="Y"
            :controls="false"
            @change="update"
          />
        </div>
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const props = defineProps<{
  currentIndex: number;
  activeTab: string;
}>();

const { input, handleConfigTextChange } = useFontStyleAttrs(
  {
    fontFamily: "valueFontFamily",
    fontSize: "valueFontSize",
    color: "valueColor",
    fontStyle: "valueFontStyle",
    fontWeight: "valueFontWeight"
  },
  props.currentIndex
);
</script>
