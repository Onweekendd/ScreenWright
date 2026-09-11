<template>
  <div class="ItemZebraBarAmdLineBarSetting">
    <sw-collapse-item title="柱形" open>
      <template #content>
        <el-form-item label="宽度" :label-width="thirdLabelWidth" v-if="showSeriesWidth">
          <sw-slider
            v-model="selectTargetData[0].option.seriesWidth[currentIndex]"
            :max="40"
            :min="1"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="颜色" :label-width="thirdLabelWidth">
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            @change="update"
            v-model:color="selectTargetData[0].option.seriesBarColor[currentIndex]"
            v-model:opacity="selectTargetData[0].option.seriesBarOpacity[currentIndex]"
          />
        </el-form-item>
        <el-form-item label="间隔颜色" :label-width="thirdLabelWidth" v-if="showIntervalColor">
          <sw-single-color-picker v-model="selectTargetData[0].option.intervalColor[currentIndex]" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <template v-if="showSeriesLabel">
      <sw-collapse-item
        title="数值标签"
        showIcon
        v-model="selectTargetData[0].option.seriesLabelShow[currentIndex]"
        @change="update"
      >
        <template #content>
          <el-form-item label="文本样式" :label-width="thirdLabelWidth">
            <ConfigTextStyle
              v-model="fieldStyleList[currentIndex]"
              @change="(Key: string, val: any) => handleFieldStyleChange(Key, val)"
            />
          </el-form-item>
          <el-form-item label="偏移" :label-width="thirdLabelWidth">
            <div class="fullWidth flex flex-center-between">
              <sw-input-number
                v-model.number="selectTargetData[0].option.seriesLabelOffsetX[currentIndex]"
                unit="px"
                bottomLabel="X"
                :controls="false"
                width="90"
                @change="update"
              />
              <sw-input-number
                v-model.number="selectTargetData[0].option.seriesLabelOffsetY[currentIndex]"
                unit="px"
                bottomLabel="Y"
                :controls="false"
                width="90"
                @change="update"
              />
            </div>
          </el-form-item>
          <!-- 文本自定义 -->
          <ItemTextDynamic
            v-if="showTextDynamic"
            :currentIndex="currentIndex"
            :labelWidth="thirdLabelWidth"
            :showMarkLineLabelCustom="showMarkLineLabelCustom"
          />
        </template>
      </sw-collapse-item>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import { capitalizeFirstLetter } from "@editor/attrsRender/utils";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { thirdLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import ItemTextDynamic from "../ItemTextDynamic/index.vue";

const { selectTargetData, update } = useUpdateInstance();
const props = withDefaults(
  defineProps<{
    currentIndex: number;
    showSeriesWidth?: boolean;
    showIntervalColor?: boolean;
    showSeriesLabel?: boolean;
    showMarkLineLabelCustom?: boolean;
    showTextDynamic?: boolean;
  }>(),
  {
    currentIndex: 0,
    showSeriesWidth: true,
    showIntervalColor: true,
    showSeriesLabel: false,
    showMarkLineLabelCustom: true,
    showTextDynamic: false
  }
);
const fieldStyleList = ref<any[]>([]);
const init = () => {
  fieldStyleList.value = [];
  selectTargetData.value[0].option.seriesTabsName.forEach((item: any, index: number) => {
    fieldStyleList.value.push({
      fontFamily: selectTargetData.value[0].option.seriesLabelFontFamily[index],
      fontSize: selectTargetData.value[0].option.seriesLabelFontSize[index],
      color: selectTargetData.value[0].option.seriesLabelColor[index],
      fontStyle: selectTargetData.value[0].option.seriesLabelFontStyle[index],
      fontWeight: selectTargetData.value[0].option.seriesLabelFontWeight[index]
    });
  });
};
const handleFieldStyleChange = (key: string, val: any) => {
  selectTargetData.value[0].option[`seriesLabel${capitalizeFirstLetter(key)}`][props.currentIndex] = val[key];
  update();
};
watch(
  () => selectTargetData.value[0],
  (nval, oval) => {
    if (
      nval &&
      (nval.id == oval?.id || oval == null) &&
      nval.option.seriesTabsName.length != oval?.option.seriesTabsName.length
    ) {
      init();
    }
  },
  { immediate: true, deep: true }
);
</script>
