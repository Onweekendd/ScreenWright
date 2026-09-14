<template>
  <div class="source-tree">
    <el-tree-v2
      v-if="isTreeShow"
      :class="{ 'show-checkbox': showCheckbox }"
      ref="treeRef"
      style="max-width: 600px"
      :height="200"
      :data="filteredTreeData"
      :props="defaultProps"
      :current-node-key="currentNodeKey"
      :expand-on-click-node="false"
      :default-checked-keys="normalizedCheckedKeys"
      :load="onLoadNode"
      :show-checkbox="showCheckbox"
      :check-strictly="checkStrictly"
      @node-click="onTreeNode"
      @check="onCheckChange"
      @check-change="handleNodeClick"
    >
      <template #default="{ data }">
        <span
          :class="{
            'custom-tree-node': true,
            'custom-tree-highlight': currentNodeKey === data.id
          }"
        >
          <!-- <i :class="data.icon"> </i> -->
          <span>&nbsp; {{ data.label || data.name }}</span>
        </span>
      </template>
    </el-tree-v2>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import type { ElTreeV2 } from "element-plus";
import type { TreeNodeData } from "element-plus/es/components/tree/src/tree.type";

interface TreeNode extends TreeNodeData {
  label: string;
  value: string | any;
  name?: string;
  id?: string;
  assetsType?: any;
  disabled?: boolean;
  children?: TreeNode[];
  [key: string]: any; // 添加索引签名
}

interface Props {
  treedata: TreeNode[];
  defaultProps?: {
    children: string;
    label: string;
  };
  isLazy?: boolean;
  isCheckbox?: boolean;
  showCheckbox?: boolean;
  checkStrictly?: boolean;
  checkedKeys?: string | string[] | number[];
  nodeKey?: string;
  filterText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  defaultProps: () => ({
    children: "children",
    label: "label",
    value: "value"
  }),
  isLazy: false,
  isCheckbox: true,
  showCheckbox: false,
  checkStrictly: false,
  checkedKeys: () => [],
  nodeKey: "id",
  filterText: ""
});

const normalizedCheckedKeys = computed(() => {
  if (!props.checkedKeys) return [];
  if (Array.isArray(props.checkedKeys)) {
    return props.checkedKeys.map(String);
  }
  return [String(props.checkedKeys)];
});

interface CheckedData {
  checkedKeys: string[];
  checkedNodes: TreeNode[];
}

const emit = defineEmits<{
  (e: "fireOnTreeNode", payload: { item: TreeNode; node: any; dom: any }): void;
  (e: "fireOnCheckChange", payload: { data: TreeNode; checked: CheckedData }): void;
}>();

const treeRef = ref<InstanceType<typeof ElTreeV2>>();
const currentNode = ref<TreeNode | null>(null);
const isTreeShow = ref(true);

const currentNodeKey = computed(() => currentNode.value?.id ?? 0);

// 过滤后的树数据
const filteredTreeData = computed(() => {
  if (!props.filterText) return props.treedata;

  const filterValue = props.filterText.toLowerCase();

  const filterTreeNodes = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];

    for (const node of nodes) {
      const nodeLabel = (node.label || node.name || "").toLowerCase();
      const hasMatch = nodeLabel.indexOf(filterValue) !== -1;

      // 如果当前节点匹配，深拷贝整个节点返回
      if (hasMatch) {
        result.push({ ...node });
        continue;
      }

      // 如果有子节点，递归检查子节点
      if (node.children && node.children.length > 0) {
        const filteredChildren = filterTreeNodes(node.children);
        if (filteredChildren.length > 0) {
          // 深拷贝节点并更新其子节点（不修改原始数据）
          result.push({
            ...node,
            children: filteredChildren
          });
        }
      }
    }

    return result;
  };

  return filterTreeNodes(props.treedata);
});

const onTreeNode = (data: TreeNodeData, node: any, e: MouseEvent) => {
  const item = data as TreeNode;
  currentNode.value = item;
  emit("fireOnTreeNode", { item, node, dom: e });
};

const onCheckChange = (data: TreeNodeData, _checkedInfo: any) => {
  const checkedData = {
    checkedKeys: (treeRef.value?.getCheckedKeys() || []).map(String),
    checkedNodes: (treeRef.value?.getCheckedNodes() || []) as TreeNode[]
  };
  emit("fireOnCheckChange", { data: data as TreeNode, checked: checkedData });
};

const handleNodeClick = (data: TreeNodeData, checked: boolean) => {
  if (checked && !props.isCheckbox) {
    treeRef.value?.setCheckedKeys([String((data as TreeNode).id || (data as TreeNode).value)]);
  }
};

const onLoadNode = (node: any, resolve: (data: TreeNode[]) => void) => {
  resolve([]);
};
</script>

<style lang="scss">
@import "src/style/mixins/element.scss";

.source-tree {
  overflow: scroll;
  padding-bottom: 20px;
  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  .el-tree {
    background: transparent;
    font-size: 12px;
    .custom-tree-node {
      width: 100%;
      height: 100%;
      text-indent: 0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      &:hover,
      &:hover::before {
        color: #f0eaff;
        background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
      }
      &::before {
        content: "";
        height: 100%;
        width: 100px;
        pointer-events: none;
        position: absolute;
        top: 0;
        left: -100px;
        z-index: 0;
      }
      &.custom-tree-highlight,
      &.custom-tree-highlight::before {
        color: #f0eaff;
        background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
      }
    }
    .el-tree-node__content {
      height: 34px;
      line-height: 34px;
      text-indent: 0;
      .el-tree-node__expand-icon {
        z-index: 1;
      }
    }
    &.show-checkbox .el-tree-node {
      color: #b4b7c1 !important;
      background: transparent !important;
      .el-tree-node__content:hover {
        background-color: rgba(0, 0, 0, 0);
      }
      .custom-tree-node.custom-tree-highlight,
      .custom-tree-node.custom-tree-highlight::before {
        color: #f0eaff;
        background-image: none;
      }
    }
  }
  .el-tree-node__content:hover,
  .el-upload-list__item:hover {
    background-color: rgba(0, 0, 0, 0);
  }
  .el-tree-node__content > .el-tree-node__expand-icon {
    width: 12px;
    text-indent: 0;
  }
  .el-tree-node:focus > .el-tree-node__content,
  .el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content {
    background-color: rgba(0, 0, 0, 0);
  }
}
</style>
