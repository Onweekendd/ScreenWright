<template>
  <div class="echartliquid-fill-global">
    <SwCollapseItem title="水球样式" open>
      <template #content>
        <el-form-item label="圆心位置" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              width="90"
              unit="%"
              v-model="selectTargetData[0].option.centerX"
              bottomLabel="X"
              @change="update"
            />
            <sw-input-number
              width="90"
              unit="%"
              v-model="selectTargetData[0].option.centerY"
              @change="update"
              bottomLabel="Y"
            />
          </div>
        </el-form-item>

        <el-form-item label="半径" :label-width="secondLabelWidth">
          <sw-slider v-model="selectTargetData[0].option.radius" @change="update" />
        </el-form-item>
        <el-form-item label="形状" :label-width="secondLabelWidth">
          <el-select popper-class="sw-select-dropdown" v-model="selectTargetData[0].option.shape" @change="update">
            <el-option v-for="item in liquidFillShape" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="背景颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="水波样式" open>
      <template #content>
        <el-form-item label="移动" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.waveAnimation" @change="update" />
        </el-form-item>
        <el-form-item label="水波宽高" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              v-model="selectTargetData[0].option.waveLength"
              width="90"
              unit="%"
              bottomLabel="宽度"
              :min="0"
              :max="100"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.amplitude"
              width="90"
              unit="%"
              bottomLabel="高度"
              :min="0"
              :max="100"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <el-form-item label="水波方向" :label-width="secondLabelWidth">
          <sw-radio
            :option="waveDirection"
            v-model="selectTargetData[0].option.direction"
            direction="row"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="透明度" :label-width="secondLabelWidth">
          <sw-slider
            v-model="selectTargetData[0].option.seriesItemStyleOpacity"
            :max="1"
            :step="0.01"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="数值标签" @change="update" show-icon v-model="selectTargetData[0].option.seriesLabelShow">
      <template #content>
        <el-form-item label="位置" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              width="90"
              v-model="selectTargetData[0].option.seriesLabelPositionX"
              unit="%"
              bottomLabel="X"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              width="90"
              v-model="selectTargetData[0].option.seriesLabelPositionY"
              unit="%"
              bottomLabel="Y"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>
        <ItemSelectAlign
          :label-width="secondLabelWidth"
          label="对齐方式"
          :type="typeAttrs.defaultWithThree"
          v-model="selectTargetData[0].option.seriesLabelAlign"
          @change="update"
        />
        <ItemSelectAlign
          :label-width="secondLabelWidth"
          label="对齐方式"
          :type="typeAttrs.verticalWithMiddle"
          v-model="selectTargetData[0].option.seriesLabelBaseline"
          @change="update"
        />
        <SwCollapseItem
          title="类目"
          @change="update"
          show-icon
          v-model="selectTargetData[0].option.seriesLabelSeriesShow"
        >
          <template #content>
            <el-form-item label="文本样式" :label-width="thirdLabelWidth">
              <!--  -->
              <ConfigTextStyle v-model="labelInput" @change="handleLabelInputChange" :showLetterSpacing="true" />
            </el-form-item>
            <el-form-item label="间距" :label-width="thirdLabelWidth">
              <sw-input-number
                v-model="selectTargetData[0].option.seriesLabelSeriesBottomPadding"
                unit="px"
                :controls="false"
                @change="update"
              />
            </el-form-item>
          </template>
        </SwCollapseItem>
        <SwCollapseItem
          title="占比值"
          @change="update"
          show-icon
          v-model="selectTargetData[0].option.seriesLabelPercentShow"
        >
          <template #content>
            <el-form-item label="小数位数" :label-width="thirdLabelWidth">
              <sw-input-number v-model="selectTargetData[0].option.seriesLabelPercentValue" @change="update" />
            </el-form-item>
            <el-form-item label="文本样式" :label-width="thirdLabelWidth">
              <ConfigTextStyle
                v-model="labelPercentInput"
                @change="handleLabelPercentInputChange"
                :showLetterSpacing="true"
              />
            </el-form-item>
            <el-form-item label="水内颜色" :label-width="thirdLabelWidth">
              <sw-single-color-picker v-model="selectTargetData[0].option.seriesLabelInsideColor" @change="update" />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="轮廓" @change="update" show-icon v-model="selectTargetData[0].option.outlineShow">
      <template #content>
        <el-form-item label="颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.outlineColor" @change="update" />
        </el-form-item>
        <el-form-item label="边框颜色" :label-width="secondLabelWidth">
          <sw-single-color-picker v-model="selectTargetData[0].option.outlineBorderColor" @change="update" />
        </el-form-item>
        <el-form-item label="边框宽度" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.outlineBorderWidth"
            unit="px"
            :controls="false"
            @change="update"
          />
        </el-form-item>
        <el-form-item label="边框间距" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.outlineBorderDistance"
            unit="px"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import ConfigTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import ItemSelectAlign from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/index.vue";
import { typeAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const { input: labelInput, handleConfigTextChange: handleLabelInputChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelSeriesFontFamily",
  fontStyle: "seriesLabelSeriesFontStyle",
  fontWeight: "seriesLabelSeriesFontWeight",
  fontSize: "seriesLabelSeriesFontSize",
  color: "seriesLabelSeriesColor"
});

const { input: labelPercentInput, handleConfigTextChange: handleLabelPercentInputChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelPercentFontFamily",
  fontStyle: "seriesLabelPercentFontStyle",
  fontWeight: "seriesLabelSeriesFontWeight",
  fontSize: "seriesLabelPercentFontWeight",
  color: "seriesLabelPercentColor"
});

const waveDirection = [
  { label: "左", value: "left" },
  { label: "右", value: "right" }
];
const liquidFillShape = [
  {
    label: "圆",
    value: "circle"
  },
  {
    label: "方形",
    value: "rect"
  },
  {
    label: "方圆形",
    value: "roundRect"
  },
  {
    label: "三角形",
    value: "triangle"
  },
  {
    label: "菱形",
    value: "diamond"
  },
  {
    label: "水滴形",
    value: "pin"
  },
  {
    label: "箭头形",
    value: "arrow"
  },
  {
    label: "覆盖",
    value: "container"
  }
];
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
