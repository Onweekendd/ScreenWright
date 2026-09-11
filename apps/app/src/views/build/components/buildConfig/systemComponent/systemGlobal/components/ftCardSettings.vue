<template>
  <el-form-item label="偏移">
    <div class="flex flex-center-between">
      <sw-input-number
        v-model="translateX"
        unit="px"
        :controls="false"
        bottomLabel="X"
        :disabled="disableX"
        @change="onChange"
      />
      <sw-input-number v-model="translateY" unit="px" :controls="false" bottomLabel="Y" @change="onChange" />
    </div>
  </el-form-item>
  <el-form-item label="缩放">
    <div class="flex flex-center-between">
      <sw-input-number v-model="scaleX" :min="0" bottomLabel="X" />
      <sw-input-number v-model="scaleY" :min="0" bottomLabel="Y" />
    </div>
  </el-form-item>
  <el-form-item label="透明度">
    <sw-input-number :controls="false" :min="minOpacity" :max="1" v-model="opacity" @change="onChange" />
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";

interface CardSettings {
  translateX: number;
  translateY: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
}

const props = defineProps({
  modelValue: {
    type: Object as () => CardSettings,
    required: true
  },
  disableX: {
    type: Boolean,
    default: false
  },
  minOpacity: {
    type: Number,
    default: 0.1
  }
});

const emit = defineEmits(["update:modelValue", "change"]);

const translateX = computed<number>({
  get: () => props.modelValue?.translateX ?? 0,
  set: (val) => emit("update:modelValue", { ...props.modelValue, translateX: val ?? 0 })
});

const translateY = computed<number>({
  get: () => props.modelValue?.translateY ?? 0,
  set: (val) => emit("update:modelValue", { ...props.modelValue, translateY: val ?? 0 })
});

const scaleX = computed<number>({
  get: () => props.modelValue?.scaleX ?? 1,
  set: (val) => emit("update:modelValue", { ...props.modelValue, scaleX: val ?? 1 })
});

const scaleY = computed<number>({
  get: () => props.modelValue?.scaleY ?? 1,
  set: (val) => emit("update:modelValue", { ...props.modelValue, scaleY: val ?? 1 })
});

const opacity = computed<number>({
  get: () => props.modelValue?.opacity ?? 1,
  set: (val) => emit("update:modelValue", { ...props.modelValue, opacity: val ?? 1 })
});

const onChange = (value: number | undefined) => {
  emit("change", value);
};
</script>

<style lang="scss" scoped>
.flex {
  display: -ms-flexbox;
  display: -webkit-box;
  display: flex;
}

.flex-center-between {
  justify-content: space-between;
  -webkit-justify-content: space-between;
}
</style>
