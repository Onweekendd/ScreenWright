import { ref, type Ref } from "vue";
import type { PluginMessage, NodeInfo, MergeSourceInfo, PanelMatchInfo, UIMessage } from "../../types";

export function useMergeAnalysis(
  postMessage: (msg: PluginMessage) => void,
  onMessage: (handler: (msg: UIMessage) => void) => () => void,
  selectedNodes: Ref<NodeInfo[]>,
  showToast: (msg: string) => void
) {
  const mergeSourceInfo = ref<MergeSourceInfo | null | undefined>(undefined);
  const panelMatches = ref<PanelMatchInfo[] | null>(null);
  const analyzing = ref(false);
  const syncingIds = ref<Set<string>>(new Set());

  function analyzeMerge() {
    if (selectedNodes.value.length !== 1) return;
    analyzing.value = true;
    mergeSourceInfo.value = undefined;
    panelMatches.value = null;
    postMessage({ type: "analyzePanelMerge", nodeId: selectedNodes.value[0].id });
  }

  function selectNode(nodeId: string) {
    postMessage({ type: "selectNodes", nodeIds: [nodeId] });
  }

  function selectAllMatched() {
    if (!panelMatches.value) return;
    const matchedIds = panelMatches.value
      .filter((m) => m.matchedNodeId !== null)
      .map((m) => m.matchedNodeId as string);
    const ids = [selectedNodes.value[0].id, ...matchedIds];
    postMessage({ type: "selectNodes", nodeIds: ids });
  }

  function syncNodeName(nodeId: string) {
    if (!selectedNodes.value[0]) return;
    syncingIds.value = new Set([...syncingIds.value, nodeId]);
    postMessage({
      type: "syncNodeName",
      nodeId,
      newName: selectedNodes.value[0].name
    });
  }

  onMessage((msg) => {
    if (msg.type === "selectionChange") {
      mergeSourceInfo.value = undefined;
      panelMatches.value = null;
      analyzing.value = false;
      syncingIds.value = new Set();
    }
    if (msg.type === "panelMergeResult") {
      mergeSourceInfo.value = msg.sourceInfo;
      panelMatches.value = msg.matches;
      analyzing.value = false;
    }
    if (msg.type === "syncResult") {
      if (panelMatches.value) {
        panelMatches.value = panelMatches.value.map((m) =>
          m.matchedNodeId === msg.nodeId
            ? { ...m, status: "confirmed" as const, matchedNodeName: msg.newName }
            : m
        );
      }
      syncingIds.value = new Set([...syncingIds.value].filter((id) => id !== msg.nodeId));
      showToast(`已同步为：${msg.newName}`);
    }
  });

  return {
    mergeSourceInfo,
    panelMatches,
    analyzing,
    syncingIds,
    analyzeMerge,
    selectNode,
    selectAllMatched,
    syncNodeName
  };
}
