<template>
  <draggable
    :animation="300"
    class="dragArea"
    tag="div"
    v-model="localTreeData"
    :group="{ name: 'g1' }"
    item-key="id"
    :move="onMove"
    ref="rootDraggable"
  >
    <template #item="{ element }: { element: ComponentType }">
      <div
        class="drag_item"
        :data-tree="element.id"
        :class="{ parent: element.children && element.children.length > 0 }"
      >
        <!-- 文件夹类型节点 -->
        <template v-if="element.children && element.children.length > 0">
          <div
            class="menu__folder"
            @click.stop="mouseClickHandle($event, element)"
            @mousedown="mousedownHandle($event, element, false)"
          >
            <div
              class="menu__item--folder"
              :class="{ 'is-active': targetChart.selectId.includes(`${element.id}`) }"
              :style="{ paddingLeft: `${path * textIndex + distance}px` }"
            >
              <Icon
                type="iconfont-arrow"
                :style="{ transform: isExpandedById(String(element.id)) ? 'rotate(90deg)' : 'rotate(0deg)' }"
                size="16"
                @click.stop="() => handleToggleExpand(String(element.id))"
                style="margin-right: 5px"
              />
              <Icon type="iconfont-folder-open" size="16" style="margin-right: 5px" />
              <div
                class="menu-text-warp flex flex-align-center"
                @dblclick="dblclickHandle($event, element)"
                @contextmenu="handleContextMenu($event, element)"
              >
                <div class="filename" :title="element.name">{{ element.name }}</div>
              </div>

              <el-tooltip effect="light" :content="getContent(element.display)" placement="top">
                <Icon
                  @click="setComponentShow(String(element.id))"
                  :type="getIconType(element.display)"
                  size="16"
                  class="eye"
                  :style="{
                    right: !element.isLock ? '10px' : '14%',
                    opacity: !element.display ? 1 : undefined
                  }"
                  color="#fff"
                />
              </el-tooltip>
              <el-tooltip effect="light" content="锁定" placement="top" v-if="element.isLock">
                <Icon type="iconfont-ai242" size="14" color="#fff" class="lock" @click="handleSingleLock(element)" />
              </el-tooltip>
            </div>
          </div>
          <!-- 子节点展开区域，传入整个children数组 -->
          <el-collapse-transition>
            <div class="menu__list" v-show="isExpandedById(String(element.id))">
              <buildTreeNode
                :tree-data="element.children || []"
                :path="path + 1"
                :text-index="textIndex"
                :distance="distance"
                :expanded-ids="expandedIds"
                :parent-id="`${element.id}`"
                @toggle-expand="
                  () => {
                    handleChildToggleExpand(String(element.id));
                  }
                "
                @dblclick-handle="
                  (event: any, sELement: any) => {
                    dblclickHandle(event, sELement as any);
                  }
                "
                @context-menu="
                  (event: any, sELement: any) => {
                    handleContextMenu(event, sELement as any);
                  }
                "
                @update-children="
                  (parentId: any, newChildren: any) => {
                    handleChildUpdateChildren(parentId, newChildren);
                  }
                "
              />
            </div>
          </el-collapse-transition>
        </template>

        <!-- 普通节点 -->
        <div
          v-else
          :style="{ paddingLeft: `${path * textIndex + distance}px` }"
          class="menu__item flex"
          :class="{ 'is-active': targetChart.selectId.includes(`${element.id}`) }"
          @click="handleMouseClickDown($event, element)"
          @mousedown="handleMousedownHandle($event, element, false)"
          @contextmenu="handleContextMenu($event, element)"
        >
          <div class="menu__icon">
            <img :src="setMinioUrl(element.img)" />
          </div>
          <div class="menu-text-warp flex flex-align-center" @dblclick="dblclickHandle($event, element)">
            <div class="filename" :title="element.name">{{ element.name }}</div>
          </div>
          <el-tooltip effect="light" :content="getContent(element.display)" placement="top">
            <Icon
              :type="getIconType(element.display)"
              size="16"
              class="eye"
              color="#fff"
              :style="{
                right: !element.isLock ? '10px' : '14%',
                opacity: !element.display ? 1 : undefined
              }"
              @click="setComponentShow(String(element.id))"
            />
          </el-tooltip>

          <el-tooltip effect="light" content="锁定" placement="top" v-if="element.isLock">
            <Icon type="iconfont-ai242" size="14" color="#fff" class="lock" @click="handleSingleLock(element)" />
          </el-tooltip>
        </div>
      </div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { computed, ref } from "vue";
import draggable from "vuedraggable";

import Icon from "@/components/Icon/index.vue";
import { setMinioUrl } from "@/utils/config";
import { notAllowToGroup } from "@/views/build/components/buildConfig/constants/index";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useAction } from "../buildRender/hooks/useAction";
import { useEditStore } from "../buildRender/hooks/useEditStore";
import { useMouseHandle } from "../buildRender/hooks/useMouseHandle";
import type { ComponentType } from "../buildRender/type";
import type { CustomDragEvent } from "./type";

const { targetChart } = useEditStore();
const { handleSingleLock, setComponentShow } = useAction();
const { allComponentMap } = useGlobalComponentData();
const { mouseClickHandle, mousedownHandle, handleSelectByGroup } = useMouseHandle();
const rootDraggable = ref<ComponentPublicInstance<InstanceType<typeof draggable>> | null>(null);

