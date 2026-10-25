<template>
  <buildInfiniteCanvas :edit-width="editConfig.width" :edit-height="editConfig.height">
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
  </buildInfiniteCanvas>
</template>
<script setup lang="ts">
import type { PropType } from "vue";
import { computed, onMounted } from "vue";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import buildInfiniteCanvas from "@/views/build/components/buildInfiniteCanvas/index.vue";
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

const cEditContent = computed(() => {
  return {
    width: `${Number(props.editConfig.width)}px`,
    height: `${Number(props.editConfig.height)}px`,
    overflow: "visible"
  };
});

/**
 * @description 渲染的组件数据
 * 在面板未初始化完成前为空
 */
const renderComponent = computed(() => {
  return isLoad.value ? componentList.value : [];
});

onMounted(() => {
  componentList.value = activeStatus.value?.config ?? [];
});
</script>
