<template>
  <div class="echart-gl-map component-bind-events">
    <div ref="glMapTemplate" style="width: 100%; height: 100%" />
  </div>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import { debounce } from "lodash-es";

import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants";
import { sceneEnumType } from "@/views/build/components/buildRender/core/SceneComponent/type";
import type { ComponentType } from "@/views/build/components/buildRender/type";

import { useEchartGlmap } from "./useEchartGlmap";

interface Props {
  element: ComponentType;
}
const props = defineProps<Props>();
const {
  dataChart,
  handleEventAndCallbackEvent,
  glMapTemplate,
  mapInstance,
  syncCurrentRegionSelection,
  upDateGlMap,
  updateSubComponents,
  updateChildComponentVisible,
  liftRegionByAdcode,
  setMapGlIconActive,
  playSceneRoam,
  stopSceneRoam
} = useEchartGlmap(props.element);

const { addEvent } = useActionEvent();

const debouncedUpDateGlMap = debounce(upDateGlMap, 100);
const hasMounted = ref(false);
const pendingPresetChildSync = ref(false);

const flushPresetChildSync = async () => {
  if (!mapInstance.value || !pendingPresetChildSync.value) {
    return;
  }

  pendingPresetChildSync.value = false;
  await updateSubComponents();
};

const debouncedUpdateSubComponents = debounce(async () => {
  await flushPresetChildSync();
}, 100);
watch(
  () => dataChart.value,
  // () => props.element.data,
  async (nV: any) => {
    syncCurrentRegionSelection(nV);
    if (nV && nV.length > 0 && hasMounted.value) {
      debouncedUpDateGlMap();

      handleEventAndCallbackEvent({
        id: props.element.id,
        triggerType: EventTypeEnum.DataChange,
        events: props.element.events,
        isExecuteOnlyConditionSatisfied: false,
        throwValue: props.element.data
      });
    }
  },
  { immediate: true, deep: true }
);

// 监听 option 变化，进行增量更新
watch(
  () => props.element.option,
  () => {
    if (mapInstance.value) {
      // option 变化时触发更新（内部会进行增量更新判断）
      debouncedUpDateGlMap();
    }
  },
  { deep: true }
);

// 监听子组件变化，进行增量更新
watch(
  () => props.element.presetChild,
  () => {
    pendingPresetChildSync.value = true;
    if (hasMounted.value && mapInstance.value) {
      // 子组件变化时使用专用更新函数，避免地图重绘
      debouncedUpdateSubComponents();
    }
  },
  { deep: true, immediate: true }
);

onMounted(async () => {
  hasMounted.value = true;
  debouncedUpDateGlMap.cancel();
  await upDateGlMap();
  await flushPresetChildSync();
});

addEvent({
  [`${sceneEnumType.EchartGlmap}-${props.element.id}`]: {
    updateMapChildComponentVisible: (childComponentList: any[], visible: boolean) => {
      updateChildComponentVisible(childComponentList, visible);
    },
    setMapBoxBom: (componentRootDoms: Element, componentId: string, boxOffsetX: number, boxOffsetY: number) => {
      mapInstance.value?.setMapBoxBom(componentRootDoms, componentId, boxOffsetX, boxOffsetY);
    },
    liftRegionByAdcode: (adcode: string, options?: { height?: number; duration?: number }) => {
      liftRegionByAdcode(adcode, options);
    },
    setMapGlIconActive: (options: any) => {
      return setMapGlIconActive(options);
    },
    playSceneRoam: (sceneId: string) => {
      void playSceneRoam(sceneId);
    },
    stopSceneRoam: () => {
      stopSceneRoam();
    }
  }
});
onBeforeUnmount(() => {
  hasMounted.value = false;
  pendingPresetChildSync.value = false;
  // 取消防抖函数的待执行调用
  if (debouncedUpDateGlMap && typeof debouncedUpDateGlMap.cancel === "function") {
    debouncedUpDateGlMap.cancel();
  }
  if (debouncedUpdateSubComponents && typeof debouncedUpdateSubComponents.cancel === "function") {
    debouncedUpdateSubComponents.cancel();
  }
  stopSceneRoam();
  if (mapInstance.value) {
    mapInstance.value.dispose();
    mapInstance.value = null;
  }
});
</script>

<style lang="scss" scoped>
.echart-gl-map {
  width: 100%;
  height: 100%;
}
</style>
