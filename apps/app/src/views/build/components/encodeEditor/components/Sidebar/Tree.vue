<template>
  <div class="encode-side-tree" tabindex="10" ref="targetElementRef">
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
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";

import type { ComponentType } from "@/views/build/components/buildRender/type";
import buildTreeNode from "@/views/build/components/buildSiderbar/buildTreeNode.vue";
import { useTree } from "@/views/build/components/buildSiderbar/useTree";

import { useKeyBoardAction } from "../../../buildRender/hooks/useKeyBoardAction";
interface Props {
  path?: number;
  textIndex?: number;
  distance?: number;
  expanded?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  path: 0,
  textIndex: 10,
  distance: 5,
  expanded: true
});

// 使用Tree hooks
const { treeData, updateNode } = useTree({ isDynamicPanel: true });
const { targetElementRef, initEventListener } = useKeyBoardAction();

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
};

defineOptions({
  name: "encodeTree"
});

const emits = defineEmits(["dblclickHandle", "contextmenu", "dragEnd"]);

const dblclickHandle = (e: MouseEvent, element: ComponentType) => {
  emits("dblclickHandle", e, element);
};

const handleContextMenu = (e: MouseEvent, element: ComponentType) => {
  e.preventDefault();
  emits("contextmenu", e, element);
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
nextTick(() => {
  if (props.expanded) {
    initExpandedState();
  }
});
onMounted(() => {
  initEventListener();
});
defineExpose({
  handleToggleExpand,
  expandedIds
});
</script>

<style scoped lang="scss">
.encode-side-tree {
  width: 100%;
  height: 100%;
}
</style>
