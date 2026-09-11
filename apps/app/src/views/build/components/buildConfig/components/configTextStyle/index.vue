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

import SwLabelType from "@/components/SwLabelType/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";

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
  console.log(key, input.value);
  if (!input.value) {
    return;
  }
  emit("change", key, input.value);
  // if (key === "fontWeight" || key === "fontStyle") {
  //   emit("change", key, {
  //     ...input.value,
  //     fontWeight: input.value.fontWeight === "bolder",
  //     fontStyle: input.value.fontStyle === "italic"
  //   } as any)
  // } else {
  //   emit("change", key, input.value)
  // }
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
