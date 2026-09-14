<template>
  <div class="build-side-bar" :style="sideStyle">
    <statusManager v-if="!isScenePopupPanel" />

    <div class="build-side-bar-title">
      图层

      <buildComponentSearch type="panel" style="top: 2px" />
    </div>
    <buildSideBarAction />

    <div ref="targetElementRef" :style="{ height: sideTreeHeight }">
      <Tree :path="0" @contextmenu="handleMenu" @dblclickHandle="dblclickHandle" ref="buildTreeRef" />

      <buildEditInput />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick } from "vue";

import { findParentElement } from "@/utils/dom";
import { useNavAction } from "@/views/build/useNavAction";

import buildComponentSearch from "../../../../components/buildComponentSearch/index.vue";
import { useBuildComponentSearch } from "../../../../components/buildComponentSearch/useBuildComponentSearch";
import { useMenuAction } from "../../../buildRender/hooks/useMenuAction";
import buildEditInput from "../../../buildSiderbar/buildEditInput.vue";
import { useEdit } from "../../../buildSiderbar/useEdit";
import { usePanelInfo } from "../../usePanelInfo";
import buildSideBarAction from "./buildSideBarAction.vue";
import statusManager from "./StatusManager/panelStatusManager.vue";
import Tree from "./Tree.vue";

// import { useKeyBoardAction } from "../../../buildRender/hooks/useKeyBoardAction"
// const { targetElementRef } = useKeyBoardAction()
const { setPosition, setName, setVisible, setElement } = useEdit();
const { isScenePopupPanel } = usePanelInfo();
const { handleContextMenu } = useMenuAction();
const { sideStyle } = useNavAction();
const { buildTreeRef } = useBuildComponentSearch();
const handleMenu = (e: MouseEvent, element: any) => {
  e.preventDefault();
  handleContextMenu(e, element);
};

const sideTreeHeight = computed(() => {
  return isScenePopupPanel.value ? "calc(100% - 76px)" : "calc(100% - 76px - 212px)";
});

const dblclickHandle = async (e: MouseEvent, element: any) => {
  const parentElement = findParentElement(e, "menu-text-warp");
  if (!parentElement) {
    return;
  }
  setVisible(false);
  const disY = element.children && element.children.length > 0 ? 22 : 4;
  const s = parentElement.getBoundingClientRect();
  setPosition({ left: s.left, top: s.top - s.height - disY });
  setName(element.name);
  setElement(element);
  await nextTick();
  setVisible(true);
};
</script>
<style lang="scss" scoped>
.build-side-bar {
  width: 196px;
  height: 100%;
  overflow: hidden;
  color: #b4b7c1;
  background: var(--sw-panel-bg);
  border-right: 1px solid #000000;
  position: relative;
  outline: none;
  transition: width 0.3s;
  .build-side-bar-title {
    box-sizing: border-box;
    line-height: 36px;
    width: 100%;
    height: 36px;
    background-color: #373a47;
    color: #b4b7c1 !important;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
    text-align: center;
    border-left: 1px solid #000;
    font-size: 12px !important;
    border-right: 1px solid #000;
    position: relative;
  }
}
</style>
