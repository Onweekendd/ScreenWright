<template>
  <div class="echartringGlobal">
    <el-form-item label="条形类型" :label-width="firstLabelWidth">
      <el-select
        v-model="selectTargetData[0].option.barBorderRadius"
        popper-class="sw-select-dropdown"
        placeholder="Select"
        style="width: 100%"
        @change="update"
      >
        <el-option v-for="item in barType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="圆心位置" :label-width="firstLabelWidth">
      <div class="flex flex-center-between" style="width: 100%">
        <sw-input-number
          v-model.number="selectTargetData[0].option.centerX"
          unit="%"
          bottomLabel="X"
          width="100"
          :min="0"
          :max="100"
          @change="update"
        />
        <sw-input-number
          v-model.number="selectTargetData[0].option.centerY"
          unit="%"
          bottomLabel="Y"
          :min="0"
          width="100"
          :max="100"
          @change="update"
        />
      </div>
    </el-form-item>
    <el-form-item label="半径" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.radiusMax" @change="update" />
    </el-form-item>
    <el-form-item label="最小半径" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.radiusMin" :min="5" @change="update" />
    </el-form-item>
    <el-form-item label="起始角度" :label-width="firstLabelWidth">
      <sw-slider v-model="selectTargetData[0].option.startAngle" :min="0" :max="360" @change="update" />
    </el-form-item>
    <el-form-item label="颜色" :label-width="firstLabelWidth">
      <sw-color-picker
        :options="{ colorTypeOption: 'linear-gradient,single' }"
        v-model:color="selectTargetData[0].option.seriesColor"
        v-model:opacity="selectTargetData[0].option.seriesOpacity"
        @change="update"
      />
    </el-form-item>
    <SwCollapseItem @change="update" title="数值标签" show-icon v-model="selectTargetData[0].option.seriesLabelShow">
      <template #content>
        <el-form-item label="后缀" :label-width="secondLabelWidth">
          <sw-input @change="update" v-model="selectTargetData[0].option.seriesLabelUtil" />
        </el-form-item>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between" style="width: 100%">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesLabelOffsetX"
              unit="px"
              bottomLabel="X"
              @change="update"
              width="100"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.seriesLabelOffsetY"
              unit="px"
              bottomLabel="Y"
              @change="update"
              width="100"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSlider } from "@screenwright/ui/slider";
import { barType } from "@editor/components/configStripStyle/options";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelFontFamily",
  fontSize: "seriesLabelFontSize",
  color: "seriesLabelColor",
  fontStyle: "seriesLabelFontStyle",
  fontWeight: "seriesLabelFontWeight"
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.echartringGlobal {
  @include common-element-style(".el-select__wrapper");
  @include checkbox-style();
  :deep(.el-select__wrapper) {
    min-height: 28px;
  }
}
</style>
