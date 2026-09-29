<template>
  <el-form-item label="背景" :label-width="firstLabelWidth">
    <sw-single-color-picker v-model="option.background" colorTypeOption="linear-gradient" @change="update" />
  </el-form-item>

  <sw-collapse-item title="边框" v-model="borderEnabled" showIcon>
    <template #content>
      <el-form-item label="宽度" :label-width="firstLabelWidth">
        <sw-input-number v-model="borderWidth" unit="px" :min="0" @change="update" />
      </el-form-item>
      <el-form-item label="样式" :label-width="firstLabelWidth">
        <el-select v-model="borderStyle" popper-class="sw-select-dropdown" @change="update">
          <el-option v-for="item in BORDER_STYLE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="颜色" :label-width="firstLabelWidth">
        <sw-single-color-picker v-model="borderColor" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>

  <el-form-item label="圆角" :label-width="firstLabelWidth">
    <sw-input-number v-model="option.borderRadius" unit="px" :min="0" @change="update" />
  </el-form-item>

  <sw-collapse-item title="阴影" v-model="boxShadowEnabled" showIcon>
    <template #content>
      <ItemTextShadow label="阴影" v-model="boxShadowInput" @change="handleBoxShadowChange" :labelWidth="firstLabelWidth" />
      <el-form-item label="内阴影" :label-width="firstLabelWidth">
        <el-switch v-model="boxShadowInset" @change="handleBoxShadowInsetChange" />
      </el-form-item>
    </template>
  </sw-collapse-item>

  <sw-collapse-item title="毛玻璃" v-model="backdropFilterEnabled" showIcon>
    <template #content>
      <el-form-item label="模糊半径" :label-width="firstLabelWidth">
        <sw-input-number v-model="backdropBlur" unit="px" :min="0" :controls="false" @change="update" />
      </el-form-item>
      <el-form-item label="饱和度" :label-width="firstLabelWidth">
        <sw-slider v-model="backdropSaturate" :min="100" :max="300" :step="10" unit="%" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>

  <el-form-item label="透明度" :label-width="firstLabelWidth">
    <SwSlider v-model="option.opacity" :max="1" :step="0.1" @change="update" />
  </el-form-item>

  <el-form-item label="切角" :label-width="firstLabelWidth">
    <el-input v-model="option.clipPath" placeholder="如 polygon(12px 0,100% 0,100% 100%,0 100%,0 12px)" @change="update" />
  </el-form-item>

  <el-form-item label="变换" :label-width="firstLabelWidth">
    <el-input v-model="option.transform" placeholder="CSS transform" @change="update" />
  </el-form-item>

  <sw-collapse-item title="动画" v-model="animationEnabled" showIcon>
    <template #content>
      <el-form-item label="预设" :label-width="firstLabelWidth">
        <el-select v-model="animationPreset" popper-class="sw-select-dropdown" @change="update">
          <el-option v-for="item in ANIMATION_PRESET_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="时长" :label-width="firstLabelWidth">
        <sw-input-number v-model="animationDuration" unit="s" :min="0" :controls="false" @change="update" />
      </el-form-item>
      <el-form-item label="缓动" :label-width="firstLabelWidth">
        <el-select v-model="animationEasing" popper-class="sw-select-dropdown" @change="update">
          <el-option v-for="item in ANIMATION_EASING_OPTIONS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="延迟" :label-width="firstLabelWidth">
        <sw-input-number v-model="animationDelay" unit="s" :min="0" :controls="false" @change="update" />
      </el-form-item>
      <el-form-item label="循环" :label-width="firstLabelWidth">
        <el-switch v-model="animationLoop" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>

  <el-form-item label="响应鼠标" :label-width="firstLabelWidth">
    <el-switch v-model="option.pointerEvents" @change="update" />
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";
import { SwSlider } from "@screenwright/ui/slider";
import {
  ANIMATION_EASING_OPTIONS,
  ANIMATION_PRESET_OPTIONS,
  BORDER_STYLE_OPTIONS,
  buildAnimationShorthand,
  buildBackdropFilter,
  buildBorder,
  buildShadow,
  parseAnimationShorthand,
  parseBackdropFilter,
  parseBorder,
  parseShadow
} from "@editor/base/atomicCssComposers";
import ItemTextShadow from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/index.vue";
import type { ShadowProps } from "@editor/textComponent/textConfig/ItemComponent/ItemTextShadow/type";

import { firstLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const option = computed(() => selectTargetData.value[0].option as Record<string, any>);

// ============ 边框：宽度 + 样式 + 颜色 ============
const borderEnabled = computed({
  get: () => typeof option.value.border === "string" && option.value.border.length > 0,
  set: (val: boolean) => {
    option.value.border = val ? buildBorder(parseBorder(option.value.border)) : undefined;
    update();
  }
});
const borderWidth = computed({
  get: () => parseBorder(option.value.border).width,
  set: (val: number) => (option.value.border = buildBorder({ ...parseBorder(option.value.border), width: val }))
});
const borderStyle = computed({
  get: () => parseBorder(option.value.border).style,
  set: (val: string) => (option.value.border = buildBorder({ ...parseBorder(option.value.border), style: val }))
});
const borderColor = computed({
  get: () => parseBorder(option.value.border).color,
  set: (val: string) => (option.value.border = buildBorder({ ...parseBorder(option.value.border), color: val }))
});

// ============ 阴影：X/Y/模糊/颜色 + 内阴影 ============
const boxShadowEnabled = computed({
  get: () => typeof option.value.boxShadow === "string" && option.value.boxShadow.length > 0,
  set: (val: boolean) => {
    option.value.boxShadow = val ? buildShadow(parseShadow(option.value.boxShadow)) : undefined;
    update();
  }
});
const boxShadowInput = computed<ShadowProps>({
  get: () => {
    const parts = parseShadow(option.value.boxShadow);
    return { color: parts.color, x: parts.x, y: parts.y, blur: parts.blur };
  },
  set: (val) => (option.value.boxShadow = buildShadow({ ...parseShadow(option.value.boxShadow), ...val }))
});
const handleBoxShadowChange = () => update();
const boxShadowInset = computed({
  get: () => parseShadow(option.value.boxShadow).inset,
  set: (val: boolean) => (option.value.boxShadow = buildShadow({ ...parseShadow(option.value.boxShadow), inset: val }))
});
const handleBoxShadowInsetChange = () => update();

// ============ 毛玻璃：模糊 + 饱和度 ============
const backdropFilterEnabled = computed({
  get: () => typeof option.value.backdropFilter === "string" && option.value.backdropFilter.length > 0,
  set: (val: boolean) => {
    option.value.backdropFilter = val ? buildBackdropFilter(parseBackdropFilter(option.value.backdropFilter)) : undefined;
    update();
  }
});
const backdropBlur = computed({
  get: () => parseBackdropFilter(option.value.backdropFilter).blur,
  set: (val: number) => (option.value.backdropFilter = buildBackdropFilter({ ...parseBackdropFilter(option.value.backdropFilter), blur: val }))
});
const backdropSaturate = computed({
  get: () => parseBackdropFilter(option.value.backdropFilter).saturate,
  set: (val: number) =>
    (option.value.backdropFilter = buildBackdropFilter({ ...parseBackdropFilter(option.value.backdropFilter), saturate: val }))
});

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
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
</style>
