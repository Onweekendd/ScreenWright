<template>
  <div class="quote-panel" v-loading="loading" @dblclick.stop="handleJumpQuotePanel">
    <div class="panel" :style="{ zIndex: isBuild.value ? 999 : '' }" v-if="isBuild.value">
      <div class="tipInfo fs-18">双击进入引用面板</div>
    </div>

    <div
      class="panel-view"
      v-if="quotePanelData"
      :style="{
        ...panelViewStyle,
        ...panelZIndexStyle
      }"
    >
      <div class="screen-quote" ref="screenQuoteRef">
        <template v-for="(item, index) in quotePanelData.sort((a, b) => b.zIndex - a.zIndex).reverse()" :key="item.id">
          <edit-group
            :disabled="true"
            v-if="item.children && item.children.length > 0"
            :groupData="item"
            :groupIndex="index"
          />
          <EditShapeBox
            v-else
            :data-id="item.id"
            :width="item.width || item.component.width"
            :height="item.height || item.component.height"
            :left="item.left"
            :top="item.top"
            :id="`${item.id}`"
            :isLock="item.isLock"
            :display="item.display"
            :disabled="true"
            :unitPavenType="item.unitPavenType"
            :enterActiveAnimation="item.loadAnimation"
            :renderWidth="Number(element.component.width)"
            :renderHeight="Number(element.component.height)"
            :style="{
              ...pointerEventStyle(item, false)
            }"
            :panel-id="element.id"
          >
            <component
              :is="renderComponent(item.component.prop)"
              :element="item"
              v-bind="item.props"
              :is-active="false"
              :style="{ overflow: item.width === 0 && item.height === 0 ? 'hidden' : '' }"
            />
          </EditShapeBox>
        </template>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { renderComponent } from "@/views/build/components/buildRender/core/utils";
import EditShapeBox from "@/views/build/components/buildRender/EditShapeBox.vue";
import EditGroup from "@/views/build/components/buildRender/Group.vue";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { pointerEventStyle } from "@/views/build/components/buildRender/utils";

import { useQuotePanel } from "./useQuotePanel";

const props = defineProps<{
  element: ComponentType;
}>();
const { quotePanelData, loading, screenQuoteRef, panelViewStyle, panelZIndexStyle, isBuild, handleJumpQuotePanel } =
  useQuotePanel(props.element);
</script>
<style lang="scss" scoped>
.quote-panel {
  width: 100%;
  height: 100%;
  position: relative;
  .panel {
    width: 100%;
    height: 100%;
    z-index: 999;
    position: relative;
    padding: 0;

    background: rgba(114, 40, 211, 0.1);
    .tipInfo {
      opacity: 0;
      color: #fff;
      text-align: center;
      font-family:
        Source Han Sans CN-Regular,
        Source Han Sans CN;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 18px;
    }
    &:hover {
      .tipInfo {
        opacity: 1;
      }
    }
  }
  .panel-view {
    overflow: hidden;
    pointer-events: auto;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: 100%;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 0;
    left: 0;
    &::-webkit-scrollbar-corner {
      background: transparent; /* 透明背景 */
    }
  }
  .screen-quote {
    width: 100%;
    height: 100%;
    position: relative;
  }
}
</style>
