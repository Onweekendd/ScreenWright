<!-- 动态面板添加了预加载 - 优化版本 -->
<template>
  <template v-for="statusData in renderedStatusData" :key="statusData.id">
    <template v-for="(item, index) in statusData.renderedComponent" :key="item.id">
      <template v-if="item.children && item.children.length > 0">
        <edit-group
          :show="statusData.id === activeStatus?.id"
          :disabled="!isBuild"
          :groupData="item"
          :groupIndex="index"
          :panel-id="component.id"
          :status-id="activeStatus?.id"
          :is-dynamic-panel="true"
          :isBuild="isBuild"
          :changeKey="changeKey"
        />
      </template>
      <template v-else>
        <EditShapeBox
          :data-id="item.id"
          :width="item.component.width"
          :height="item.component.height"
          :left="item.left"
          :top="item.top"
          :id="`${item.id}`"
          :isLock="item.isLock"
          :display="statusData.id === activeStatus?.id && item.display"
          :disabled="true"
          :unitPavenType="item.unitPavenType"
          :enterActiveAnimation="item.loadAnimation"
          :renderWidth="Number(component.component.width)"
          :renderHeight="Number(component.component.height)"
          :style="{
            ...pointerEventStyle(item, isBuild)
          }"
          :panel-id="component.id"
          :status-id="activeStatus?.id"
          :changeKey="changeKey"
        >
          <component
            :is="renderComponent(item.component.prop)"
            :element="item"
            v-bind="item.props"
            :is-active="false"
          />
        </EditShapeBox>
      </template>
    </template>
  </template>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";

import { useProgressiveRender } from "@/components/SystemComponent/DynamicPanel/components/useProgressiveRender";
import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import type { PanelState } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { renderComponent } from "@/views/build/components/buildRender/core/utils";
import EditShapeBox from "@/views/build/components/buildRender/EditShapeBox.vue";
import EditGroup from "@/views/build/components/buildRender/Group.vue";
import { pointerEventStyle } from "@/views/build/components/buildRender/utils";

interface Props {
  activeStatus: PanelState | null;
  component: DynamicPanelProps;
  isBuild: boolean;
  changeKey?: number;
}

const props = defineProps<Props>();

// 使用渐进式渲染 Hook
const { renderedStatusData, initializeRender, dispose } = useProgressiveRender(props.component, {
  batchSize: 5,
  priorityIndex: 0,
  renderInterval: 100
});

onMounted(() => {
  initializeRender();
});

onUnmounted(() => {
  dispose();
});
</script>

<style lang="scss" scoped>
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(2px);
  z-index: 9999;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  position: relative;
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
}

.spinner-ring {
  position: absolute;
  border: 2px solid color-mix(in srgb, var(--sw-theme-color) 30%, transparent);
  border-radius: 50%;
  animation: spin 2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-ring:nth-child(1) {
  width: 60px;
  height: 60px;
  top: 0;
  left: 0;
  border-top-color: var(--sw-theme-color);
}

.spinner-ring:nth-child(2) {
  width: 45px;
  height: 45px;
  top: 7.5px;
  left: 7.5px;
  border-right-color: color-mix(in srgb, var(--sw-theme-color) 80%, transparent);
  animation-delay: -0.5s;
}

.spinner-ring:nth-child(3) {
  width: 30px;
  height: 30px;
  top: 15px;
  left: 15px;
  border-bottom-color: color-mix(in srgb, var(--sw-theme-color) 60%, transparent);
  animation-delay: -1s;
}

.spinner-ring:nth-child(4) {
  width: 15px;
  height: 15px;
  top: 22.5px;
  left: 22.5px;
  border-left-color: color-mix(in srgb, var(--sw-theme-color) 40%, transparent);
  animation-delay: -1.5s;
}

.loading-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--sw-theme-color);
  animation: fadeIn 1.5s ease-in-out infinite alternate;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
