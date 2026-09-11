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
import { ref } from "vue";

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
const handleShow = (title: string) => {
  currentTitle.value = title;
  handlePopoverVisible();
  if (buildTabsMenuRef.value && buildTabsMenuRef.value.handleUpdateData) {
    buildTabsMenuRef.value.handleUpdateData(true);
  }
};

const emits = defineEmits(["click", "initMaterialData"]);

const initMaterialData = (options: {
  title: string;
  menuGroup: AssetsGroupForRender | MenuItemForRender | ModuleGroupForRender;
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
.build-tabs-item {
  width: 84px;
  height: 100%;
  color: rgb(180, 183, 193);
  font-size: 12px;
  cursor: pointer;
  user-select: none;
  transition:
    border-color 0.3s,
    background-color 0.3s,
    color 0.3s;
  &:hover {
    background-color: rgba(80, 84, 99, 0.8) !important;
    color: #ffffff !important;
  }
}
</style>
