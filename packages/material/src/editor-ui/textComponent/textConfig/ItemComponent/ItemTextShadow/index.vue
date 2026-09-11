<template>
  <el-form-item :label="label" :label-width="labelWidth">
    <div :style="{ marginLeft: marginLeft }" class="item-text-shadow flex flex-align-center flex-justify-between">
      <FrontColorPicker
        v-model="input.color"
        style="position: relative; top: -7px; left: -4px"
        @confirm="handleChange('color')"
      />
      <sw-input-number v-model="input.x" bottomLabel="X" @change="handleChange('x')" :controls="false" width="48" />
      <sw-input-number v-model="input.y" bottomLabel="Y" @change="handleChange('y')" :controls="false" width="48" />
      <sw-input-number
        v-model="input.blur"
        bottomLabel="模糊"
        @change="handleChange('blur')"
        :controls="false"
        width="48"
      />
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import { ScreenwrightColorPicker as FrontColorPicker } from "@screenwright/ui";
import { SwInputNumber } from "@screenwright/ui/input-number";

import type { configTextShadowProps, ShadowProps } from "./type";
import { configTextShadowEmits } from "./type";

const props = withDefaults(defineProps<configTextShadowProps>(), {
  modelValue: () => ({
    color: "",
    x: 0,
    y: 0,
    blur: 0
  }),
  label: "文本阴影",
  labelWidth: "53",
  marginLeft: "0px"
});

const emit = defineEmits(configTextShadowEmits);

const input = useVModel(props, "modelValue", emit);

const handleChange = (key: keyof ShadowProps) => {
  if (!input.value) return;
  emit("change", key, input.value);
};
</script>

<style lang="scss" scoped>
.item-text-shadow {
  width: 100%;
}
:deep(.el-color-picker__trigger) {
  border: none !important;
  width: 28px !important;
  height: 28px !important;
}

:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
  margin-right: 1px;
}
</style>
