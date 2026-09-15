<template>
  <span ref="textRef" class="gradient-text" :style="baseTextStyle" @blur="$emit('blur')" :data-translate="inputValue">
    <span v-if="!gradientLayers.length" class="gradient-text__plain" v-html="inputValue" />
    <template v-else>
      <span class="gradient-text__sizer" v-html="inputValue" />
      <span
        v-for="(layer, index) in gradientLayers"
        :key="`${layer.id}-${index}`"
        class="gradient-text__layer"
        :style="getLayerStyle(layer, index)"
        v-html="inputValue"
      />
    </template>
  </span>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import type { ComponentType } from "@screenwright/types";

import { isArray, isObject } from "lodash-es";

defineOptions({
  name: "TextMultiGradient"
});

const props = defineProps<{
  element: ComponentType;
  getTextStyle: CSSProperties;
  inputData: unknown;
}>();

defineEmits<{
  (e: "blur"): void;
}>();

const textRef = ref<HTMLElement | null>(null);

type GradientItem = {
  id: string;
  color: string;
  opacity: number;
  isShowColor: boolean;
};

type GradientLayer = {
  id: string;
  color: string;
  opacity: number;
};

const inputValue = computed(() => {
  if (isArray(props.inputData) && props.inputData.length > 0) {
    return (props.inputData[0] as { value?: string }).value || "";
  }
  if (isObject(props.inputData)) {
    return (props.inputData as { value?: string }).value || "";
  }
  return String(props.inputData || "");
});

const normalizeBackgroundValue = (backgroundValue: string) => {
  return `${backgroundValue}`
    .trim()
    .replace(/^background(?:-image)?\s*:\s*/i, "")
    .replace(/;\s*$/, "")
    .trim();
};

const multiGradientColors = computed<GradientItem[]>(() => {
  const source = props.element.option.multiGradientColors;
  if (!isArray(source)) {
    return [];
  }

  return source
    .filter((item): item is GradientItem => {
      return Boolean(item && typeof item.color === "string");
    })
    .map((item) => ({
      id: item.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      color: item.color,
      opacity: typeof item.opacity === "number" ? item.opacity : 100,
      isShowColor: item.isShowColor !== false
    }));
});

const gradientLayers = computed<GradientLayer[]>(() => {
  const listFromOption = multiGradientColors.value
    .filter((item) => item.isShowColor)
    .map((item) => ({
      id: item.id,
      color: normalizeBackgroundValue(item.color),
      opacity: Math.max(0, Math.min(100, item.opacity)) / 100
    }))
    .filter((item) => item.color);

  if (listFromOption.length) {
    return listFromOption;
  }

  return [];
});

const baseTextStyle = computed<CSSProperties>(() => {
  const restStyle = { ...(props.getTextStyle || {}) };
  delete restStyle.backgroundImage;
  delete restStyle.backgroundClip;
  delete restStyle.WebkitBackgroundClip;
  delete restStyle.WebkitTextFillColor;

  return {
    ...restStyle,
    color: gradientLayers.value.length ? "transparent" : restStyle.color || "rgba(255, 255, 255, 1)",
    position: "relative",
    display: "inline-block"
  };
});

const getLayerStyle = (layer: GradientLayer, index: number): CSSProperties => {
  return {
    zIndex: String(index + 1),
    backgroundImage: layer.color,
    opacity: layer.opacity,
    mixBlendMode: "normal"
  };
};
</script>

<style scoped lang="scss">
.gradient-text {
  position: relative;
  display: inline-block;
}

.gradient-text__sizer {
  visibility: hidden;
}

.gradient-text__plain {
  position: relative;
  display: inline-block;
}

.gradient-text__layer {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
  background-repeat: no-repeat;
  background-size: 100% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
</style>
