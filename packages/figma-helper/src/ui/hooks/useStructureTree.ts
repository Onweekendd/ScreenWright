import { ref } from "vue";
import type { StructureTreeNode, UIMessage } from "../../types";

export function useStructureTree(
  onMessage: (handler: (msg: UIMessage) => void) => () => void
) {
  const structureTree = ref<StructureTreeNode | null>(null);
  const expandedNodeIds = ref<Set<string>>(new Set());

  function toggleExpand(id: string) {
    const next = new Set(expandedNodeIds.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedNodeIds.value = next;
  }

  function expandAll(node: StructureTreeNode | null) {
    if (!node) return;
    const ids = new Set<string>();
    const walk = (n: StructureTreeNode) => {
      if (n.children.length > 0) ids.add(n.id);
      n.children.forEach(walk);
    };
    walk(node);
    expandedNodeIds.value = ids;
  }

  function collapseAll() {
    expandedNodeIds.value = new Set();
  }

  onMessage((msg) => {
    if (msg.type === "selectionChange") {
      structureTree.value = null;
      expandedNodeIds.value = new Set();
    }
    if (msg.type === "scanStructureTreeResult") {
      structureTree.value = msg.tree;
      if (msg.tree) expandAll(msg.tree);
    }
  });

  return { structureTree, expandedNodeIds, toggleExpand, expandAll, collapseAll };
}
