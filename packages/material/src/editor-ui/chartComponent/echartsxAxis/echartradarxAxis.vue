<template>
  <div class="echartradarxAxis">
    <el-form-item label="绘制类型" :label-width="firstLabelWidth">
      <sw-radio v-model="selectTargetData[0].option.radarShape" :option="radarShape" direction="row" @change="update" />
    </el-form-item>
    <el-form-item label="数值范围" :label-width="firstLabelWidth">
      <div class="fullWidth flex flex-center-between">
        <sw-input-number
          v-model="selectTargetData[0].option.radarMin"
          bottomLabel="最小值"
          width="90"
          @change="update"
        />
        <sw-input-number
          v-model="selectTargetData[0].option.radarMax"
          bottomLabel="最大值"
          width="90"
          @change="update"
        />
      </div>
    </el-form-item>
    <sw-collapse-item title="轴线" showIcon v-model="selectTargetData[0].option.radarLineShow" @change="update">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.radarLineColor"
            field="radarLineColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radarLineWidth"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="刻度" showIcon v-model="selectTargetData[0].option.radarTickShow" @change="update">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            v-model="selectTargetData[0].option.radarTickColor"
            field="radarTickColor"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radarTickWidth"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="长度" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radarTickLength"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="刻度标签" showIcon @change="update" v-model="selectTargetData[0].option.radarLabelShow">
      <template #content>
        <el-form-item label="最小刻度" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.radarLabelMinShow" @change="update" />
        </el-form-item>
        <el-form-item label="最大刻度" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.radarLabelMaxShow" @change="update" />
        </el-form-item>
        <el-form-item label="间距" title="间距" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.radarLabelMargin" @change="update" />
        </el-form-item>
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="radarLabelInput" @change="handleRadarLabelConfigTextChange" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="指示器名称" showIcon @change="update" v-model="selectTargetData[0].option.radarNameShow">
      <template #content>
        <el-form-item label="间距" title="间距" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.radarNameGap" @change="update" />
        </el-form-item>
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="radarNameInput" @change="handleRadarNameConfigTextChange" />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="分隔线" showIcon @change="update" v-model="selectTargetData[0].option.radarSplitLineShow">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.radarSplitLineColor" @change="update" />
        </el-form-item>
        <el-form-item label="粗细" :label-width="secondLabelWidth">
          <sw-input-number
            v-model.number="selectTargetData[0].option.radarSplitLineWidth"
            unit="px"
            :min="0"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="分隔区域">
      <template #icon>
        <Icon type="CirclePlus" @click="handleAdd" />
        <Icon type="Delete" @click="handleDelete" />
      </template>
      <template #content>
        <ScreenwrightSeriesTabs v-model="splitAreaTabs" :tabs="selectTargetData[0].option.radarSplitAreaTabsName" />
        <template v-if="currentIndex != -1 && selectTargetData[0].option.radarSplitAreaTabsName.length > 1">
          <el-form-item label="颜色" :label-width="secondLabelWidth">
            <sw-single-color-picker
              v-model="selectTargetData[0].option.radarSplitAreaColor[currentIndex]"
              @change="update"
            />
          </el-form-item>
        </template>
        <el-form-item label="等分值" title="等分值" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.radarSplitNumber" :min="1" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import Icon from "@editor/base/Icon/index.vue";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { radarShape } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import { useSeries } from "../ItemComponent/ItemSeries/useSeries";

const { selectTargetData, update } = useUpdateInstance();
const splitAreaTabs = ref("区域1");
const currentIndex = computed(() => {
  return selectTargetData.value[0].option.radarSplitAreaTabsName.findIndex(
    (item: string) => item === splitAreaTabs.value
  );
});
const list = ["radarSplitAreaColor"];
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list,
  activeTab: splitAreaTabs,
  seriesName: "radarSplitAreaTabsName",
  limitNum: 1,
  sName: "区域"
});
const handleAdd = () => {
  handleAddSeries();
};
const handleDelete = () => {
  handleDeleteSeries();
};
const { input: radarLabelInput, handleConfigTextChange: handleRadarLabelConfigTextChange } = useFontStyleAttrs({
  fontFamily: "radarLabelFontFamily",
  fontSize: "radarLabelFontSize",
  color: "radarLabelColor",
  fontStyle: "radarLabelFontStyle",
  fontWeight: "radarLabelFontWeight"
});
const { input: radarNameInput, handleConfigTextChange: handleRadarNameConfigTextChange } = useFontStyleAttrs({
  fontFamily: "radarNameFontFamily",
  fontSize: "radarNameFontSize",
  color: "radarNameColor",
  fontStyle: "radarNameFontStyle",
  fontWeight: "radarNameFontWeight"
});
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include checkbox-style();
</style>
