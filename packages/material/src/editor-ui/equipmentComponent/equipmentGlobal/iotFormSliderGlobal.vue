<template>
  <div class="iotForm-slider-global">
    <div class="flex flex-wrap">
      <el-form-item label="显示文本" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.showLabel" @change="update" />
      </el-form-item>

      <el-form-item label="显示数值" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.showValue" @change="update" />
      </el-form-item>

      <el-form-item label="竖向模式" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.vertical" @change="update" />
      </el-form-item>

      <el-form-item label="禁用" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.disabled" @change="update" />
      </el-form-item>

      <el-form-item label="显示间断点" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.showStops" @change="update" />
      </el-form-item>

      <el-form-item label="步长" :label-width="firstLabelWidth">
        <sw-input-number
          v-model="selectTargetData[0].option.step"
          :controls="false"
          style="width: 60px"
          @change="update"
        />
      </el-form-item>
    </div>

    <sw-collapse-item title="常规配置">
      <template #content>
        <el-form-item label="背景图" :label-width="secondLabelWidth">
          <sw-upload
            v-model="selectTargetData[0].option.backgroudImage"
            :multiple="false"
            :showFileList="false"
            @change="update"
            @delete="update"
          />
        </el-form-item>

        <el-form-item label="尺寸类型" :label-width="secondLabelWidth" v-if="selectTargetData[0].option.backgroudImage">
          <el-select
            v-model="selectTargetData[0].option.backgroudSize"
            popper-class="sw-select-dropdown"
            @change="update"
          >
            <el-option v-for="item in backgroundImageType" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>

        <el-form-item label="面板边距" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.paddingTop"
              unit="px"
              :controls="false"
              bottomLabel="上下"
              :max="
                (selectTargetData[0].component.height -
                  (selectTargetData[0].option.fontSize > selectTargetData[0].option.size
                    ? selectTargetData[0].option.fontSize
                    : selectTargetData[0].option.size)) /
                2
              "
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.paddingLeft"
              unit="px"
              :controls="false"
              bottomLabel="左右"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="条形大小" :label-width="secondLabelWidth">
          <sw-input-number v-model="selectTargetData[0].option.size" unit="px" :controls="false" @change="update" />
        </el-form-item>

        <el-form-item label="条形阈值" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.min"
              bottomLabel="最小值"
              :controls="false"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.max"
              bottomLabel="最大值"
              :controls="false"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="默认条形色" :label-width="secondLabelWidth">
          <sw-single-color-picker
            field="activeColor"
            v-model="selectTargetData[0].option.defaultColor"
            :presetColor="selectTargetData[0].option.defaultColor"
            @change="update"
          />
        </el-form-item>

        <el-form-item
          label="高亮面积"
          v-if="has(selectTargetData[0].option, 'highlightArea')"
          :label-width="secondLabelWidth"
        >
          <sw-radio
            direction="row"
            :option="HighlightArea"
            v-model="selectTargetData[0].option.highlightArea"
            @change="update"
          />
        </el-form-item>

        <el-form-item label="高亮条形色" :label-width="secondLabelWidth">
          <sw-color-picker
            v-if="selectTargetData[0].option.seriesBgColor"
            v-model:color="selectTargetData[0].option.seriesBgColor"
            v-model:opacity="selectTargetData[0].option.seriesOpacity"
            :options="{ colorTypeOption: 'linear-gradient,single', returnType: 'rgba' }"
            field="seriesBgColor"
            @change="update"
          />
          <sw-single-color-picker
            v-else
            field="activeColor"
            v-model="selectTargetData[0].option.activeColor"
            :presetColor="selectTargetData[0].option.activeColor"
            @change="update"
          />
        </el-form-item>

        <el-form-item
          label="圆角"
          v-if="has(selectTargetData[0].option, 'borderRadius')"
          :label-width="secondLabelWidth"
        >
          <sw-input-number
            v-model="selectTargetData[0].option.borderRadius"
            unit="px"
            :controls="false"
            @change="update"
          />
        </el-form-item>
      </template>
    </sw-collapse-item>
    <sw-collapse-item title="文本配置">
      <template #content>
        <el-form-item label="样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <sw-input-number
                v-model="selectTargetData[0].option.letterSpacing"
                unit="px"
                :controls="false"
                bottomLabel="字距"
                @change="update"
                width="70"
                style="margin-left: 10px"
              />
            </template>
          </configTextStyle>
        </el-form-item>

        <el-form-item label="文本偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.textTranslateX"
              unit="px"
              :controls="false"
              bottomLabel="X"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.textTranslateY"
              unit="px"
              :controls="false"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="文本边距" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <sw-input-number
              v-model="selectTargetData[0].option.fontPaddingTop"
              unit="px"
              :controls="false"
              bottomLabel="上下"
              @change="update"
            />
            <sw-input-number
              v-model="selectTargetData[0].option.fontPaddingLeft"
              unit="px"
              :controls="false"
              bottomLabel="左右"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox v-model="selectTargetData[0].option.isTextShadow" @change="update" />
        </el-form-item>
        <ItemTextShadow
          v-if="selectTargetData[0].option.isTextShadow"
          v-model="textShadowInput"
          :label-width="secondLabelWidth"
          label="文本阴影"
          @change="handleConfigTextShadowChange"
        />
      </template>
    </sw-collapse-item>

    <sw-collapse-item title="圆点配置">
      <template #content>
        <el-form-item label="大小" :label-width="secondLabelWidth">
          <sw-input-number
            v-model="selectTargetData[0].option.pointSize"
            unit="px"
            :controls="false"
            @change="update"
          />
        </el-form-item>

        <el-form-item label="类型" v-if="has(selectTargetData[0].option, 'pointType')" :label-width="secondLabelWidth">
          <sw-radio
            direction="row"
            :option="pointType"
            v-model="selectTargetData[0].option.pointType"
            @change="update"
          />
        </el-form-item>
        <div
          v-if="
            (selectTargetData[0].option && selectTargetData[0].option.pointType === 'color') ||
            !has(selectTargetData[0].option, 'pointType')
          "
        >
          <el-form-item
            label="边框颜色"
            v-if="has(selectTargetData[0].option, 'pointBorderColor')"
            :label-width="secondLabelWidth"
          >
            <sw-single-color-picker
              field="pointBorderColor"
              v-model="selectTargetData[0].option.pointBorderColor"
              :presetColor="selectTargetData[0].option.pointBorderColor"
              @change="update"
            />
          </el-form-item>

          <el-form-item label="背景色" :label-width="secondLabelWidth">
            <sw-single-color-picker
              field="pointColor"
              v-model="selectTargetData[0].option.pointColor"
              :presetColor="selectTargetData[0].option.pointColor"
              @change="update"
            />
          </el-form-item>
        </div>
        <div
          v-if="
            (selectTargetData[0].option && selectTargetData[0].option.pointType === 'image') ||
            !has(selectTargetData[0].option, 'placardImg')
          "
        >
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <sw-upload
              v-model="selectTargetData[0].option.placardImg"
              :multiple="false"
              :showFileList="false"
              @change="update"
              @delete="update"
            />
          </el-form-item>
        </div>
      </template>
    </sw-collapse-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { has } from "lodash-es";

import { SwCollapseItem } from "@screenwright/ui";
import { SwColorPicker } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui";
import { SwRadio } from "@screenwright/ui";
import { SwSingleColorPicker } from "@screenwright/ui";
import SwUpload from "@editor/base/SwUpload/index.vue";
import { ItemTextShadow } from "../../../text";
import { useItemTextShadowAttrs } from "../../../text";

import configTextStyle from "../../components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../components/configTextStyle/useTextStyleAttrs";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "fontColor"
});
const { input: textShadowInput, handleConfigTextShadowChange } = useItemTextShadowAttrs({
  preFied: "textShadow",
  color: "color",
  x: "x",
  y: "y",
  blur: "blur"
});

const backgroundImageType = ref([
  { label: "适应", value: "100% 100%" },
  { label: "原比例", value: "contain" },
  { label: "裁切", value: "cover" }
]);

const HighlightArea = ref([
  { label: "占比", value: "percent" },
  { label: "铺满", value: "all" }
]);

const pointType = ref([
  { label: "颜色", value: "color" },
  { label: "图片", value: "image" }
]);
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>
