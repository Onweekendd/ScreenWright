<template>
  <div class="form-slider-global">
    <div class="flex flex-justify-between" style="width: 80%">
      <el-form-item label="显示文本" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.showLabel" @change="update" />
      </el-form-item>
      <el-form-item label="显示数值" :label-width="secondLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.showValue" @change="update" />
      </el-form-item>
    </div>
    <div class="flex flex-justify-between" style="width: 80%">
      <el-form-item label="竖向模式" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.vertical" @change="update" />
      </el-form-item>
      <el-form-item label="禁用" :label-width="secondLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.disabled" @change="update" />
      </el-form-item>
    </div>

    <div class="flex flex-justify-between">
      <el-form-item label="显示间断点" :label-width="firstLabelWidth">
        <el-checkbox v-model="selectTargetData[0].option.showStops" @change="update" />
      </el-form-item>
      <el-form-item label="步长" :label-width="70">
        <SwInputNumber @change="update" style="left: 4px" v-model="selectTargetData[0].option.step" width="80" />
      </el-form-item>
    </div>
    <SwCollapseItem title="常规配置">
      <template #content>
        <el-form-item label="背景图" :label-width="secondLabelWidth">
          <SwUpload v-model="selectTargetData[0].option.backgroudImage" @change="update" @delete="update" />
        </el-form-item>

        <el-form-item label="尺寸类型" v-if="selectTargetData[0].option.backgroudImage" :label-width="secondLabelWidth">
          <el-select
            v-model="selectTargetData[0].option.backgroudSize"
            @change="update"
            popper-class="sw-select-dropdown"
          >
            <el-option label="适应" value="100% 100%" />
            <el-option label="原比例" value="contain" />
            <el-option label="裁切" value="cover" />
          </el-select>
        </el-form-item>

        <el-form-item label="面板边距" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.paddingTop"
              :max="
                (selectTargetData[0].component.height -
                  (selectTargetData[0].option.fontSize > selectTargetData[0].option.size
                    ? selectTargetData[0].option.fontSize
                    : selectTargetData[0].option.size)) /
                2
              "
              unit="px"
              bottomLabel="上下"
            />
            <SwInputNumber
              @change="update"
              v-model="selectTargetData[0].option.paddingLeft"
              unit="px"
              bottomLabel="左右"
            />
          </div>
        </el-form-item>

        <el-form-item label="条形大小" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.size" unit="px" @change="update" />
        </el-form-item>

        <el-form-item label="条形阈值" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber v-model="selectTargetData[0].option.min" bottomLabel="最小值" @change="update" />
            <SwInputNumber v-model="selectTargetData[0].option.max" bottomLabel="最大值" @change="update" />
          </div>
        </el-form-item>
        <el-form-item label="默认条形色" :label-width="secondLabelWidth">
          <SwSingleColorPicker v-model="selectTargetData[0].option.defaultColor" @change="update" />
        </el-form-item>

        <el-form-item label="高亮面积" :label-width="secondLabelWidth">
          <div class="flex">
            <el-radio
              v-for="item in HighlightArea"
              :key="item.value"
              v-model="selectTargetData[0].option.highlightArea"
              :label="item.value"
              @change="update"
              >{{ item.label }}</el-radio
            >
          </div>
        </el-form-item>

        <el-form-item
          label="高亮条形色"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.seriesBgColor"
        >
          <sw-color-picker
            :options="{ colorTypeOption: 'linear-gradient,single', returnType: 'rgba' }"
            v-model:color="selectTargetData[0].option.seriesBgColor"
            v-model:opacity="selectTargetData[0].option.seriesOpacity"
            @change="update"
          />
        </el-form-item>

        <el-form-item
          label="圆角"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.hasOwnProperty('borderRadius')"
        >
          <SwInputNumber
            unit="px"
            v-model="selectTargetData[0].option.borderRadius"
            @change="update"
            :max="15"
            :min="0"
          />
        </el-form-item>
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="文本配置">
      <template #content>
        <el-form-item label="文本样式" :label-width="secondLabelWidth">
          <configTextStyle v-model="input" @change="handleConfigTextChange">
            <template #append>
              <div style="flex: 1; margin-left: 8px" class="flex">
                <SwInputNumber
                  v-model="selectTargetData[0].option.letterSpacing"
                  unit="px"
                  @change="update"
                  bottomLabel="字距"
                />
              </div>
            </template>
          </configTextStyle>
        </el-form-item>

        <el-form-item label="文本偏移" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber
              v-model="selectTargetData[0].option.textTranslateX"
              unit="px"
              bottomLabel="X"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.textTranslateY"
              unit="px"
              bottomLabel="Y"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="文本边距" :label-width="secondLabelWidth">
          <div class="flex flex-center-between">
            <SwInputNumber
              v-model="selectTargetData[0].option.fontPaddingTop"
              unit="px"
              bottomLabel="上下"
              @change="update"
            />
            <SwInputNumber
              v-model="selectTargetData[0].option.fontPaddingLeft"
              unit="px"
              bottomLabel="左右"
              @change="update"
            />
          </div>
        </el-form-item>

        <el-form-item label="阴影" :label-width="secondLabelWidth">
          <el-checkbox @change="update" v-model="selectTargetData[0].option.isTextShadow" />
        </el-form-item>
        <ItemTextShadow
          v-if="selectTargetData[0].option.isTextShadow"
          v-model="textShadowInput"
          :label-width="secondLabelWidth"
          label="文本阴影"
          @change="handleConfigTextShadowChange"
        />
      </template>
    </SwCollapseItem>
    <SwCollapseItem title="圆点配置">
      <template #content>
        <el-form-item label="大小" :label-width="secondLabelWidth">
          <SwInputNumber v-model="selectTargetData[0].option.pointSize" unit="px" @change="update" />
        </el-form-item>

        <el-form-item
          label="类型"
          :label-width="secondLabelWidth"
          v-if="selectTargetData[0].option.hasOwnProperty('pointType')"
        >
          <div class="flex">
            <el-radio
              v-for="item in pointType"
              :key="item.value"
              v-model="selectTargetData[0].option.pointType"
              :label="item.value"
              @change="update"
              >{{ item.label }}</el-radio
            >
          </div>
        </el-form-item>

        <template
          v-if="
            selectTargetData[0].option.pointType === 'color' || !selectTargetData[0].option.hasOwnProperty('pointType')
          "
        >
          <el-form-item
            label="边框颜色"
            :label-width="secondLabelWidth"
            v-if="selectTargetData[0].option.hasOwnProperty('pointBorderColor')"
          >
            <SwSingleColorPicker v-model="selectTargetData[0].option.pointBorderColor" @change="update" />
          </el-form-item>
          <el-form-item label="背景色" :label-width="secondLabelWidth">
            <SwSingleColorPicker v-model="selectTargetData[0].option.pointColor" @change="update" />
          </el-form-item>
        </template>
        <template
          v-if="
            selectTargetData[0].option.pointType === 'image' && selectTargetData[0].option.hasOwnProperty('pointImage')
          "
        >
          <el-form-item label="图片" :label-width="secondLabelWidth">
            <SwUpload v-model="selectTargetData[0].option.pointImage" @change="update" @delete="update" />
          </el-form-item>
        </template>
      </template>
    </SwCollapseItem>
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwCollapseItem as SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker as ftColorPicker } from "@screenwright/ui/color-picker";
import { SwInputNumber as SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker as SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import SwUpload from "@editor/base/SwUpload/index.vue";
import ItemTextShadow from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/index.vue";
import { useItemTextShadowAttrs } from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/useItemTextShadow";

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
@include radio-style();
</style>
