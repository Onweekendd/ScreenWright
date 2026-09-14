<!-- 渲染组件 -->
<template>
  <div
    ref="editorRef"
    v-loading="loading"
    @mousedown="mousedownBoxSelect"
    @contextmenu="handleContextMenu($event, null)"
    id="render-container"
    class="es-editor"
    @click.stop
    :style="editorStyle"
  >
    <div class="es-editor-bg">
      <div :style="btStyleAttrs" class="es-editor-bg-content">
        <template v-for="(item, index) in data" :key="item.id">
          <EditGroup
            :disabled="disabled"
            v-if="item.children && item.children.length > 0"
            :groupData="item"
            :groupIndex="index"
            :isDynamicPanel="true"
            :panel-id="panelInfo.config.id"
            :status-id="activeStatusId"
            :isBuild="isBuild()"
          />

          <EditShapeBox
            v-else
            :events-icon-class="eventIconClass(item)"
            :disabled="disabled"
            :scale="editConfig.scale"
            :isDynamicPanel="true"
            :style="{
              ...pointerEventStyle(item, isBuild())
            }"
            :data-id="item.id"
            :width="item.component.width"
            :height="item.component.height"
            :left="item.left"
            :top="item.top"
            :id="`${item.id}`"
            :isLock="item.isLock"
            :display="item.display"
            :unitPavenType="item.unitPavenType"
            :enterActiveAnimation="item.loadAnimation"
            :isSelect="targetChart.selectId.includes(`${item.id}`)"
            @click.stop="mouseClickHandle($event, item)"
            @mousedown="!disabled && mousedownHandle($event, item)"
            @mouseenter="mouseenterHandle($event, item)"
            @mouseleave="mouseleaveHandle($event)"
            @contextmenu="handleContextMenu($event, item)"
            @dblclick="handleDbClick($event, item)"
            :panel-id="panelInfo.config.id"
            :status-id="activeStatusId"
            :renderWidth="Number(editConfig.width)"
            :renderHeight="Number(editConfig.height)"
          >
            <component
              :style="{ overflow: item.component.width === 0 && item.component.height === 0 ? 'hidden' : '' }"
              :is="renderComponent(item.component.prop)"
              :element="item"
              v-bind="item.props"
              class="es-component"
            />
          </EditShapeBox>
        </template>
        <!-- 对齐线 -->
        <!-- <EditAlignLine v-if="!disabled" /> -->
      </div>
    </div>
    <!-- 选中态框 + 拖动 + 缩放锚点 -->
    <SelectionTransformer is-dynamic-panel :disabled="disabled" :on-db-click="handleDbClick" />
  </div>
</template>
<script setup lang="ts">
import type { PropType } from "vue";

import type { LargeScreenDetailInfo } from "@screenwright/types";

import { textEnum } from "@/components/componentEntry/type";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import { renderComponent } from "@/views/build/components/buildRender/core/utils";
import EditShapeBox from "@/views/build/components/buildRender/EditShapeBox.vue";
import EditGroup from "@/views/build/components/buildRender/Group.vue";
import { useBaseRender } from "@/views/build/components/buildRender/hooks/useBaseRender";
import { useFtTextEdit } from "@/views/build/components/buildRender/hooks/useFtTextEdit";
import { useMouseHandle } from "@/views/build/components/buildRender/hooks/useMouseHandle";
import SelectionTransformer from "@/views/build/components/buildRender/SelectionTransformer.vue";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { eventIconClass, pointerEventStyle } from "@/views/build/components/buildRender/utils";
import { usePanelInfo } from "@/views/build/components/panelEditor/usePanelInfo";

const { panelInfo, activeStatusStack, activeStatusId } = usePanelInfo();
const { setTextEdit } = useFtTextEdit();
const { handleDbClick: handleMouseDbClick } = useMouseHandle({ isDynamicPanel: true });
const props = defineProps({
  modelValue: {
    type: Object as PropType<ComponentType[]>,
    required: true,
    default: () => ({})
  },
  editConfig: {
    type: Object as PropType<LargeScreenDetailInfo>,
    required: true,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const {
  editorRef,
  loading,
  targetChart,
  isBuild,
  data,
  btStyleAttrs,
  editorStyle,
  handleContextMenu,
  mouseenterHandle,
  mouseleaveHandle,
  mouseClickHandle,
  mousedownHandle,
  mousedownBoxSelect,
  handleDbClick,
  router
} = useBaseRender(props, {
  isDynamicPanel: true,
  onDbClick: (e: MouseEvent, item: ComponentType) => {
    handleMouseDbClick(e, item);
    if (item.component.prop === PanelType.dynamicPanel) {
      activeStatusStack.value.push({
        panelId: panelInfo.value.config.id!,
        activeStatusId: activeStatusId.value
      });

      router.push({
        name: "panel",
        params: { cid: item.id }
      });
    }
    if (item.component.prop === textEnum.FtText && isBuild()) {
      console.log("双击文本框");
      setTextEdit(item);
    }
  }
});
</script>
<style lang="scss" scoped>
.es-editor {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  height: 100%;
  // background: var(--sw-panel-bg);
  box-shadow: var(--el-box-shadow);
  background-size: 100% 100%;
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOAQMAAAAlhr+SAAAABlBMVEUqLjNSXWS1zSUzAAAAD0lEQVQI12NgwADMYIQBAACrAAd4ROv5AAAAAElFTkSuQmCC)
    repeat;

  .es-editor-bg {
    width: 100%;
    height: 100%;
    background-image:
      linear-gradient(45deg, rgb(64, 64, 64) 25%, transparent 0px, transparent 75%, rgb(64, 64, 64) 0px),
      linear-gradient(45deg, rgb(64, 64, 64) 25%, transparent 0px, transparent 75%, rgb(64, 64, 64) 0px);
    background-size: 10px 10px;
    background-position:
      0px 0px,
      5px 5px;
  }
}

.es-component {
  width: 100%;
  height: 100%;
}
</style>
