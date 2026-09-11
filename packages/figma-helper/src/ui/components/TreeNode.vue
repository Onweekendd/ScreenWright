<script setup lang="ts">
import type { StructureTreeNode } from "../../types";

const props = defineProps<{
  node: StructureTreeNode;
  expandedIds: Set<string>;
  depth: number;
}>();

const emit = defineEmits<{
  toggle: [id: string];
  select: [id: string];
}>();

const STATE_COLORS = ["#4a9eff", "#ff7c56", "#56c99a", "#f5a623", "#b07ef8", "#f4736e"];

function stateColor(stateIndex: number): string {
  return stateIndex === -1 ? "#999" : STATE_COLORS[stateIndex % STATE_COLORS.length];
}
</script>

<template>
  <div class="tree-node">
    <div
      class="tree-row"
      :style="{ paddingLeft: `${depth * 12 + 4}px` }"
      @click="emit('select', node.id)"
    >
      <span
        v-if="node.children.length > 0"
        class="tree-toggle"
        @click.stop="emit('toggle', node.id)"
      >
        {{ expandedIds.has(node.id) ? "▾" : "▸" }}
      </span>
      <span v-else class="tree-toggle tree-toggle-leaf">•</span>
      <span class="tree-reason" :style="{ color: stateColor(node.stateIndex) }">
        {{ node.reason }}
      </span>
      <span class="tree-name">{{ node.name || `(${node.nodeType})` }}</span>
    </div>
    <div v-if="node.children.length > 0 && expandedIds.has(node.id)" class="tree-children">
      <TreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :expanded-ids="expandedIds"
        :depth="depth + 1"
        @toggle="(id: string) => emit('toggle', id)"
        @select="(id: string) => emit('select', id)"
      />
    </div>
  </div>
</template>
