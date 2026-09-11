<template>
  <div class="echartprogressAttrs">
    <SwCollapseItem title="数值标签" @change="update" show-icon v-model="selectTargetData[0].option.seriesLabelShow">
      <template #content>
        <el-form-item label="显示" :label-width="secondLabelWidth">
          <sw-radio
            @change="update"
            direction="row"
            v-model="selectTargetData[0].option.seriesLabelType"
            :option="progressSeriesLabelType"
          />
        </el-form-item>
        <el-form-item label="小数位数" title="小数位数" :label-width="secondLabelWidth">
          <sw-input-number
            @change="update"
            controls
            v-model="selectTargetData[0].option.seriesLabelPercentValue"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="文本样式" title="文本样式" :label-width="secondLabelWidth">
          <ConfigTextStyle v-model="input" @change="handleConfigTextChange" />
        </el-form-item>
        <el-form-item label="偏移" :label-width="secondLabelWidth">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.seriesLabelOffsetX"
              bottomLabel="x"
              unit="px"
              @change="update"
              width="90"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.seriesLabelOffsetY"
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
          v-model="selectTargetData[0].option.seriesLabelPrefixShow"
        >
          <template #content>
            <el-form-item label="内容" :label-width="thirdLabelWidth">
              <sw-input @change="update" v-model="selectTargetData[0].option.seriesLabelPrefix" />
            </el-form-item>
            <el-form-item label="间距" :label-width="thirdLabelWidth">
              <sw-input-number
                v-model.number="selectTargetData[0].option.seriesLabelPrefixPadding"
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
                v-model="selectTargetData[0].option.seriesLabelPrefixColorFollow"
              />
            </el-form-item>
          </template>
        </SwCollapseItem>

        <SwCollapseItem
          @change="update"
          title="后缀"
          show-icon
          v-model="selectTargetData[0].option.seriesLabelUnitShow"
        >
          <template #content>
            <el-form-item label="内容" :label-width="thirdLabelWidth">
              <sw-input @change="update" v-model="selectTargetData[0].option.seriesLabelUnit" />
            </el-form-item>
            <el-form-item label="间距" :label-width="thirdLabelWidth">
              <sw-input-number v-model="selectTargetData[0].option.seriesLabelUnitPadding" unit="px" @change="update" />
            </el-form-item>
            <el-form-item label="文本样式" title="文本样式" :label-width="38">
              <ConfigTextStyle v-model="preUnitInput" @change="handleUnitChange" style="margin-left: 10px" />
            </el-form-item>
            <el-form-item label="颜色跟随" title="颜色跟随" :label-width="38">
              <el-checkbox
                @change="update"
                v-model="selectTargetData[0].option.seriesLabelUnitColorFollow"
                style="margin-left: 10px"
              />
            </el-form-item>
          </template>
        </SwCollapseItem>
      </template>
    </SwCollapseItem>
    <SwCollapseItem @change="update" title="顶部图标" show-icon v-model="selectTargetData[0].option.headImgShow">
      <template #content>
        <el-form-item label="图片" :label-width="secondLabelWidth">
          <sw-upload v-model="selectTargetData[0].option.headImg" @change="update" @delete="update" />
        </el-form-item>
        <el-form-item :label-width="secondLabelWidth" label="尺寸">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.headImgWidth"
              bottomLabel="宽度"
              unit="px"
              @change="update"
              width="90"
              :min="0"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.headImgHeight"
              bottomLabel="高度"
              unit="px"
              @change="update"
              width="90"
              :min="0"
            />
          </div>
        </el-form-item>
        <el-form-item :label-width="secondLabelWidth" label="偏移">
          <div class="fullWidth flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.headImgOffsetX"
              bottomLabel="X"
              unit="px"
              @change="update"
              width="90"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.headImgOffsetY"
              bottomLabel="Y"
              unit="px"
              @change="update"
              width="90"
            />
          </div>
        </el-form-item>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import SwUpload from "@editor/base/SwUpload/index.vue";

import ConfigTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { secondLabelWidth, thirdLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();
const progressSeriesLabelType = ref([
  { label: "百分比", value: "percent" },
  { label: "真实值", value: "value" }
]);
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelFontFamily",
  fontSize: "seriesLabelFontSize",
  color: "seriesLabelColor",
  fontStyle: "seriesLabelFontStyle",
  fontWeight: "seriesLabelFontWeight"
});
const { input: preFixInput, handleConfigTextChange: handlePreFixChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelPrefixFontFamily",
  fontSize: "seriesLabelPrefixFontSize",
  color: "seriesLabelPrefixColor",
  fontStyle: "seriesLabelPrefixFontStyle",
  fontWeight: "seriesLabelPrefixFontWeight"
});
const { input: preUnitInput, handleConfigTextChange: handleUnitChange } = useFontStyleAttrs({
  fontFamily: "seriesLabelUnitFontFamily",
  fontSize: "seriesLabelUnitFontSize",
  color: "seriesLabelUnitColor",
  fontStyle: "seriesLabelUnitFontStyle",
  fontWeight: "seriesLabelUnitFontWeight"
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
