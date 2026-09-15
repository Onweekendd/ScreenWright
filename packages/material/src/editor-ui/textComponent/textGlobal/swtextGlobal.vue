<template>
  <div class="ft-text-global">
    <el-form-item label="启用行高" :label-width="firstLabelWidth">
      <template #label>
        <span
          >启用行高
          <el-tooltip class="item" effect="dark" placement="right">
            <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
            <template #content>
              <p style="width: 200px">启用行高,可对文本行高进行操作</p>
            </template>
          </el-tooltip>
        </span>
      </template>
      <el-checkbox v-model="selectTargetData[0].option.isLineHeight" @change="update" />
    </el-form-item>

    <el-form-item label="文本内容" v-if="!Array.isArray(selectTargetData[0].data)" :label-width="firstWidth">
      <sw-input v-model="selectTargetData[0].value" @change="update" />
    </el-form-item>
    <div class="flex">
      <el-form-item label="是否换行" :label-width="firstWidth">
        <el-checkbox v-model="selectTargetData[0].option.iswrap" @change="update" />
      </el-form-item>
      <el-form-item label="鼠标事件" :label-width="firstWidth">
        <el-checkbox v-model="selectTargetData[0].option.pointerEvents" @change="update" />
      </el-form-item>
    </div>
    <el-form-item label="文本样式" :label-width="firstWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" :isShowColorStyle="false" />
    </el-form-item>

    <!-- <StatusSelector label="文本样式2" :label-width="firstWidth" :properties="['fontSize']">
      <SwLabelType v-model="selectTargetData[0].option" @change="update" />
      <textFontStyle v-model="selectTargetData[0].option" @change="update" />
    </StatusSelector> -->

    <el-form-item label="字体填充" :label-width="firstWidth">
      <el-select
        v-model="selectTargetData[0].option.selectedTextType"
        popper-class="sw-select-dropdown"
        @change="update"
      >
        <el-option v-for="item in textColorType" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <template v-if="selectTargetData[0].option.selectedTextType === 'normal'">
      <el-form-item
        label="颜色"
        v-if="selectTargetData[0].option.selectedTextType === 'normal'"
        :label-width="firstWidth"
      >
        <sw-single-color-picker v-model="selectTargetData[0].option.color" @change="update" />
      </el-form-item>
      <el-form-item label="字体背景" :label-width="firstWidth">
        <sw-single-color-picker v-model="selectTargetData[0].option.backgroundColor" @change="update" />
      </el-form-item>
    </template>
    <el-form-item
      label="颜色"
      v-if="selectTargetData[0].option.selectedTextType === 'gradient'"
      :label-width="firstWidth"
    >
      <sw-color-picker
        v-model:color="selectTargetData[0].option.selectedTextColor"
        v-model:opacity="selectTargetData[0].option.selectedTextOpacity"
        :options="{ colorTypeOption: 'linear-gradient,single', returnType: 'rgba' }"
        :inputDisabled="true"
        @change="update"
      />
    </el-form-item>
    <el-form-item
      label="多渐变颜色"
      v-if="selectTargetData[0].option.selectedTextType === 'multiGradient'"
      :label-width="firstWidth"
    >
      <SwMultiGradient @change="update" v-model="selectTargetData[0].option.multiGradientColors" />
    </el-form-item>
    <el-form-item label="字体间距" :label-width="firstWidth">
      <sw-input-number v-model="selectTargetData[0].option.split" :min="0" controls @change="update" />
    </el-form-item>
    <el-form-item label="字体行高" :label-width="firstWidth">
      <sw-input-number
        :disabled="!selectTargetData[0].option.isLineHeight"
        v-model="selectTargetData[0].option.lineHeight"
        :min="1"
        controls
        @change="update"
      />
    </el-form-item>
    <el-form-item label="字体方向" v-if="selectTargetData[0].component.name !== 'ft-text2'" :label-width="firstWidth">
      <sw-radio
        v-model="selectTargetData[0].option.writingMode"
        direction="row"
        :option="writingList"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="垂直排版" v-if="selectTargetData[0].option.writingMode === 'tb-rl'" :label-width="firstWidth">
      <sw-radio
        v-model="selectTargetData[0].option.textOrientation"
        direction="row"
        :option="textOrientation"
        @change="update"
      />
    </el-form-item>
    <ItemSelectAlign
      label="水平对齐"
      v-model="selectTargetData[0].option.textAlign"
      :type="typeAttrs.default"
      @change="update"
      :labelWidth="firstWidth"
    />
    <ItemSelectAlign
      :labelWidth="firstWidth"
      label="垂直对齐"
      v-model="selectTargetData[0].option.textAlignVertical"
      :type="typeAttrs.vertical"
      @change="update"
    />

    <!-- 超链设置 -->
    <Link v-if="selectTargetData[0].option.type && selectTargetData[0].option.type === 'link'" />

    <StatusSelector label="透明度" :label-width="firstWidth" :properties="['opacity']">
      <SwSlide v-model="selectTargetData[0].option.opacity" :min="0" :max="1" :step="0.1" @change="update" />
    </StatusSelector>

    <!-- 阴影 -->
    <shadow />
    <!-- 跑马灯设置 -->
    <scroll v-if="selectTargetData[0].option.type && selectTargetData[0].option.type === 'scroll'" />

    <sw-collapse-item title="旋转" show-icon v-model="selectTargetData[0].option.rotateShow" @change="update">
      <template #content>
        <StatusSelector label="绕X轴" :label-width="secondLabelWidth" :properties="['rotateX']">
          <SwSlide
            @change="update"
            v-model="selectTargetData[0].option.rotateX"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
          />
        </StatusSelector>

        <StatusSelector label="绕Y轴" :labelWidth="secondLabelWidth" :properties="['rotateY']">
          <SwSlide
            @change="update"
            v-model="selectTargetData[0].option.rotateY"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
          />
        </StatusSelector>

        <StatusSelector label="绕Z轴" :labelWidth="secondLabelWidth" :properties="['rotateZ']">
          <SwSlide
            @change="update"
            v-model="selectTargetData[0].option.rotateZ"
            :max="180"
            :min="-180"
            :step="0.1"
            unit="°"
          />
        </StatusSelector>
      </template>
    </sw-collapse-item>
  </div>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwColorPicker } from "@screenwright/ui/color-picker";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import SwMultiGradient from "@editor/base/SwMultiGradient/index.vue";
import { SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider as SwSlide } from "@screenwright/ui/slider";
import Icon from "@editor/base/Icon/index.vue";
import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
// import textFontStyle from "@editor/components/configTextStyle/textFontStyle.vue"
import {
  textColorType,
  textOrientation,
  writingList
} from "../textConfig/constants";
import { typeAttrs } from "../textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import StatusSelector from "../../attrsRender/components/statusAnimation/components/StatusSelector.vue";
import { firstLabelWidth, secondLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import Link from "./../textConfig/components/TextSwText/link.vue";
import scroll from "./../textConfig/components/TextSwText/scroll.vue";
import shadow from "./../textConfig/components/TextSwText/shadow.vue";
// import SwLabelType from "@material/components/SwLabelType/index.vue"
import ItemSelectAlign from "./../textConfig/ItemComponent/ItemSelectAlign/index.vue";
const { selectTargetData, update } = useUpdateInstance();
const firstWidth = firstLabelWidth;
const { input, handleConfigTextChange } = useFontStyleAttrs({
  fontFamily: "fontFamily",
  fontStyle: "fontStyle",
  fontWeight: "fontWeight",
  fontSize: "fontSize",
  color: "color"
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");

</style>
