<script setup lang="ts">
import { ref, watch, onMounted } from "vue";

declare const __APP_VERSION__: string;
const appVersion = __APP_VERSION__;
import { usePluginBridge } from "./hooks/usePluginBridge";
import { useToast } from "./hooks/useToast";
import { useSelection } from "./hooks/useSelection";
import { useNamingSuffix } from "./hooks/useNamingSuffix";
import { useMergeAnalysis } from "./hooks/useMergeAnalysis";
import { useNamingValidation } from "./hooks/useNamingValidation";
import { useStructureTree } from "./hooks/useStructureTree";
import { useImageExport } from "./hooks/useImageExport";
import TabNaming from "./components/TabNaming.vue";
import TabMerge from "./components/TabMerge.vue";
import TabStructure from "./components/TabStructure.vue";
import TabExport from "./components/TabExport.vue";
import TabTemplate from "./components/TabTemplate.vue";

const { postMessage, onMessage, init } = usePluginBridge();
const { toast, showToast } = useToast();
const { selectedNodes, singleSelected, isRootNode } = useSelection(onMessage);

const { mode, SUFFIXES, applySuffix, autoNameStructure } = useNamingSuffix(postMessage, selectedNodes, showToast);
const { namingIssues, namingIssueSearch, filteredNamingIssues } = useNamingValidation(onMessage);
const { mergeSourceInfo, panelMatches, syncingIds, analyzeMerge, selectNode, selectAllMatched, syncNodeName } =
  useMergeAnalysis(postMessage, onMessage, selectedNodes, showToast);
const { structureTree, expandedNodeIds, toggleExpand, expandAll, collapseAll } = useStructureTree(onMessage);
const {
  imageNodes,
  imageSearch,
  filteredImageNodes,
  exporting,
  exportProgress,
  uploadingToMinio,
  minioProgress,
  simplifying,
  projectName,
  exportImages,
  exportImagesToMinio,
  simplifyNodeData
} = useImageExport(postMessage, onMessage, selectedNodes, isRootNode, showToast);

// Global message handler
onMessage((msg) => {
  if (msg.type === "applyResult") {
    showToast(`已更新 ${msg.count} 个节点`);
  }
  if (msg.type === "autoNameResult") {
    showToast(`已规范 ${msg.count} 个节点`);
  }
});

// Auto-scan on single selection
watch(
  () => selectedNodes.value,
  (nodes) => {
    if (nodes.length === 1) {
      analyzeMerge();
      postMessage({ type: "scanImageNodes", nodeId: nodes[0].id });
      postMessage({ type: "scanNamingIssues", nodeId: nodes[0].id });
      postMessage({ type: "scanStructureTree", nodeId: nodes[0].id });
    }
  },
  { flush: "sync" }
);

function createSubtabTemplate() {
  postMessage({ type: "createSubtabTemplate" });
}

// Tab state
const activeTab = ref<"naming" | "merge" | "structure" | "export" | "template">("naming");
const tabs = [
  { key: "naming" as const, label: "命名" },
  { key: "merge" as const, label: "合并" },
  { key: "structure" as const, label: "结构" },
  { key: "export" as const, label: "导出" },
  { key: "template" as const, label: "模板" }
];

function selectNodes(ids: string[]) {
  postMessage({ type: "selectNodes", nodeIds: ids });
}

onMounted(() => init());
</script>

<template>
  <div class="container">
    <div class="plugin-header">
      <span class="plugin-title">Screenwright 规范助手</span>
      <span class="plugin-version">v{{ appVersion }}</span>
    </div>

    <!-- Always-visible selection header -->
    <div class="section">
      <div class="section-title">
        当前选中
        <span class="count">{{ selectedNodes.length }} 个节点</span>
      </div>
      <div v-if="selectedNodes.length === 0" class="empty">未选中任何节点</div>
      <ul v-else class="node-list">
        <li v-for="node in selectedNodes" :key="node.id" class="node-item">
          <span class="node-type">{{ node.nodeType }}</span>
          <span class="node-name">{{ node.name }}</span>
          <span class="node-id">{{ node.id }}</span>
        </li>
      </ul>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-btn', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab content -->
    <TabNaming
      v-if="selectedNodes.length > 0 && activeTab === 'naming'"
      :selected-nodes="selectedNodes"
      v-model:mode="mode"
      :suffixes="SUFFIXES"
      :naming-issues="namingIssues"
      v-model:naming-issue-search="namingIssueSearch"
      :filtered-naming-issues="filteredNamingIssues"
      :apply-suffix="applySuffix"
      :auto-name-structure="autoNameStructure"
      :select-nodes="selectNodes"
    />
    <TabMerge
      v-if="singleSelected && activeTab === 'merge'"
      :selected-nodes="selectedNodes"
      :merge-source-info="mergeSourceInfo"
      :panel-matches="panelMatches"
      :syncing-ids="syncingIds"
      :select-node="selectNode"
      :select-all-matched="selectAllMatched"
      :sync-node-name="syncNodeName"
    />
    <TabStructure
      v-if="singleSelected && activeTab === 'structure'"
      :structure-tree="structureTree"
      :expanded-node-ids="expandedNodeIds"
      :toggle-expand="toggleExpand"
      :expand-all="expandAll"
      :collapse-all="collapseAll"
      :select-nodes="selectNodes"
    />
    <TabExport
      v-if="singleSelected && activeTab === 'export'"
      :image-nodes="imageNodes"
      v-model:image-search="imageSearch"
      :filtered-image-nodes="filteredImageNodes"
      :exporting="exporting"
      :export-progress="exportProgress"
      :uploading-to-minio="uploadingToMinio"
      :minio-progress="minioProgress"
      :simplifying="simplifying"
      v-model:project-name="projectName"
      :export-images="exportImages"
      :export-images-to-minio="exportImagesToMinio"
      :simplify-node-data="simplifyNodeData"
    />

    <TabTemplate v-if="activeTab === 'template'" :create-subtab-template="createSubtabTemplate" />

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>