defineOptions({
  name: "buildTreeNode"
});

interface Props {
  treeData: ComponentType[];
  path: number;
  textIndex?: number;
  distance?: number;
  expandedIds?: string[];
  parentId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  textIndex: 10,
  distance: 5,
  expandedIds: () => []
});

const emits = defineEmits<{
  "dblclick-handle": [event: MouseEvent, element: ComponentType];
  "context-menu": [event: MouseEvent, element: ComponentType];
  "toggle-expand": [id: string];
  "update-expanded": [data: ComponentType];
  "update-children": [parentId: any, newChildren: ComponentType[]];
}>();

// 本地树数据，支持v-model
const localTreeData = computed({
  get: () => {
    // return [...props.treeData].sort((a, b) => b.zIndex - a.zIndex)
    return [...props.treeData];
  },
  set: (value) => {
    // 通过事件通知父组件更新数据
    handleChildUpdateChildren(props.parentId, value);
  }
});

const isCanSelect = (element: ComponentType) => {
  return element.isLock && element.parent;
};

const handleMouseClickDown = (e: MouseEvent, element: ComponentType) => {
  if (isCanSelect(element)) {
    return;
  }
  // 鼠标点击处理
  mouseClickHandle(e, element);
  const parent = allComponentMap.value.get(`${element.parent}`);
  if (parent) {
    handleSelectByGroup(e, parent, false);
  }
};
const handleMousedownHandle = (e: MouseEvent, element: ComponentType, isDrag: boolean) => {
  if (isCanSelect(element)) {
    return;
  }
  // 鼠标按下处理
  mousedownHandle(e, element, isDrag);
};

// 检查特定ID的节点是否展开
const isExpandedById = (id: string) => {
  return props.expandedIds?.includes(id) || false;
};

// 处理展开/收起
const handleToggleExpand = (id: string) => {
  emits("toggle-expand", id);
};

// 处理子节点的展开事件
const handleChildToggleExpand = (id: string) => {
  emits("toggle-expand", id);
};

// 双击处理
const dblclickHandle = (e: MouseEvent, element: ComponentType) => {
  console.log(element, "elementelementelementelement");
  emits("dblclick-handle", e, element);
};

// 右键菜单处理
const handleContextMenu = (e: MouseEvent, element: ComponentType) => {
  e.preventDefault();
  emits("context-menu", e, element);
};

// 处理子节点的数据更新
const handleChildUpdateChildren = (parentId: any, newChildren: ComponentType[]) => {
  emits("update-children", parentId, newChildren);
};

const onMove = (customDragEvent: CustomDragEvent, _originalEvent: DragEvent) => {
  if (!rootDraggable.value) {
    return true;
  }
  const element = customDragEvent.draggedContext.element;

  if (element.isLock) {
    return false;
  }
  const rootDraggableEl = rootDraggable.value.$el;

  if (notAllowToGroup.find((item) => item === element.component.prop)) {
    if (customDragEvent.to !== rootDraggableEl) {
      return false;
    }
  }

  return true;
};

// 工具函数
const getIconType = (display: boolean) => {
  return display ? "iconfont-eye" : "iconfont-eye1";
};

const getContent = (display: boolean) => {
  return display ? "隐藏" : "显示";
};
</script>

<style scoped lang="scss">
@import "src/style/theme.scss";
.dragArea {
  width: 100%;
}

.menu-text-warp {
  height: 100%;
  width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eye {
  position: absolute;
  right: 14%;
  opacity: 0;
  color: $sw-text-dim;
}

.lock {
  position: absolute;
  right: 10px;
  opacity: 1;
  color: $sw-text-dim;
}

.menu__item {
  margin: 1px 6px;
  width: calc(100% - 12px);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 48px;
  padding-right: 5px;
  position: relative;
  background-color: transparent;
  border-radius: 6px;
  cursor: pointer;
  flex: none;
  color: $sw-text-dim !important;
  font-size: 12px;
  transition: background-color 0.15s;

  .menu__icon {
    color: var(--sw-theme-color);
    margin-right: 8px;
    width: 44px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    display: block;
    border-radius: 4px;
    border: 1px solid $sw-border;
    background-color: #000000;
    overflow: hidden;
    position: relative;

    img {
      max-width: 37px;
      height: 100%;
      object-fit: contain;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  &:hover {
    color: $sw-text-strong !important;
    background-color: $sw-hover-bg;
    cursor: pointer;

    .eye {
      opacity: 1;
    }
  }
}

.filename {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.menu__item--folder {
  cursor: pointer;
  display: flex;
  align-items: center;
  margin: 1px 6px;
  padding: 6px 6px;
  color: $sw-text-dim;
  font-size: 12px;
  background-color: transparent;
  border-radius: 6px;
  position: relative;
  height: 48px;
  width: calc(100% - 12px);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  transition: background-color 0.15s;

  &:hover {
    background-color: $sw-hover-bg;
    .eye {
      opacity: 1;
    }
  }
}

.is-active {
  color: $sw-text-strong !important;
  background-color: $sw-tree-active-bg !important;
  background-image: none !important;
  box-shadow: inset 2px 0 0 $sw-active-bar;
}
</style>
