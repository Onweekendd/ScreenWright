<template>
  <div :class="['page-jumper']" :style="style">
    前往
    <input
      v-model.number="inputValue"
      type="text"
      :style="inputStyle"
      @blur="handleBlur"
      @keyup.enter="
        (e) => {
          if (e.target) {
            (e.target as HTMLInputElement).blur();
          }
        }
      "
    />
    页
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { ref, watch } from "vue";

interface PageJumperProps {
  currentPage: number;
  totalPage: number;
  style?: CSSProperties;
  inputStyle?: CSSProperties;
}

const props = defineProps<PageJumperProps>();

const emit = defineEmits<{
  (e: "change", page: number): void;
}>();

const inputValue = ref<number | null>(props.currentPage);

const handleBlur = () => {
  if (!inputValue.value || inputValue.value < 1) {
    inputValue.value = 1;
  }
  if (inputValue.value > props.totalPage) {
    inputValue.value = props.totalPage;
  }
  emit("change", inputValue.value);
};

watch(
  () => props.currentPage,
  (newValue) => {
    inputValue.value = newValue;
  }
);
</script>
