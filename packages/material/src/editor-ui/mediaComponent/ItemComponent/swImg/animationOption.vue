<template>
  <sw-collapse-item title="动画" v-model="animationEnabled" showIcon>
    <template #content>
      <el-form-item label="预设" :label-width="secondLabelWidth">
        <el-select v-model="animationPreset" popper-class="sw-select-dropdown" @change="update">
          <el-option v-for="item in ANIMATION_PRESET_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="时长" :label-width="secondLabelWidth">
        <sw-input-number v-model="animationDuration" unit="s" :min="0" :controls="false" @change="update" />
      </el-form-item>
      <el-form-item label="缓动" :label-width="secondLabelWidth">
        <el-select v-model="animationEasing" popper-class="sw-select-dropdown" @change="update">
          <el-option v-for="item in ANIMATION_EASING_OPTIONS" :key="item" :label="item" :value="item" />
        </el-select>
      </el-form-item>
      <el-form-item label="延迟" :label-width="secondLabelWidth">
        <sw-input-number v-model="animationDelay" unit="s" :min="0" :controls="false" @change="update" />
      </el-form-item>
      <el-form-item label="循环" :label-width="secondLabelWidth">
        <el-switch v-model="animationLoop" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { ANIMATION_EASING_OPTIONS, ANIMATION_PRESET_OPTIONS, buildAnimationShorthand, parseAnimationShorthand } from "@editor/base/atomicCssComposers";

import { secondLabelWidth } from "../../../constants";
import { useUpdateInstance } from "../../../useUpdateInstance";

const { update, selectTargetData } = useUpdateInstance();
const option = computed(() => selectTargetData.value[0].option as Record<string, any>);

// 自定义关键帧（option.keyframes，Web Animations API 格式）暂不提供可视化编辑器，
// 需要自定义动画的场景先用这里的预设覆盖，复杂关键帧留给后续 AI 链路/JSON 编辑器。
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
