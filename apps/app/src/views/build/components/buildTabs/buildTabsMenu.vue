<template>
  <div class="build-tabs-menu flex build-render-ignore">
    <div class="build-tabs-aside" v-if="isHasChildren">
      <!-- 提炼出来这里的点击事件 需要单独处理的地方 -->
      <div
        class="build-tabs-aside-item"
        :class="{ active: currentActive === index }"
        v-for="(item, index) in props.menuGroup"
        :key="item.title"
        @click="clickFirstMenu(index)"
      >
        {{ item.title }}
      </div>
      <div class="assets-group-btn-content" v-if="materialLibraryBtnGroupShow">
        <div class="group-edit-btn" @click.stop="addMaterialLibraryGroup">
          <i class="iconfont iconfont-addIcon icon-front-style" />
        </div>
        <div class="group-edit-btn" @click.stop="delMaterialLibraryGroup">
          <i class="iconfont iconfont-subtract icon-front-style" />
        </div>
      </div>
    </div>
    <div class="build-tabs-menu-content" @scroll="handleScroll" ref="scrollContainerRef">
      <div v-if="isMaterialLibraryUploadVisible" class="el-menu-item menu-content-item">
        <div class="usehove">
          <div class="upload-btn" @click="handleOpenDialog">
            <i class="iconfont iconfont-tianjia" />
          </div>
        </div>
      </div>
      <template v-if="childrenGroups && childrenGroups.length > 0">
        <div
          class="el-menu-item menu-content-item"
          v-for="item in childrenGroups"
          :key="item.title"
          @click="handClickMenu(item)"
          @dragstart="dragStartHandle($event, item)"
          @dragend="dragendHandle"
          draggable
        >
          <AssetsItem
            :title="title"
            :option="item"
            :navListType="navListType"
            @handleAssets="handClickMenu(item)"
            @updateAssets="updateAssets(item)"
            @delItem="deleteItem(item)"
          />
        </div>
      </template>
      <template v-else>
        <div class="empty">
          <SwEmpty />
        </div>
      </template>
    </div>
  </div>
</template>
<script setup lang="ts">
import SwEmpty from "@/components/SwEmpty/index.vue";
import type {
  AssetsGroupForRender,
  MenuItemForRender,
  ModuleGroupForRender
} from "@/views/build/components/buildTabs/selectAssets/assetsMenuType";

import { useNavAction } from "../../useNavAction";
import { useEditStore } from "../buildRender/hooks/useEditStore";
import { DragKeyEnum, EditCanvasTypeEnum } from "../buildRender/type";
import AssetsItem from "./assetsItem.vue";
import { useBuildTabsMenu } from "./useBuildTabsMenu";

// 获取全局状态
const { setEditCanvas } = useEditStore();
const { navListType } = useNavAction();

interface Props {
  title: string;
  menuGroup: AssetsGroupForRender[] | MenuItemForRender[] | ModuleGroupForRender[];
}

const props = defineProps<Props>();
const emits = defineEmits(["click", "dragStartHandle", "dragendHandle", "initMaterialData"]);

// 使用业务逻辑 Hook
const {
  currentActive,
  scrollContainerRef,
  isHasChildren,
  childrenGroups,
  isMaterialLibraryUploadVisible,
  materialLibraryBtnGroupShow,
  clickFirstMenu: onClickFirstMenu,
  handleScroll: onHandleScroll,
  handleOpenDialog: onOpenDialog,
  updateAssets: onUpdateAssets,
  deleteItem: onDeleteItem,
  addMaterialLibraryGroup: onAddGroup,
  delMaterialLibraryGroup: onDelGroup
} = useBuildTabsMenu(props);

// ==================== 事件处理 ====================

/**
 * 拖拽开始处理
 */
const dragStartHandle = (e: DragEvent, item: MenuItemForRender) => {
  e!.dataTransfer!.setData(DragKeyEnum.DRAG_KEY, JSON.stringify(item));
  e!.dataTransfer!.setData("navListType", navListType.value);
  setEditCanvas(EditCanvasTypeEnum.IS_CREATE, true);
  emits("dragStartHandle", item);
};

/**
 * 拖拽结束处理
 */
const dragendHandle = () => {
  setEditCanvas(EditCanvasTypeEnum.IS_CREATE, false);
  emits("dragendHandle");
};

/**
 * 点击菜单项
 */
const handClickMenu = (item: MenuItemForRender) => {
  emits("click", item);
};

/**
 * 更新数据的统一入口
 */
const handleUpdateData = (resetUpdate = false, updateGroup = false) => {
  if (navListType.value !== "materialLibrary") {
    return;
  }

  const option = {
    title: props.title,
    menuGroup: props.menuGroup[currentActive.value] as AssetsGroupForRender,
    resetUpdate: resetUpdate,
    updateGroup: updateGroup
  };
  emits("initMaterialData", option);
};

// ==================== Hook 方法包装 ====================

/**
 * 包装切换菜单方法
 */
const clickFirstMenu = (index: number) => {
  onClickFirstMenu(index, (resetUpdate) => {
    if (navListType.value === "materialLibrary") {
      handleUpdateData(resetUpdate);
    }
  });
};

/**
 * 包装滚动处理方法
 */
const handleScroll = (e: Event) => {
  if (navListType.value === "materialLibrary") {
    onHandleScroll(e, handleUpdateData);
  }
};

/**
 * 包装打开对话框方法
 */
const handleOpenDialog = () => {
  onOpenDialog(() => handleUpdateData(true));
};

/**
 * 包装更新资产方法
 */
const updateAssets = (item: MenuItemForRender) => {
  onUpdateAssets(item, () => handleUpdateData(true));
};

/**
 * 包装删除资产方法
 */
const deleteItem = (item: MenuItemForRender) => {
  onDeleteItem(item, () => handleUpdateData(true));
};

/**
 * 包装添加分组方法
 */
const addMaterialLibraryGroup = () => {
  onAddGroup((updateGroup) => handleUpdateData(true, updateGroup));
};

/**
 * 包装删除分组方法
 */
const delMaterialLibraryGroup = () => {
  onDelGroup((updateGroup) => handleUpdateData(true, updateGroup));
};

defineExpose({
  handleUpdateData
});
</script>
<style lang="scss" scoped>
@import "../../style/buildTabsMenu.scss";
</style>
