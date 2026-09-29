<template>
  <div class="ft-text-global">
    <el-form-item label="文本内容" v-if="!Array.isArray(selectTargetData[0].data)" :label-width="firstWidth">
      <sw-input v-model="selectTargetData[0].value" @change="update" />
    </el-form-item>

    <el-form-item label="鼠标事件" :label-width="firstWidth">
      <el-checkbox v-model="selectTargetData[0].option.pointerEvents" @change="update" />
    </el-form-item>

    <el-form-item label="文本样式" :label-width="firstWidth">
      <configTextStyle v-model="input" @change="handleConfigTextChange" :isShowColorStyle="false" />
    </el-form-item>

    <el-form-item label="颜色" :label-width="firstWidth">
      <sw-single-color-picker v-model="selectTargetData[0].option.color" colorTypeOption="linear-gradient" @change="update" />
    </el-form-item>
    <el-form-item label="背景" :label-width="firstWidth">
      <sw-single-color-picker v-model="selectTargetData[0].option.background" @change="update" />
    </el-form-item>

    <el-form-item label="字间距" :label-width="firstWidth">
      <sw-input-number v-model="selectTargetData[0].option.letterSpacing" :min="0" controls @change="update" />
    </el-form-item>
    <el-form-item label="行高" :label-width="firstWidth">
      <sw-input-number v-model="selectTargetData[0].option.lineHeight" :min="0" :step="0.1" controls @change="update" />
    </el-form-item>

    <el-form-item label="换行" :label-width="firstWidth">
      <el-select v-model="selectTargetData[0].option.whiteSpace" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in whiteSpaceOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="溢出" :label-width="firstWidth">
      <el-select v-model="selectTargetData[0].option.textOverflow" popper-class="sw-select-dropdown" @change="update">
        <el-option v-for="item in textOverflowOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>

    <el-form-item label="字体方向" v-if="selectTargetData[0].component.name !== 'ft-text2'" :label-width="firstWidth">
      <sw-radio v-model="selectTargetData[0].option.writingMode" direction="row" :option="swTextWritingModeOptions" @change="update" />
    </el-form-item>
    <el-form-item
      label="垂直排版"
      v-if="selectTargetData[0].option.writingMode === 'vertical-rl' || selectTargetData[0].option.writingMode === 'vertical-lr'"
      :label-width="firstWidth"
    >
      <sw-radio v-model="selectTargetData[0].option.textOrientation" direction="row" :option="textOrientation" @change="update" />
    </el-form-item>

    <ItemSelectAlign
      label="水平对齐"
      v-model="selectTargetData[0].option.textAlign"
      :type="typeAttrs.defaultWithThree"
      @change="update"
      :labelWidth="firstWidth"
    />
    <ItemSelectAlign
      :labelWidth="firstWidth"
      label="垂直对齐"
      v-model="selectTargetData[0].option.verticalAlign"
      :type="typeAttrs.verticalWithMiddle"
      @change="update"
    />

    <StatusSelector label="透明度" :label-width="firstWidth" :properties="['opacity']">
      <SwSlide v-model="selectTargetData[0].option.opacity" :min="0" :max="1" :step="0.1" @change="update" />
    </StatusSelector>

    <el-form-item label="变换" :label-width="firstWidth">
      <sw-input v-model="selectTargetData[0].option.transform" placeholder="CSS transform" @change="update" />
    </el-form-item>

    <!-- 阴影：由 option.textShadow 是否存在驱动，折叠面板内部负责增删该字段 -->
    <shadow />
    <!-- 跑马灯设置：由 option.marquee 是否存在驱动，折叠面板内部负责增删该字段 -->
    <scroll />
    <!-- 超链设置：由 option.href 是否存在驱动，折叠面板内部负责增删该字段 -->
    <Link />

    <sw-collapse-item title="动画" v-model="animationEnabled" showIcon>
      <template #content>
        <el-form-item label="预设" :label-width="firstWidth">
          <el-select v-model="animationPreset" popper-class="sw-select-dropdown" @change="update">
            <el-option v-for="item in ANIMATION_PRESET_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="时长" :label-width="firstWidth">
          <sw-input-number v-model="animationDuration" unit="s" :min="0" :controls="false" @change="update" />
        </el-form-item>
        <el-form-item label="缓动" :label-width="firstWidth">
          <el-select v-model="animationEasing" popper-class="sw-select-dropdown" @change="update">
            <el-option v-for="item in ANIMATION_EASING_OPTIONS" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="延迟" :label-width="firstWidth">
          <sw-input-number v-model="animationDelay" unit="s" :min="0" :controls="false" @change="update" />
        </el-form-item>
        <el-form-item label="循环" :label-width="firstWidth">
          <el-switch v-model="animationLoop" @change="update" />
        </el-form-item>
      </template>
    </sw-collapse-item>

    <el-form-item label="显示模板" :label-width="firstWidth">
      <sw-input v-model="selectTargetData[0].option.template" placeholder="如 {value} kWh" @change="update" />
    </el-form-item>
    <el-form-item label="保留小数位" :label-width="firstWidth">
      <sw-input-number v-model="selectTargetData[0].option.decimals" :min="0" controls @change="update" />
    </el-form-item>
    <el-form-item label="千分位" :label-width="firstWidth">
      <el-checkbox v-model="selectTargetData[0].option.thousands" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInput } from "@screenwright/ui/input";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwRadio } from "@screenwright/ui/radio";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider as SwSlide } from "@screenwright/ui/slider";
