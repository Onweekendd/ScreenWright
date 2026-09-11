<template>
  <div class="control-btn" :class="directionClass" :style="buttonStyles" @click="handleClick" />
</template>

<script setup lang="ts">
import type { CSSProperties } from "vue";
import { computed } from "vue";

interface Props {
  direction: string;
  offsetLeftOrRight: number;
  offsetTop: number;
  width: number;
  height: number;
  bgImage: string;
}
const props = defineProps<Props>();
const emits = defineEmits<{
  (e: "click"): void;
}>();
// 计算方向相关样式
const directionClass = computed(() => `btn-${props.direction}`);
const horizontalPosition = computed(() => ({
  [props.direction == "l" ? "left" : "right"]: `calc(0% + ${props.offsetLeftOrRight}px)`
}));

// 合并样式对象
const buttonStyles = computed<CSSProperties>(() => ({
  ...horizontalPosition.value,
  position: "absolute",
  top: `calc(50% + ${props.offsetTop}px)`,
  transform: "translate(0%, -50%)",
  width: `${props.width}px`,
  height: `${props.height}px`,
  background: `url(${props.bgImage}) 50% 50%/100% 100% no-repeat`
}));

const handleClick = () => {
  emits("click");
};
</script>

<style lang="scss" scoped>
.controlBtn {
  z-index: 1;
}
</style>
