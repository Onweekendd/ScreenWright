<template>
  <el-form-item label="边距" :label-width="labelWidth">
    <div class="flex flex-align-center flex-justify-between itemPadding">
      <sw-input-number v-model="input.padding[0]" bottomLabel="上" width="42" :controls="false" />
      <sw-input-number v-model="input.padding[2]" bottomLabel="下" width="42" :controls="false" />
      <sw-input-number v-model="input.padding[3]" bottomLabel="左" width="42" :controls="false" />
      <sw-input-number v-model="input.padding[1]" bottomLabel="右" width="42" :controls="false" />
    </div>
  </el-form-item>
</template>
<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import { SwInputNumber } from "@screenwright/ui/input-number";

import type { configPaddingProps } from "./type";
import { configPaddingEmits } from "./type";

const props = withDefaults(defineProps<configPaddingProps>(), {
  modelValue: () => ({
    padding: [0, 0, 0, 0]
  }),
  labelWidth: 48
});

const emit = defineEmits(configPaddingEmits);

const input = useVModel(props, "modelValue", emit);
</script>
<style lang="scss" scoped>
.itemPadding {
  width: 100%;
}
</style>
