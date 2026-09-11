<template>
  <div class="item-zebra-bar-and-line-line-setting">
    <sw-collapse-item title="区域" v-if="showSeriesAreaColor" open>
      <template #content>
        <el-form-item label="颜色" :label-width="thirdLabelWidth">
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            :key="selectTargetData[0].option.seriesAreaColor[currentIndex]"
            v-model:color="selectTargetData[0].option.seriesAreaColor[currentIndex]"
            v-model:opacity="selectTargetData[0].option.seriesAreaOpacity[currentIndex]"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="折线" open>
      <template #content>
        <el-form-item label="颜色" :label-width="thirdLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.seriesLineColor[currentIndex]"
            @change="update"
            v-if="useSingleColorPicker"
          />
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single' }"
            v-model:color="selectTargetData[0].option.seriesLineColor[currentIndex]"
            v-model:opacity="selectTargetData[0].option.seriesLineOpacity[currentIndex]"
            @change="update"
            v-else
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="thirdLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.seriesLineWidth[currentIndex]" @change="update" />
        </el-form-item>
        <el-form-item label="曲线" :label-width="thirdLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.seriesSmoothShow[currentIndex]" />
        </el-form-item>
        <el-form-item
          label="曲线张力"
          :label-width="thirdLabelWidth"
          v-if="selectTargetData[0].option.seriesSmoothShow[currentIndex]"
        >
          <sw-slider
            @change="update"
            v-model="selectTargetData[0].option.seriesSmooth[currentIndex]"
            :max="1"
            :step="0.1"
          />
        </el-form-item>
        <el-form-item label="空值连接" :label-width="38" title="空值连接">
          <el-checkbox
            @change="update"
            v-model="selectTargetData[0].option.seriesConnectNulls[currentIndex]"
            style="margin-left: 10px"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item
      title="数据标记"
      v-model="selectTargetData[0].option.seriesSymbolShow[currentIndex]"
      showIcon
      @change="update"
    >
      <template #content>
        <el-form-item label="标记图形" :label-width="38" title="标记图形">
          <el-select
            v-model="selectTargetData[0].option.seriesSymbol[currentIndex]"
            popper-class="sw-select-dropdown"
            @change="update"
            style="margin-left: 10px"
          >
            <el-option v-for="item in seriesSymbol" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="图片"
          :label-width="thirdLabelWidth"
          v-if="selectTargetData[0].option.seriesSymbol[currentIndex] === 'image'"
        >
          <sw-upload
            v-model="selectTargetData[0].option.seriesSymbolImage[currentIndex]"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>
        <el-form-item label="颜色" :label-width="thirdLabelWidth" v-else>
          <sw-single-color-picker v-model="selectTargetData[0].option.seriesItemColor[currentIndex]" @change="update" />
        </el-form-item>
        <el-form-item label="尺寸" :label-width="thirdLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.seriesSymbolWidth[currentIndex]"
              unit="px"
              bottomLabel="宽度"
              :min="0"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.seriesSymbolHeight[currentIndex]"
              unit="px"
              bottomLabel="高度"
              :min="0"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item
          label="边框宽度"
          :label-width="38"
          title="边框宽度"
          v-if="selectTargetData[0].option.seriesSymbol[currentIndex] !== 'image'"
        >
          <sw-input-number
            v-model.number="selectTargetData[0].option.seriesItemBorderWidth[currentIndex]"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
            style="margin-left: 10px"
          />
        </el-form-item>
        <el-form-item
          label="边框颜色"
          :label-width="38"
          title="边框颜色"
          v-if="selectTargetData[0].option.seriesSymbol[currentIndex] !== 'image'"
        >
          <sw-single-color-picker
            v-model="selectTargetData[0].option.seriesItemBorderColor[currentIndex]"
            @change="update"
            style="margin-left: 10px"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item
      title="数值标签"
      showIcon
      v-model="selectTargetData[0].option.seriesLabelShow[currentIndex]"
      @change="update"
    >
      <template #content>
        <el-form-item label="文本样式" :label-width="38" title="文本样式">
          <ConfigTextStyle
            v-model="fieldStyleList[currentIndex]"
            @change="(Key: string, val: any) => handleFieldStyleChange(Key, val)"
            style="margin-left: 10px"
          />
        </el-form-item>
        <el-form-item label="偏移" :label-width="thirdLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model.number="selectTargetData[0].option.seriesLabelOffsetX[currentIndex]"
              unit="px"
              bottomLabel="X"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model.number="selectTargetData[0].option.seriesLabelOffsetY[currentIndex]"
              unit="px"
              bottomLabel="Y"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <!-- 文本自定义 -->
        <ItemTextDynamic
          v-if="showTextDynamic"
          :currentIndex="currentIndex"
          :showMarkLineLabelCustom="showMarkLineLabelCustom"
          :labelWidth="thirdLabelWidth"
        />
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import SwUpload from "@editor/base/SwUpload/index.vue";
import { capitalizeFirstLetter } from "@editor/attrsRender/utils";

import ConfigTextStyle from "../../../components/configTextStyle/index.vue";
import { thirdLabelWidth } from "../../../constants";
import { seriesSymbol } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import ItemTextDynamic from "../ItemTextDynamic/index.vue";

const { selectTargetData, update } = useUpdateInstance();
const props = withDefaults(
  defineProps<{
    currentIndex: number;
    useSingleColorPicker?: boolean;
    showSeriesAreaColor?: boolean;
    showMarkLineLabelCustom?: boolean;
    showTextDynamic?: boolean;
  }>(),
  {
    useSingleColorPicker: false,
    showSeriesAreaColor: false,
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

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
