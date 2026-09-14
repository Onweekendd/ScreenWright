<template>
  <div class="build-side-bar" :style="sideBarStyle">
    <div class="build-side-bar-title">图层</div>
    <buildSideBarAction />
    <buildTree ref="buildTreeRef" />
    <buildComponentSearch />
    <div v-if="sideShow" class="panel-resize-handle panel-resize-handle--right" @pointerdown="onPointerDown" />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import buildComponentSearch from "../../components/buildComponentSearch/index.vue";
import { useBuildComponentSearch } from "../../components/buildComponentSearch/useBuildComponentSearch";
import { useNavAction } from "../../useNavAction";
import { usePanelResize } from "../../usePanelResize";
import buildSideBarAction from "./buildSideBarAction.vue";
import buildTree from "./buildTree.vue";

const { sideStyle, sideShow, sideWidthPx, setSideWidth } = useNavAction();
const { buildTreeRef } = useBuildComponentSearch();
const { onPointerDown } = usePanelResize(1, () => sideWidthPx.value, setSideWidth);
// 收起时宽度为 0，但 CSS 里的四周描边（border）不会跟着消失，会挤出一条 1-2px 的细线，这里收起时顺手把边框去掉
const sideBarStyle = computed(() => ({
  ...sideStyle.value,
  border: sideShow.value ? undefined : "none"
}));
</script>
<style lang="scss" scoped>
@import "../../style/buildSiderbar.scss";
</style>
