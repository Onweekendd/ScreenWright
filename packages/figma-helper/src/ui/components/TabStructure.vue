<script setup lang="ts">
import type { StructureTreeNode } from "../../types";
import TreeNode from "./TreeNode.vue";

defineProps<{
  structureTree: StructureTreeNode | null;
  expandedNodeIds: Set<string>;
  toggleExpand: (id: string) => void;
  expandAll: (node: StructureTreeNode | null) => void;
  collapseAll: () => void;
  selectNodes: (ids: string[]) => void;
}>();
</script>

<template>
  <div class="section">
    <div class="section-title">
      扁平化结构预览
      <span v-if="structureTree" class="section-actions">
        <button class="inline-btn" @click="expandAll(structureTree)">全展开</button>
        <button class="inline-btn" @click="collapseAll">全收起</button>
      </span>
    </div>
    <div v-if="!structureTree" class="empty">未找到可析构的节点</div>
    <div v-else class="tree-root">
      <TreeNode
        :node="structureTree"
        :expanded-ids="expandedNodeIds"
        :depth="0"
        @toggle="toggleExpand"
        @select="(id: string) => selectNodes([id])"
      />
    </div>
  </div>
</template>
