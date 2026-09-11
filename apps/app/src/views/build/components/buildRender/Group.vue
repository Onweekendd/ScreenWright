<template>
  <EditShapeBox
    :style="{
      ...pointerEventStyle(groupData, isBuild),
      ...groupStyle,
      ...groupTransformStyle,
      ...getFrostedStyle
    }"
    :data-id="groupData.id"
    :width="groupData.component.width"
    :height="groupData.component.height"
    :left="groupData.left"
    :top="groupData.top"
    :id="`${groupData.id}`"
    :isLock="groupData.isLock"
    :display="show && groupData.display"
    :isSelect="targetChart.selectId.includes(`${groupData.id}`)"
    @click.stop="mouseClickHandle($event, groupData)"
    @mousedown="!disabled && mousedownHandle($event, groupData)"
    @mouseenter="mouseenterHandle($event, groupData)"
    @mouseleave="mouseleaveHandle($event)"
    @contextmenu="handleContextMenu($event, groupData)"
    :enterActiveAnimation="groupData.loadAnimation"
    :disabled="disabled"
    :isDynamicPanel="isDynamicPanel"
    :panel-id="panelId"
    :status-id="statusId"
    style="position: absolute"
    @dblclick="handleDbClick($event, groupData)"
    :changeKey="changeKey"
  >
    <EditShapeBox
      v-for="item in getData"
      :style="{
        left: item.left - (groupData.isOuter ? groupData.left : 0) + 'px',
        top: item.top - (groupData.isOuter ? groupData.top : 0) + 'px'
      }"
      :enterActiveAnimation="item.loadAnimation"
      :events-icon-class="eventIconClass(item)"
      :key="item.id"
      :data-id="item.id"
      :width="item.component.width"
      :height="item.component.height"
      :id="`${item.id}`"
      :isLock="item.isLock"
      :display="item.display"
      :disabled="disabled"
      :isSelect="targetChart.selectId.includes(`${item.id}`)"
      @click.stop="mouseClickHandle($event, item)"
      @mousedown="!disabled && mousedownHandle($event, item)"
      @mouseenter="mouseenterHandle($event, item)"
      @mouseleave="mouseleaveHandle($event)"
      @dblclick="handleDbClick($event, item)"
      :isDynamicPanel="isDynamicPanel"
      :panel-id="panelId"
      :status-id="statusId"
      :changeKey="changeKey"
    >
      <component
        :is="renderComponent(item.component.prop)"
        :class="{ isHidden: item.component.width === 0 && item.component.height === 0 }"
        :element="item"
        v-bind="item.props"
        style="width: 100%; height: 100%"
      />
    </EditShapeBox>
  </EditShapeBox>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useFrostedStyle } from "@/views/build/components/buildConfig/components/frostedGlassConfig/useFrostedStyle";

import { renderComponent } from "./core/utils";
import EditShapeBox from "./EditShapeBox.vue";
import { useEditStore } from "./hooks/useEditStore";
import { useMenuAction } from "./hooks/useMenuAction";
import { useMouseHandle } from "./hooks/useMouseHandle";
import type { ComponentType } from "./type";
import { eventIconClass, pointerEventStyle } from "./utils";

interface Props {
  groupData: ComponentType;
  groupIndex: number;
  disabled?: boolean;
  isDynamicPanel?: boolean;
  panelId?: number;
  statusId?: string;
  isBuild?: boolean;
  show?: boolean;
  changeKey?: number;
}

const props = withDefaults(defineProps<Props>(), {
  isDynamicPanel: false,
  isBuild: false,
  disabled: false,
  panelId: undefined,
  statusId: undefined,
  show: true,
  changeKey: 0
});
const { getFrostedStyle } = useFrostedStyle(props.groupData);
const { targetChart } = useEditStore();
const { handleContextMenu } = useMenuAction();
const { mouseenterHandle, mouseleaveHandle, mouseClickHandle, mousedownHandle, handleDbClick } = useMouseHandle({
  isDynamicPanel: props.isDynamicPanel
});

const groupStyle = computed(() => {
  const perspectiveStyle = setPerspective();
  return {
    ...perspectiveStyle
  };
});
const setPerspective = () => {
  const option = props.groupData.option;
  if (!option) {
    return {};
  }
  const left = option.originGrid.left === 0 ? "left" : option.originGrid.right === 0 ? "right" : "center";
  const top = option.originGrid.top === 0 ? "top" : option.originGrid.bottom === 0 ? "bottom" : "center";
  return {
    perspective: `${option.perspective > 0 ? option.perspective + "px" : "none"}`,
    perspectiveOrigin: `${left} ${top}`
  };
};

const groupTransformStyle = computed(() => {
  const option = props.groupData.option;
  return {
    transform: `translate3d(${option.translateX || 0}px, ${option.translateY || 0}px, ${option.translateZ || 0}px)
                    scaleX(${option.scaleX ? parseInt(option.scaleX) * 0.01 : 1})
                    scaleY(${option.scaleY ? parseInt(option.scaleY) * 0.01 : 1})
                    rotateX(${option.rotateX || 0}deg)
                    rotateY(${option.rotateY || 0}deg)
                    rotateZ(${option.rotateZ || 0}deg)
                    skewX(${option.skewX || 0}deg)
                    skewY(${option.skewY || 0}deg)`
  };
});

const getData = computed(() => {
  if (!props.groupData.children) {
    return [];
  }
  return [...props.groupData.children].sort((a, b) => b.zIndex - a.zIndex).reverse();
});
</script>
<style lang="scss" scoped>
.isHidden {
  overflow: hidden;
}
</style>
