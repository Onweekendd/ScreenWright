<template>
  <el-popover
    popper-class="sw-select-dropdown build-tabs-sub-menu"
    transition="el-zoom-in-top"
    placement="bottom-start"
    :width="585"
    trigger="click"
    :offset="0"
    ref="popover"
    :visible="popoverVisible"
  >
    <template #reference>
      <div
        class="build-tabs-item flex flex-center"
        @click="handleShow(title)"
        :data-title="title"
        :data-translate="title"
      >
        {{ title }}
      </div>
    </template>
    <buildTabsMenu
      ref="buildTabsMenuRef"
      @click="handleClick"
      @dragendHandle="dragendHandle"
      :title="title"
      @initMaterialData="initMaterialData"
      :menuGroup="menuGroup"
    />
  </el-popover>
</template>
<script setup lang="ts">
import { nextTick, ref } from "vue";

import type { PopoverInstance } from "element-plus";

import { usePopoverVisible } from "@/hooks/usePopoverVisible";
import { findParentElement } from "@/utils/dom";
import type {
  AssetsGroupForRender,
  MenuItemForRender,
  ModuleGroupForRender
} from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";

import buildTabsMenu from "./buildTabsMenu.vue";

interface Props {
  title: string;
  menuGroup: AssetsGroupForRender[] | MenuItemForRender[] | ModuleGroupForRender[];
}
defineProps<Props>();
const currentTitle = ref<string>("");
const buildTabsMenuRef = ref<InstanceType<typeof buildTabsMenu> | null>(null);
const { popoverVisible, handlePopoverVisible } = usePopoverVisible({
  target: ".build-tabs-sub-menu",
  ignore: [".build-render-ignore"],
  callBack: (e) => {
    const dom = findParentElement(e, "build-tabs-item");
    if (!dom) {
      popoverVisible.value = false;
    } else {
      const title = dom.getAttribute("data-title");
      if (currentTitle.value !== title) {
        popoverVisible.value = false;
      }
    }
  }
});
const handleShow = async (title: string) => {
  currentTitle.value = title;
  handlePopoverVisible();
  await nextTick();
  if (buildTabsMenuRef.value && buildTabsMenuRef.value.handleUpdateData) {
    buildTabsMenuRef.value.handleUpdateData(true);
  }
};

const emits = defineEmits(["click", "initMaterialData"]);

const initMaterialData = (options: {
  title: string;
  menuGroup?: AssetsGroupForRender | MenuItemForRender | ModuleGroupForRender;
  resetUpdate: boolean;
  updateGroup: boolean;
}) => {
  emits("initMaterialData", options);
};

const popover = ref<PopoverInstance | null>(null);
const handleClick = (item: any) => {
  emits("click", item);
  popover.value?.hide();
};
const dragendHandle = () => {
  popover.value?.hide();
};
</script>
<style lang="scss" scoped>
@import "src/style/theme.scss";
.build-tabs-item {
  width: 76px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 6px;
  color: $sw-text-dim;
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  transition:
    background-color 0.15s,
    color 0.15s;
  &:hover {
    background-color: $sw-hover-bg !important;
    color: $sw-text-strong !important;
  }
}
</style>
