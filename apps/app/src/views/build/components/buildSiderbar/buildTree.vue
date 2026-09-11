<template>
  <div class="build-side-tree" tabindex="10" ref="targetElementRef">
    <el-scrollbar style="width: 100%; height: 100%">
      <buildTreeNode
        :tree-data="treeData"
        :path="0"
        :expanded-ids="expandedIds"
        :parent-id="undefined"
        @toggle-expand="handleToggleExpand"
        @dblclick-handle="dblclickHandle"
        @context-menu="handleContextMenu"
        @update-children="updateNode"
      />
    </el-scrollbar>
    <buildEditInput />
  </div>
</template>

<script setup lang="ts">
/**
 * 对本文件进行直接修改时
 * 请检查
 * src\views\build\components\encodeEditor\components\Sidebar\Tree.vue
 * src\views\build\components\panelEditor\components\Siderbar\Tree.vue
 * 这两个文件是否需要同步修改
 */
import { nextTick, onMounted, ref } from "vue";

import { useKeyBoardAction } from "../buildRender/hooks/useKeyBoardAction";
import { useMenuAction } from "../buildRender/hooks/useMenuAction";
import buildEditInput from "./buildEditInput.vue";
import buildTreeNode from "./buildTreeNode.vue";
import { useEdit } from "./useEdit";
import { useTree } from "./useTree";

const { setPosition, setName, setVisible, setElement } = useEdit();
const { handleContextMenu: menuAction } = useMenuAction();
const { targetElementRef, initEventListener } = useKeyBoardAction();
defineOptions({
  name: "buildTree"
});
// 使用Tree hooks
const { treeData, updateNode } = useTree();

// 展开状态管理
const expandedIds = ref<string[]>([]);

// 处理展开/收起
const handleToggleExpand = (id: string) => {
  const index = expandedIds.value.indexOf(id);
  if (index > -1) {
    expandedIds.value.splice(index, 1);
  } else {
    expandedIds.value.push(id);
  }
  console.log("expandedIds", expandedIds.value);
};

// 右键菜单处理
const handleContextMenu = (e: MouseEvent, element: any) => {
  e.preventDefault();
  console.log("handleContextMenu", element);
  menuAction(e, element);
};

// 寻找指定的父节点元素
const findParentElement = (e: MouseEvent, className: string): HTMLElement | null => {
  let currentElement: HTMLElement | null = e.target as HTMLElement;

  // 循环遍历父元素，直到找到具有指定类名的元素或到达文档根元素
  while (currentElement && currentElement !== document.documentElement) {
    if (currentElement.classList.contains(className.replace(".", ""))) {
      return currentElement;
    }
    // 移动到父元素
    currentElement = currentElement.parentElement;
  }

  // 如果没有找到匹配的元素，返回 null
  return null;
};

// 双击处理
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

// 初始化时展开所有文件夹
const initExpandedState = () => {
  const getAllFolderIds = (items: any[]): string[] => {
    const ids: string[] = [];
    items.forEach((item) => {
      if (item.children && item.children.length > 0) {
        ids.push(item.id);
        ids.push(...getAllFolderIds(item.children));
      }
    });
    return ids;
  };
  expandedIds.value = getAllFolderIds(treeData.value);
};

// 组件挂载后初始化展开状态

onMounted(async () => {
  await nextTick();
  initEventListener();
  initExpandedState();
});
defineExpose({
  handleToggleExpand,
  expandedIds
});
</script>

<style scoped lang="scss">
.build-side-tree {
  height: calc(100% - 76px);
}
</style>
