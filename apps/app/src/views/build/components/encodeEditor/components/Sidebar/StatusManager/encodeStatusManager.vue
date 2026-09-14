<template>
  <div @click.self="handleStatusMenuClose" class="isPanelViewStatus">
    <div class="title manage">
      状态管理
      <span class="icon-list">
        <i class="iconAdd iconfont iconfont-jiahao" @click.stop="handleAddPanelStatus" />
      </span>
    </div>
    <draggable
      :group="{ name: 'form' }"
      ghost-class="ghost"
      :list="panelData"
      :animation="300"
      class="isPanelViewStatus-list"
      @change="handleDragChange"
      @start="dragStart"
      @end="dragEnd"
      item-key="id"
    >
      <template #item="{ element, index }: { element: PanelState; index: number }">
        <div
          :class="`menu__item flex ${element.id === activeStatusId ? 'active' : ''}`"
          @click="() => handleChangePanelStatus(element.id)"
          @contextmenu="(e) => handleContextMenu(e, element)"
        >
          <span class="iconfont iconfont-yemian" :style="{ fontSize: '12px' }" />
          <div
            class="menu__item__item"
            @dblclick="() => handleDblStatus({ ...element, index })"
            v-if="!statusEdit || statusActiveIndex !== index"
          >
            {{ element.name }}
          </div>
          <el-input
            ref="editNameRef"
            v-if="statusEdit && statusActiveIndex === index"
            @keyup.enter="handleSaveEnter(index)"
            v-model="statusActiveName"
            autofocus
            @change="handleBlurStatus(index)"
          />
        </div>
      </template>
    </draggable>
    <statusMenu />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import draggable from "vuedraggable";
import { onClickOutside } from "@vueuse/core";

import type { EncodePanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/EncodePanel";
import { useAction } from "@/views/build/components/buildRender/hooks/useAction";

import type { PanelState } from "../../../../buildRender/core/SystemComponent/type";
import { useEncodePanelAction } from "../../../useEncodePanelAction";
import { useEncodePanelInfo } from "../../../useEncodePanelInfo";
import statusMenu from "./statusMenu.vue";
import { useStatusMenuAction } from "./useStatusMenuAction";

const { handleContextMenu, setStatusMenuShow } = useStatusMenuAction();

// Use composition hooks
const { activeStatusId, panelData, panelInfo } = useEncodePanelInfo();
const { addPanelStatus, changePanelStatus, onStatusOrderChange } = useEncodePanelAction();
const { updateComponentLayers } = useAction();

// Local state
const statusActiveIndex = ref<number>(-1);
const statusEdit = ref<boolean>(false);
const statusActiveName = ref<string>("");
const editNameRef = ref<HTMLInputElement | null>(null);

// Like in buildTree.vue
const isDragging = ref<boolean>(false);

// 拖拽排序前的状态顺序快照，供 onStatusOrderChange 生成可撤销的排序命令
const dragOrderSnapshot = ref<PanelState[] | null>(null);

onClickOutside(
  editNameRef as unknown as HTMLElement,
  () => {
    nextTick(() => {
      statusEdit.value = false;
    });
  },
  {
    ignore: []
  }
);

const handleStatusMenuClose = (): void => {
  setStatusMenuShow(false);
};

const handleAddPanelStatus = (): void => {
  addPanelStatus();
};

const handleChangePanelStatus = (statusId: string): void => {
  changePanelStatus(statusId);
};

interface StatusItem extends PanelState {
  index: number;
}

const handleDblStatus = (item: StatusItem): void => {
  statusActiveIndex.value = item.index;
  statusActiveName.value = item.name;
  statusEdit.value = true;

  // Focus input with nextTick
  nextTick(() => {
    if (editNameRef.value) {
      editNameRef.value.focus();
    }
  });
};
const handleSaveEnter = (index: number): void => {
  handleSave(index);
  statusEdit.value = false;
};
const handleSave = (index: number) => {
  if (!panelData.value[index]) return;

  if (statusActiveName.value.trim()) {
    const newName = statusActiveName.value.trim();

    const targetStatus = panelData.value[index];

    targetStatus.name = newName;
    updateComponentLayers(panelInfo.value.config as EncodePanelProps);
  }
};
const handleBlurStatus = (index: number): void => {
  handleSave(index);
};

const handleDragChange = (): void => {
  onStatusOrderChange(dragOrderSnapshot.value ?? undefined);
  dragOrderSnapshot.value = null;
};

// Similar to buildTree's drag handlers
const dragStart = (): void => {
  isDragging.value = true;
  dragOrderSnapshot.value = [...panelData.value];
};

const dragEnd = (): void => {
  isDragging.value = false;
};
</script>

<style lang="scss" scoped>
.isPanelViewStatus {
  height: 212px;
  transition: height 0.25s linear;
  width: 100%;
  &.expandHeight {
    height: calc(100% - 212px);
  }
  .isPanelViewStatus-list {
    width: 100%;
    height: calc(100% - 36px);
    overflow: auto;
  }
  &.scene-status {
    height: auto;
    .isPanelViewStatus-list {
      height: 168px;
    }
  }
}

:deep(.el-input) {
  width: calc(100% - 20px);
  height: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  flex: 1;
  margin-left: 8px;
  .el-input__wrapper {
    width: calc(100% - 20px);
    height: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    background-color: transparent;
    box-shadow: none;
    border: none;
    padding: 1px 0px;
    .el-input__inner {
      width: 100%;
      height: calc(100% - 4px);
      // background-color: rgba(24, 27, 36, 0.2) !important;
      background-color: rgba(35, 39, 50, 0.8) !important;
      border: none !important;
      color: #fff !important;
      padding: 0 10px !important;
      border-radius: 4px !important;
    }
  }
}

.title {
  font-size: 12px;
  font-family:
    Source Han Sans CN-Normal,
    Source Han Sans CN;
  font-weight: 400;
  text-align: center;
}

.menu__item {
  padding-left: 15px;
  height: 30px;
  line-height: 30px;
  color: #fff !important;
  margin-bottom: 1px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0 6px 0 10px;
  position: relative;
  background-color: transparent;
  cursor: pointer;
  flex: none;
  font-size: 12px;
  &.is-over,
  &:hover {
    color: #fff !important;
    background-color: #313239;
    cursor: pointer;
  }
  &.is-hidden {
    color: #666666 !important;
  }
  &.ghost {
    opacity: 0.6;
    color: #fff !important;
    background: var(--sw-theme-color) !important;
    cursor: move;
  }

  &__item {
    margin-left: 8px;
    width: 100%;
  }

  &.active {
    background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%) !important;
    color: #ffffff !important;
    span:nth-child(2) {
      width: 77px;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
}

.manage {
  height: 36px;
  line-height: 36px;
  background: #3d404d;
  color: #b4b7c1;
  .iconClose {
    transform: rotateX(180deg);
  }
  .icon-list {
    float: right;
    padding: 0 5px;
    & > i {
      margin: 0 5px;
      cursor: pointer;
      &:hover {
        color: #ffffff;
      }
    }
  }
}
</style>