import {
  ANIMATION_EASING_OPTIONS,
  ANIMATION_PRESET_OPTIONS,
  buildAnimationShorthand,
  parseAnimationShorthand
} from "@editor/base/atomicCssComposers";
import configTextStyle from "@editor/components/configTextStyle/index.vue";
import { useFontStyleAttrs } from "@editor/components/configTextStyle/useTextStyleAttrs";
import { textOrientation } from "../textConfig/constants";
import { typeAttrs } from "../textConfig/ItemComponent/ItemSelectAlign/ItemSelectAlign";

import StatusSelector from "../../attrsRender/components/statusAnimation/components/StatusSelector.vue";
import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import Link from "./../textConfig/components/TextSwText/link.vue";
import scroll from "./../textConfig/components/TextSwText/scroll.vue";
import shadow from "./../textConfig/components/TextSwText/shadow.vue";
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

// swtext 新 schema 的 writingMode 取值（horizontal-tb/vertical-rl/vertical-lr），
// 与 textConfig/constants.ts 里给旧组件用的 writingList（含 "tb-rl"）不同，单独定义避免互相影响。
const swTextWritingModeOptions = [
  { label: "横排", value: "horizontal-tb" },
  { label: "竖排(右到左)", value: "vertical-rl" },
  { label: "竖排(左到右)", value: "vertical-lr" }
];
const whiteSpaceOptions = [
  { label: "单行", value: "nowrap" },
  { label: "自动换行", value: "normal" },
  { label: "保留换行符", value: "pre-line" }
];
const textOverflowOptions = [
  { label: "裁剪", value: "clip" },
  { label: "省略号", value: "ellipsis" }
];

const option = computed(() => selectTargetData.value[0].option as Record<string, any>);

// ============ 动画：预设关键帧 + 时长 + 缓动 + 延迟 + 循环 ============
const animationEnabled = computed({
  get: () => typeof option.value.animation === "string" && option.value.animation.length > 0,
  set: (val: boolean) => {
    option.value.animation = val ? buildAnimationShorthand(parseAnimationShorthand(option.value.animation)) : undefined;
    update();
  }
});
const animationPreset = computed({
  get: () => parseAnimationShorthand(option.value.animation).preset,
  set: (val: string) => (option.value.animation = buildAnimationShorthand({ ...parseAnimationShorthand(option.value.animation), preset: val }))
});
const animationDuration = computed({
  get: () => parseAnimationShorthand(option.value.animation).duration,
  set: (val: number) =>
    (option.value.animation = buildAnimationShorthand({ ...parseAnimationShorthand(option.value.animation), duration: val }))
});
const animationEasing = computed({
  get: () => parseAnimationShorthand(option.value.animation).easing,
  set: (val: string) => (option.value.animation = buildAnimationShorthand({ ...parseAnimationShorthand(option.value.animation), easing: val }))
});
const animationDelay = computed({
  get: () => parseAnimationShorthand(option.value.animation).delay,
  set: (val: number) => (option.value.animation = buildAnimationShorthand({ ...parseAnimationShorthand(option.value.animation), delay: val }))
});
const animationLoop = computed({
  get: () => parseAnimationShorthand(option.value.animation).loop,
  set: (val: boolean) => (option.value.animation = buildAnimationShorthand({ ...parseAnimationShorthand(option.value.animation), loop: val }))
});
</script>
<style lang="scss" scoped>
@import "@material/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
