<template>
  <div class="echartgaugeAttrs">
    <SwCollapseItem title="数值标签" @change="update" show-icon v-model="selectTargetData[0].option.seriesDetailShow">
      <template #content>
        <el-form-item label="小数位数" title="小数位数" :label-width="secondLabelWidth">
          <sw-input-number
            @change="update"
            controls
            v-model="selectTargetData[0].option.seriesDetailPercentValue"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesDetailOffsetX"
              bottomLabel="x"
              unit="px"
              @change="update"
              width="90"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.seriesDetailOffsetY"
              bottomLabel="y"
              unit="px"
              @change="update"
              width="90"
            />
          </div>
        </el-form-item>
        <SwCollapseItem
          @change="update"
          title="前缀"
          show-icon
          v-model="selectTargetData[0].option.seriesDetailPrefixShow"
        >
          <template #content>
            <el-form-item label="内容" :label-width="thirdLabelWidth">
              <sw-input @change="update" v-model="selectTargetData[0].option.seriesDetailPrefix" />
            </el-form-item>
            <el-form-item label="间距" :label-width="thirdLabelWidth">
              <sw-input-number
                v-model.number="selectTargetData[0].option.seriesDetailPrefixPadding"
                unit="px"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="文本样式" title="文本样式" :label-width="38">
              <ConfigTextStyle v-model="preFixInput" @change="handlePreFixChange" style="margin-left: 10px" />
            </el-form-item>
            <el-form-item label="颜色跟随" title="颜色跟随" :label-width="38">
              <el-checkbox
                style="margin-left: 10px"
                @change="update"
                v-model="selectTargetData[0].option.seriesDetailPrefixColorFollow"
              />
            </el-form-item>
          </template>
        </SwCollapseItem>

        <SwCollapseItem
          @change="update"
          title="后缀"
          show-icon
          v-model="selectTargetData[0].option.seriesDetailUnitShow"
        >
          <template #content>
            <el-form-item label="内容" :label-width="thirdLabelWidth">
              <sw-input @change="update" v-model="selectTargetData[0].option.seriesDetailUnit" />
            </el-form-item>
            <el-form-item label="间距" :label-width="thirdLabelWidth">
              <sw-input-number
                v-model="selectTargetData[0].option.seriesDetailUnitPadding"
                unit="px"
                @change="update"
              />
            </el-form-item>
            <el-form-item label="文本样式" title="文本样式" :label-width="38">
              <ConfigTextStyle v-model="preUnitInput" @change="handleUnitChange" style="margin-left: 10px" />
            </el-form-item>
            <el-form-item label="颜色跟随" title="颜色跟随" :label-width="38">
              <el-checkbox
                @change="update"
                v-model="selectTargetData[0].option.seriesDetailUnitColorFollow"
                style="margin-left: 10px"
              />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesDetailFontFamily",
  fontSize: "seriesDetailFontSize",
  color: "seriesDetailColor",
  fontStyle: "seriesDetailFontStyle",
  fontWeight: "seriesDetailFontWeight"
});
const { input: preFixInput, handleConfigTextChange: handlePreFixChange } = useFontStyleAttrs({
  fontFamily: "seriesDetailPrefixFontFamily",
  fontSize: "seriesDetailPrefixFontSize",
  color: "seriesDetailPrefixColor",
  fontStyle: "seriesDetailPrefixFontStyle",
  fontWeight: "seriesDetailPrefixFontWeight"
});
const { input: preUnitInput, handleConfigTextChange: handleUnitChange } = useFontStyleAttrs({
  fontFamily: "seriesDetailUnitFontFamily",
  fontSize: "seriesDetailUnitFontSize",
  color: "seriesDetailUnitColor",
  fontStyle: "seriesDetailUnitFontStyle",
  fontWeight: "seriesDetailUnitFontWeight"
});
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
}
</style>
