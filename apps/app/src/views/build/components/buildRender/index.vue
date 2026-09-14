<!-- 渲染组件 -->
<!-- @mousedown="mousedownBoxSelect" -->
<template>
  <div
    ref="editorRef"
    v-loading="loading"
    @contextmenu="handleContextMenu($event, null)"
    id="render-container"
    class="es-editor"
    @mousedown="handleEditorMouseDown"
    @click.stop
    :style="editorStyle"
  >
    <template v-for="(component, index) in data" :key="component.id">
      <edit-group
        :disabled="disabled"
        v-if="component.children && component.children.length > 0"
        :groupData="component"
        :groupIndex="index"
        :isBuild="isBuild"
        :panel-id="panelId"
        :status-id="statusId"
      />

      <EditShapeBox
        v-else
        :events-icon-class="eventIconClass(component)"
        :disabled="disabled"
        :scale="editConfig.scale"
        :style="{
          ...pointerEventStyle(component, isBuild),
          ...customPositionStyle(component, isBuild)
        }"
        :data-id="component.id"
        :width="component.component.width"
        :height="component.component.height"
        :left="component.left"
        :top="component.top"
        :id="`${component.id}`"
        :isLock="component.isLock"
        :display="component.display"
        :prop="component.component.prop"
        :unitPavenType="component.unitPavenType"
        :enterActiveAnimation="component.loadAnimation"
        :isSelect="targetChart.selectId.includes(`${component.id}`)"
        :renderWidth="Number(editConfig.width)"
        :renderHeight="Number(editConfig.height)"
        @click.stop="!disabled && mouseClickHandle($event, component)"
        @mousedown="!disabled && mousedownHandle($event, component)"
        @mouseenter="mouseenterHandle($event, component)"
        @mouseleave="mouseleaveHandle($event)"
        @contextmenu="handleContextMenu($event, component)"
        @dblclick="handleDbClick($event, component)"
        :panel-id="panelId"
        :status-id="statusId"
      >
        <component
          :is="renderComponent(component.component.prop)"
          :element="component"
          v-bind="component.props"
          class="es-component"
          :class="{ isHidden: component.component.width === 0 && component.component.height === 0 }"
        />
      </EditShapeBox>
    </template>

    <!-- 对齐线 -->
    <!-- <EditAlignLine v-if="!disabled" /> -->
    <!-- 水印 -->
    <GridWaterMark v-if="disabled" />
    <!-- 选中态框 + 拖动 + 缩放锚点 -->
    <SelectionTransformer :edit-config="editConfig" :disabled="disabled" :on-db-click="handleDbClick" />
  </div>
</template>
<script setup lang="ts">
import type { LargeScreenDetailInfo } from "@screenwright/types";

import { renderComponent } from "./core/utils";
import EditShapeBox from "./EditShapeBox.vue";
import GridWaterMark from "./GridWaterMark.vue";
import EditGroup from "./Group.vue";
// import EditAlignLine from "./EditAlignLine.vue"
import SelectionTransformer from "./SelectionTransformer.vue";
import type { ComponentType } from "./type";
import { useBuildRender } from "./useBuildRender";
import { customPositionStyle, eventIconClass, pointerEventStyle } from "./utils";

const props = withDefaults(
  defineProps<{
    modelValue: ComponentType[];
    editConfig: LargeScreenDetailInfo & { enableScroll?: boolean };
    disabled?: boolean;
    panelId?: number;
    statusId?: string;
  }>(),
  {
    disabled: false
  }
);

const {
  editorRef,
  loading,
  targetChart,
  isBuild,
  data,
  editorStyle,
  handleContextMenu,
  handleEditorMouseDown,
  mouseenterHandle,
  mouseleaveHandle,
  mouseClickHandle,
  mousedownHandle,
  handleDbClick
} = useBuildRender(props);
</script>
<style lang="scss" scoped>
.es-editor {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100%;
  box-shadow: var(--el-box-shadow);
  background-size: 100% 100%;
}
.es-component {
  width: 100%;
  height: 100%;
  &.isHidden {
    overflow: hidden;
  }
}
</style>
