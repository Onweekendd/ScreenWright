<template>
  <buildEditRule ref="buildEditRuleRef" :edit-width="editConfig.width" :edit-height="editConfig.height">
    <div
      id="go-chart-edit-content"
      :style="cEditContent"
      @drop="dragHandle"
      @dragover="dragoverHandle"
      @dragenter="dragoverHandle"
    >
      <buildRender :editConfig="editConfig" v-model="renderComponent" />

      <AlignmentLines />

      <GridRect v-if="isShowGridRect" :grid="GRID_SIZE" />
      <!-- 选择框 -->
      <EditSelect />
    </div>
  </buildEditRule>
</template>
<script setup lang="ts">
import type { ComponentPublicInstance, PropType } from "vue";
import { computed, nextTick, ref, watch } from "vue";
import { onMounted } from "vue";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import buildEditRule from "@/views/build/components/buildEditRule/index.vue";
import AlignmentLines from "@/views/build/components/buildRender/components/AlignmentLines.vue";
import EditSelect from "@/views/build/components/buildRender/EditSelect.vue";
import GridRect from "@/views/build/components/buildRender/GridRect.vue";
import { useDrag } from "@/views/build/components/buildRender/hooks/useDrag";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { EditCanvasTypeEnum } from "@/views/build/components/buildRender/type";

import { usePanelInfo } from "../../usePanelInfo";
import buildRender from "./panelRender.vue";

const GRID_SIZE = 20;

const { dragHandle, dragoverHandle } = useDrag({ isDynamicPanel: true });
const { componentList, editCanvas, targetChart } = useEditStore();
const { isLoad, activeStatus } = usePanelInfo();
const props = defineProps({
  editConfig: {
    type: Object as PropType<LargeScreenDetailInfo>,
    required: true,
    default: () => ({})
  }
});

const isDrag = computed(() => editCanvas.value[EditCanvasTypeEnum.IS_DRAG]);
const isShowGridRect = computed(() => targetChart.value.selectId.length > 0 && isDrag.value);

const buildEditRuleRef = ref<ComponentPublicInstance<InstanceType<typeof buildEditRule>> | null>(null);

watch([() => props.editConfig.width, () => props.editConfig.height], ([newWidth, newHeight]) => {
  nextTick(() => {
    if (buildEditRuleRef.value) {
      buildEditRuleRef.value.resizeCanvasAndRuler(Number(newWidth), Number(newHeight));
    }
  });
});

const cEditContent = computed(() => {
  return {
    width: `${Number(props.editConfig.width)}px`,
    height: `${Number(props.editConfig.height)}px`,
    overflow: "visible",
    boxShadow: "0 8px 10px rgb(30 30 30 / 12%)",
    transform: `scale(${props.editConfig.scale})`,
    flexShrink: 0
  };
});

/**
 * @description 渲染的组件数据
 * 在面板未初始化完成前为空
 */
const renderComponent = computed(() => {
  return isLoad.value ? componentList.value : [];
});

onMounted(async () => {
  componentList.value = activeStatus.value?.config ?? [];

  await nextTick();
  if (buildEditRuleRef.value) {
    buildEditRuleRef.value.resizeCanvasAndRuler(Number(props.editConfig.width), Number(props.editConfig.height));
  }
});
</script>
