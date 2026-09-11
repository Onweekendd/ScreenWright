<template>
  <div class="ft-embed-audio" @click="handleClick" v-if="visibility" :style="{ pointerEvents: pointerEvents }">
    <audio
      ref="audioElement"
      :controls="option.controler"
      :autoplay="isAutoPlay"
      :loop="option.loopPlay"
      @ended="handleEnded"
      :src="setMinioUrl(dataChartItem.value || option.url)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";

import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { EventTypeEnum } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";

const pointerEvents = ref<"visible" | "none">("visible");
const visibility = ref<boolean>(true);
const audioElement = ref<HTMLAudioElement | null>(null);
const dataChartItem = ref<Record<string, any>>({});

const props = defineProps<{
  element: ComponentType;
}>();

const { isBuild, option, dataChart, handleEventAndCallbackEvent } = useBaseData(props.element);

const isAutoPlay = computed(() => {
  if (!option.value.autoPlay) return false;
  if (isBuild.value) return option.value.isBuildPlay;
  return true;
});

const handleEnded = () => {
  if (option.value.autoHidden) {
    visibility.value = false;
  }
  handleClick();
};

const handleClick = () => {
  // 交互-自定义事件-含回调参数 2024-12-4
  handleEventAndCallbackEvent({
    id: props.element.id,
    triggerType: EventTypeEnum.Click,
    events: props.element.events,

    throwValue: dataChartItem.value as Record<string, any>
  });
};

watch(
  () => visibility.value,
  (val) => {
    pointerEvents.value = val ? "visible" : "none";
  }
);

watch(
  () => option.value,
  (nv) => {
    if (nv.autoHidden || nv.loopPlay) {
      visibility.value = true;
    }
  },
  {
    deep: true
  }
);

watch(
  () => dataChart.value,
  (nv) => {
    if (Array.isArray(nv) && nv.length) {
      dataChartItem.value = nv[0];
    } else {
      dataChartItem.value = nv;
    }
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  if (!audioElement.value) return;
  audioElement.value.addEventListener("loadedmetadata", () => {
    if (option.value.autoHidden && audioElement.value) {
      setTimeout(() => {
        visibility.value = false;
      }, audioElement.value.duration * 1000);
    }
  });
});
</script>

<style lang="scss" scoped>
.ft-embed-audio {
  width: 100% !important;
  height: 100% !important;
  audio {
    width: 100%;
    height: 100%;
    zoom: var(--unscale);
    height: 100%;
  }
}
</style>
