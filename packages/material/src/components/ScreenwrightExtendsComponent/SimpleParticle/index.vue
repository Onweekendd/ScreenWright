<template>
  <div class="simple-particle" :style="styleSizeName">
    <canvas ref="particle" />
  </div>
</template>
<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";

import type { ComponentType } from "@screenwright/types";

import { useSimPleParticle } from "./useSimPleParticle";

const props = defineProps<{
  element: ComponentType;
}>();
const { styleSizeName, option, width, height, STAR_SIZE, MAX_STARS, STAR_COLORS, stars, timer, canvasCtx } =
  useSimPleParticle(props.element);
const particle = ref<HTMLCanvasElement | any>(null);

const initCanvas = () => {
  if (timer.value) {
    cancelAnimationFrame(timer.value);
    timer.value = null;
  }
  stars.value = [];

  if (particle.value) {
    particle.value.width = width.value;
    particle.value.height = height.value;
    canvasCtx.value = particle.value.getContext("2d");
    for (let i = 0; i < MAX_STARS.value; i++) {
      const x = Math.floor(Math.random() * particle.value.width);
      const y = Math.floor(Math.random() * particle.value.height);
      const speed = Math.floor(1 + Math.random() * option.value.speed);
      const color = Math.floor(Math.random() * option.value.colorList.length);
      stars.value.push({ x, y, speed, color });
    }

    loop();
  }
};

const loop = () => {
  clearScreen();
  timer.value = requestAnimationFrame(loop);
  update();
  draw();
};

const clearScreen = () => {
  if (!canvasCtx.value) {
    return;
  }
  canvasCtx.value.clearRect(0, 0, particle.value.width, particle.value.height);
};

const update = () => {
  for (let i = 0; i < MAX_STARS.value; i++) {
    if (option.value.direction === "top") {
      stars.value[i].y -= stars.value[i].speed;
      const isOutScreen = stars.value[i].y < 0;
      isOutScreen && (stars.value[i].y = particle.value.height);
    } else {
      stars.value[i].y += stars.value[i].speed;
      const isOutScreen = stars.value[i].y > particle.value.height;
      isOutScreen && (stars.value[i].y = 0);
    }
  }
};

const draw = () => {
  if (!canvasCtx.value) {
    return;
  }
  for (let i = 0; i < MAX_STARS.value; i++) {
    const star = stars.value[i];
    canvasCtx.value.lineWidth = STAR_SIZE.value;
    canvasCtx.value.strokeStyle = STAR_COLORS.value[stars.value[i].color];
    canvasCtx.value.strokeRect(star.x, star.y, STAR_SIZE.value, STAR_SIZE.value);
  }
};

const cleanup = () => {
  if (timer.value) {
    cancelAnimationFrame(timer.value);
    timer.value = null;
  }
};

watch(
  () => option.value,
  () => {
    initCanvas();
  },
  { deep: true }
);

watch(
  () => width.value,
  () => {
    initCanvas();
  }
);

watch(
  () => height.value,
  () => {
    initCanvas();
  }
);

onMounted(() => {
  nextTick(() => {
    initCanvas();
  });
});

onUnmounted(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
.simple-particle {
  mask: linear-gradient(transparent, #000000, transparent);
}
</style>
