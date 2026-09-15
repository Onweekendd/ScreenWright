<template>
  <div class="ext-container">
    <div class="ext" :style="particlesStyle" ref="particlesJsRef" />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from "vue";
import { useEventListener } from "@vueuse/core";

import { useActionEvent } from "@screenwright/composables";
import { ExhibitEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

import { useParticles } from "./useParticles";

const { addEvent } = useActionEvent();
interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const {
  option,
  particlesInstance,
  particlesStyle,
  particlesJsRef,
  setParticlesScale,
  initParticles,
  debouncedUpdateParticles
} = useParticles(props.element);

watch(
  () => option.value,
  () => {
    console.log(particlesInstance.value, "option.value");
    debouncedUpdateParticles();
  },
  { deep: true }
);

onMounted(async () => {
  // 设置事件监听
  addEvent({
    [`${ExhibitEnum.SwParticles}-${props.element.id}`]: {
      particlesReStart: () => {
        if (particlesInstance.value) {
          initParticles();
        }
      }
    }
  });

  useEventListener(window, "resize", setParticlesScale);
  await nextTick();
  setParticlesScale();
  initParticles();
});

onBeforeUnmount(() => {
  if (particlesInstance.value) {
    particlesInstance.value.destroy();
    particlesInstance.value = null;
  }

  // offEvent(`particlesReStart-${this.id}`)
});
</script>

<style lang="scss" scoped>
.ext-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.ext {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
