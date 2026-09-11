<template>
  <div class="build-config" :style="configStyle">
    <div v-if="configShow" class="panel-resize-handle panel-resize-handle--left" @pointerdown="onPointerDown" />
    <template v-if="selectTargetData.length > 0">
      <template v-if="isHasGroup">
        <groupConfig />
      </template>
      <template v-if="selectTargetData.length > 1">
        <pageSetUpConfig />
      </template>
      <attrsRender v-show="selectTargetData.length === 1 && !isNil(selectTargetData[0])" />
    </template>
    <template v-else>
      <graphConfig />
    </template>
    <configLock v-if="selectTargetData[0] && selectTargetData[0].isLock" />
    <!-- 项目过滤器 -->
    <globalProjectFilter v-if="projectFilterShow" />
    <!-- 全局回调管理 -->
    <globalCallbackManager />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { isNil } from "lodash-es";

import { useNavAction } from "../../useNavAction";
import { usePanelResize } from "../../usePanelResize";
import { useEditStore } from "../buildRender/hooks/useEditStore";
import attrsRender from "./attrsRender/index.vue";
import configLock from "./components/configLock/index.vue";
import globalCallbackManager from "./globalCallbackManager/index.vue";
import globalProjectFilter from "./globalProjectFliter/index.vue";
import graphConfig from "./graphConfig/index.vue";
import groupConfig from "./groupConfig/index.vue";
import pageSetUpConfig from "./pageSetUpConfig/index.vue";

const { configStyle, projectFilterShow, configShow, configWidthPx, setConfigWidth } = useNavAction();
const { selectTargetData } = useEditStore();
const { onPointerDown } = usePanelResize(-1, () => configWidthPx.value, setConfigWidth);
const isHasGroup = computed(() => {
  const len = selectTargetData.value.length;
  return len === 1 && selectTargetData.value.some((v) => v && v.children && v.children.length > 0);
});
</script>
<style lang="scss" scoped>
.build-config {
  height: 100%;
  overflow: hidden;
  color: #b4b7c1;
  background: #232630;
  border-left: 1px solid #000000;
  transition: width 0.3s;
  position: relative;
}

// 面板拖拽把手
.panel-resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 5px;
  z-index: 30;
  cursor: col-resize;
  transition: background-color 0.15s;

  &--left {
    left: 0;
  }
  &:hover {
    background-color: #7c42ee;
  }
}
</style>
