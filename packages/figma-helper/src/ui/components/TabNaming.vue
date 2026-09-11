<script setup lang="ts">
import { computed } from "vue";
import type { NodeInfo, NamingIssueItem, PluginMessage } from "../../types";
import type { Mode } from "../hooks/useNamingSuffix";
import type { Ref } from "vue";

const props = defineProps<{
  selectedNodes: NodeInfo[];
  mode: Mode;
  suffixes: { label: string; desc: string }[];
  namingIssues: NamingIssueItem[];
  namingIssueSearch: string;
  filteredNamingIssues: NamingIssueItem[];
  applySuffix: (suffix: string) => void;
  autoNameStructure: () => void;
  selectNodes: (ids: string[]) => void;
}>();

// 一键规范命名仅在选中单个顶层文件帧（父节点为 PAGE 的 FRAME）时可用
const canAutoName = computed(() => {
  if (props.selectedNodes.length !== 1) return false;
  const node = props.selectedNodes[0];
  return node.nodeType === "FRAME" && node.isTopLevel === true;
});

defineEmits<{
  "update:mode": [value: Mode];
  "update:namingIssueSearch": [value: string];
}>();

const modelMode = defineModel<Mode>("mode", { required: true });
const search = defineModel<string>("namingIssueSearch", { required: true });
</script>

<template>
  <div class="section">
    <div class="section-title">一键规范</div>
    <button class="auto-name-btn" :disabled="!canAutoName" @click="autoNameStructure">一键规范命名</button>
    <div class="auto-name-hint">
      {{ canAutoName ? "将从顶层文件帧递归自动打后缀" : "请选中单个顶层文件帧（父级为页面的 FRAME）" }}
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      命名后缀
      <span v-if="selectedNodes.length > 1" class="count">将把 {{ selectedNodes.length }} 个节点包裹成组</span>
    </div>
    <div class="suffix-grid">
      <button
        v-for="item in suffixes"
        :key="item.label"
        class="suffix-btn"
        :title="item.desc"
        @click="applySuffix(item.label)"
      >
        {{ item.label }}
      </button>
    </div>
  </div>

  <div v-if="selectedNodes.length === 1" class="section mode-section">
    <div class="section-title">模式</div>
    <div class="mode-toggle">
      <label>
        <input v-model="modelMode" type="radio" value="replace" />
        替换已有规范后缀
      </label>
      <label>
        <input v-model="modelMode" type="radio" value="append" />
        追加到末尾
      </label>
    </div>
  </div>

  <div v-if="selectedNodes.length === 1" class="section">
    <div class="section-title">
      命名规范检查
      <span class="count">{{ filteredNamingIssues.length }}/{{ namingIssues.length }} 个问题</span>
    </div>
    <div v-if="namingIssues.length === 0" class="empty">未发现命名问题</div>
    <template v-else>
      <input v-model="search" class="search-input" placeholder="搜索节点名称…" />
      <div v-if="filteredNamingIssues.length === 0" class="empty">无匹配节点</div>
      <ul v-else class="node-list">
        <li
          v-for="issue in filteredNamingIssues"
          :key="issue.childId"
          class="node-item node-item-clickable"
          :title="`父节点：${issue.parentName}`"
          @click="selectNodes([issue.childId])"
        >
          <span class="node-type">{{ issue.childNodeType }}</span>
          <div class="match-info">
            <span class="node-name">{{ issue.childName }}</span>
            <span class="match-sub match-warn-text">↳ {{ issue.parentName }}</span>
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>
