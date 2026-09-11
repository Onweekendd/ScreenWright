<template>
  <div class="build-side-bar" :style="sideStyle">
    <div class="build-side-bar-title">图层管理</div>
    <buildSideBarAction />
    <buildTree ref="buildTreeRef" />
    <buildComponentSearch />
    <div v-if="sideShow" class="panel-resize-handle panel-resize-handle--right" @pointerdown="onPointerDown" />
  </div>
</template>
<script setup lang="ts">
import buildComponentSearch from "../../components/buildComponentSearch/index.vue";
import { useBuildComponentSearch } from "../../components/buildComponentSearch/useBuildComponentSearch";
import { useNavAction } from "../../useNavAction";
import { usePanelResize } from "../../usePanelResize";
import buildSideBarAction from "./buildSideBarAction.vue";
import buildTree from "./buildTree.vue";

const { sideStyle, sideShow, sideWidthPx, setSideWidth } = useNavAction();
const { buildTreeRef } = useBuildComponentSearch();
const { onPointerDown } = usePanelResize(1, () => sideWidthPx.value, setSideWidth);
</script>
<style lang="scss" scoped>
@import "../../style/buildSiderbar.scss";
</style>
