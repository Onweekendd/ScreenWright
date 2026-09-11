<!-- 文本样式配置 -->
<template>
  <div class="config-text-style" v-if="input">
    <SwLabelType
      :selectWidth="selectWidth"
      :isShowFontSize="isShowFontSize"
      v-model="input"
      @change="handleLabelTypeChange"
    />
    <SwSingleColorPicker
      :width="colorWidth"
      v-model="input.color"
      @change="handleChange('color')"
      v-if="isShowColorStyle"
    />
    <textFontStyle v-model="input" @change="handleLabelTextFontStyle" v-if="isShowFontStyle">
      <template #append>
        <slot name="append" />
      </template>
    </textFontStyle>
  </div>
</template>
<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import { SwLabelType } from "@screenwright/ui/label-type";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import type { configTextStyleProps, StyleProps } from "./configTextStyle";
import { configTextStyleEmits } from "./configTextStyle";
import textFontStyle from "./textFontStyle.vue";

const props = withDefaults(defineProps<configTextStyleProps>(), {
  isShowFontStyle: true,
  isShowColorStyle: true,
  isShowFontSize: true
});

const emit = defineEmits(configTextStyleEmits);
const input = useVModel(props, "modelValue", emit);
const handleChange = (key: keyof StyleProps) => {
  if (!input.value) {
    return;
  }
  emit("change", key, input.value);
};
const handleLabelTypeChange = (key: string) => {
  handleChange(key as keyof StyleProps);
};
const handleLabelTextFontStyle = (key: keyof StyleProps) => {
  handleChange(key);
};
</script>
<style lang="scss" scoped>
.config-text-style {
  width: 100%;
}
</style>
