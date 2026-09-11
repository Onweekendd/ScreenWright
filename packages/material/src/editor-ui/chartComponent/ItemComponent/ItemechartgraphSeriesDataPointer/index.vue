<template>
  <sw-collapse-item title="数据节点" open>
    <template #icon>
      <Icon type="CirclePlus" @click="addPoint" />
      <Icon type="Delete" @click="deletePoint" />
    </template>
    <template #content>
      <ScreenwrightSeriesTabs v-model="pointTabs" :tabs="selectTargetData[0].option.points" />

      <el-form-item label="节点" :label-width="secondLabelWidth">
        <div class="fullWidth flex flex-center-between">
          <sw-input
            width="90"
            v-model="selectTargetData[0].data[currentIndex].name"
            bottomLabel="名称"
            @change="update"
          />
          <sw-input
            width="90"
            v-model="selectTargetData[0].data[currentIndex].value"
            bottomLabel="数值"
            @change="update"
          />
        </div>
      </el-form-item>
      <el-form-item label="图形" title="图形" :label-width="secondLabelWidth">
        <el-select
          @change="update"
          v-model="selectTargetData[0].option.pointsSymbol[currentIndex]"
          popper-class="sw-select-dropdown"
        >
          <el-option v-for="item in seriesSymbol" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        label="图片"
        :label-width="thirdLabelWidth"
        v-if="selectTargetData[0].option.pointsSymbol[currentIndex] === 'image'"
      >
        <sw-upload
          @change="update"
          @delete="update"
          v-model="selectTargetData[0].option.pointsSymbolImage[currentIndex]"
          :multiple="false"
          :showFileList="false"
        />
      </el-form-item>
      <el-form-item label="颜色" v-else :label-width="secondLabelWidth">
        <sw-single-color-picker
          @change="update"
          v-model="selectTargetData[0].option.pointColor[currentIndex]"
          field="pointColor"
        />
      </el-form-item>
      <div class="second_collapse">
        <sw-collapse-item title="数值标签" open>
          <template #content>
            <el-form-item label="标签位置" title="标签位置" :label-width="38">
              <el-select
                @change="update"
                v-model="selectTargetData[0].option.labelPosition[currentIndex]"
                popper-class="sw-select-dropdown"
                style="margin-left: 10px"
              >
                <el-option v-for="item in labelPosition" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <ItemSelectAlign
              @change="update"
              :type="typeAttrs.defaultWithThree"
              v-model="selectTargetData[0].option.seriesLabelAlign[currentIndex]"
              :labelWidth="38"
              label="水平对齐"
              marginLeft="10px"
            />
            <ItemSelectAlign
              @change="update"
              :type="typeAttrs.verticalWithMiddle"
              v-model="selectTargetData[0].option.seriesLabelVerticalAlign[currentIndex]"
              :labelWidth="38"
              label="垂直对齐"
              marginLeft="10px"
            />
            <SeriesLabel :currentIndex="currentIndex" />
          </template>
        </sw-collapse-item>
      </div>
    </template>
  </sw-collapse-item>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { ScreenwrightSeriesTabs as ScreenwrightSeriesTabs } from "@screenwright/ui";
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
import Icon from "@editor/base/Icon/index.vue";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import { secondLabelWidth, thirdLabelWidth } from "../../../constants";
import { labelPosition, seriesSymbol } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";
import { useSeries } from "../../ItemComponent/ItemSeries/useSeries";
import SeriesLabel from "./seriesLabel.vue";

const pointTabs = ref("节点1");

const currentIndex = computed(() => {
  return selectTargetData.value[0].option.points.indexOf(pointTabs.value);
});
const { selectTargetData, update } = useUpdateInstance();

const list = [
  "pointsSymbol",
  "pointsSymbolImage",
  "pointColor",
  "labelPosition",
  "seriesLabelAlign",
  "seriesLabelVerticalAlign",
  "seriesLabelNameShow",
  "seriesLabelNameFontFamily",
  "seriesLabelNameColor",
  "seriesLabelNameFontSize",
  "seriesLabelNameFontStyle",
  "seriesLabelNameFontWeight",
  "seriesLabelValueShow",
  "seriesLabelValueFontFamily",
  "seriesLabelValueFontSize",
  "seriesLabelValueColor",
  "seriesLabelValueFontStyle",
  "seriesLabelValueFontWeight"
];
const { handleAddSeries, handleDeleteSeries } = useSeries({
  list,
  activeTab: pointTabs,
  seriesName: "points",
  limitNum: 1,
  sName: "节点"
});
const addPoint = () => {
  handleAddSeries();
};

const deletePoint = () => {
  handleDeleteSeries();
};
</script>

<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
}
</style>
