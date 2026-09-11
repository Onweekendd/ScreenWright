<template>
  <div :class="['parts-marquee', direction]" ref="marqueeRef">
    <div class="row-content" :style="contentStyle" :data-translate="content">{{ content }}</div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    content: string | number | undefined | null;
    uuid: string;
    power: number;
    direction: string;
  }>(),
  {
    content: "",
    direction: "left"
  }
);

const aniDuration = ref(10);
const marqueeRef = ref<HTMLElement | null>(null);

const contentStyle = computed(() => ({
  "animation-duration": `${aniDuration.value}s`
}));
const defaultDistance = ref("");
const moveDistance = ref("");
const initData = () => {
  if (!props.uuid) return;
  const marquee = marqueeRef.value;
  const content = marqueeRef.value?.querySelector(".row-content");
  if (marquee && content) {
    const space = props.direction === "left" ? marquee.clientWidth : marquee.clientHeight;
    const distance = props.direction === "left" ? content.clientWidth : content.clientHeight;
    if (distance > 0 && space < distance) {
      aniDuration.value = distance / props.power;
      defaultDistance.value = `${space}px`;
      moveDistance.value = `-${distance}px`;
      content.classList.add(props.direction === "left" ? "moveX" : "moveY");
    }
  }
};

onMounted(() => {
  initData();
});

watch(
  () => props.content,
  () => {
    initData();
  }
);
</script>

<style lang="scss" scoped>
.parts-marquee {
  width: 100%;
  height: 100%;
  overflow: hidden;
  --default-distance: v-bind("defaultDistance");
  --move-distance: v-bind("moveDistance");
  .row-content {
    letter-spacing: 0.011rem;
    animation-duration: 10s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
    transition: transform 0.25s linear;
    transform-style: preserve-3d;
    &.moveX {
      animation-name: moveX;
    }
    &.moveY {
      animation-name: moveY;
    }
  }
  &:hover .row-content {
    animation-play-state: paused;
  }
  &.left {
    padding: 0.1rem 0;
    .row-content {
      width: fit-content;
      min-width: 100%;
      white-space: nowrap;
      text-align: center;
      transform: translate3d(var(--default-distance), 0, 0);
    }
  }
  &.up {
    padding: 0 0.1rem;
    .row-content {
      height: fit-content;
      min-height: 100%;
      white-space: normal;
      text-align: left;
      transform: translate3d(0, var(--default-distance), 0);
    }
  }
}
@keyframes moveX {
  0% {
    transform: translate3d(var(--default-distance), 0, 0);
  }
  95%,
  100% {
    transform: translate3d(var(--move-distance), 0, 0);
  }
}
@keyframes moveY {
  0% {
    transform: translate3d(0, var(--default-distance), 0);
  }
  95%,
  100% {
    transform: translate3d(0, var(--move-distance), 0);
  }
}
</style>
