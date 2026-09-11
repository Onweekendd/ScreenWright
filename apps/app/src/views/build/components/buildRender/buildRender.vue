<template>
  <buildEditRule ref="buildEditRuleRef">
    <div
      id="go-chart-edit-content"
      :style="cEditContent"
      @drop="dragHandle"
      @dragover="dragoverHandle"
      @dragenter="dragoverHandle"
    >
      <buildRender :editConfig="editConfig" v-model="componentList" />

      <!-- WASM 对齐线 -->
      <AlignmentLines />

      <GridRect v-if="isShowGridRect" :grid="GRID_SIZE" />
      <!-- 选择框 -->
      <EditSelect />
    </div>
  </buildEditRule>
</template>
<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { computed, nextTick, ref } from "vue";
import { onMounted } from "vue";

import { type ComponentType, EditCanvasTypeEnum } from "@/views/build/components/buildRender/type";

import buildEditRule from "../buildEditRule/index.vue";
import AlignmentLines from "./components/AlignmentLines.vue";
import EditSelect from "./EditSelect.vue";
import GridRect from "./GridRect.vue";
import { useAlignmentWasm } from "./hooks/useAlignmentWasm";
import { useDirection } from "./hooks/useDirection";
import { useDrag } from "./hooks/useDrag";
import { useEditStore } from "./hooks/useEditStore";
import buildRender from "./index.vue";
const GRID_SIZE = 20;

const { dragHandle, dragoverHandle } = useDrag();
const { componentList, editConfig, isBuild, editCanvas, targetChart } = useEditStore();
const { initDirection } = useDirection();
const { syncComponentData } = useAlignmentWasm();

const buildEditRuleRef = ref<ComponentPublicInstance<InstanceType<typeof buildEditRule>> | null>(null);

const isDrag = computed(() => editCanvas.value[EditCanvasTypeEnum.IS_DRAG]);

const isShowGridRect = computed(() => targetChart.value.selectId.length > 0 && isDrag.value);

const cEditContent = computed(() => {
  return {
    width: `${Number(editConfig.value.width)}px`,
    height: `${Number(editConfig.value.height)}px`,
    overflow: "visible",
    boxShadow: "0 8px 10px rgb(30 30 30 / 12%)",
    transform: `scale(${editConfig.value.scale})`,
    flexShrink: 0
  };
});

const initRender = (newVal: ComponentType[]) => {
  componentList.value = newVal;

  if (isBuild()) {
    syncComponentData({
      renderWidth: Number(editConfig.value.width ?? 0),
      renderHeight: Number(editConfig.value.height ?? 0)
    });
  }
};

onMounted(async () => {
  await nextTick();
  if (buildEditRuleRef.value) {
    buildEditRuleRef.value.resizeCanvasAndRuler(Number(editConfig.value.width), Number(editConfig.value.height));
  }
});

defineExpose({
  initRender,
  initDirection
});
</script>
