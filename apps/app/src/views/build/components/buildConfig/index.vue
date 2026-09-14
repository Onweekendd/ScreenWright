<template>
  <div class="build-config" :style="configBarStyle">
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
// 收起时宽度为 0，但 CSS 里的四周描边（border）不会跟着消失，会挤出一条 1-2px 的细线，这里收起时顺手把边框去掉
const configBarStyle = computed(() => ({
  ...configStyle.value,
  border: configShow.value ? undefined : "none"
}));
const isHasGroup = computed(() => {
  const len = selectTargetData.value.length;
  return len === 1 && selectTargetData.value.some((v) => v && v.children && v.children.length > 0);
});
</script>
<style lang="scss" scoped>
@import "src/style/theme.scss";
.build-config {
  flex-shrink: 0;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  color: $sw-text;
  background: var(--sw-panel-bg);
  border: 1px solid $sw-border;
  border-radius: 12px;
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
    background-color: var(--sw-theme-color);
  }
}
</style>
