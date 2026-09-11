<script setup lang="ts">
import type { NodeInfo } from "../../types";

defineProps<{
  imageNodes: NodeInfo[];
  filteredImageNodes: NodeInfo[];
  imageSearch: string;
  exporting: boolean;
  exportProgress: { current: number; total: number } | null;
  uploadingToMinio: boolean;
  minioProgress: { current: number; total: number } | null;
  simplifying: boolean;
  projectName: string;
  exportImages: () => void;
  exportImagesToMinio: () => void;
  simplifyNodeData: () => void;
}>();

const search = defineModel<string>("imageSearch", { required: true });
const name = defineModel<string>("projectName", { required: true });
</script>

<template>
  <div class="section">
    <div class="section-title">
      图片导出
      <span class="count">{{ filteredImageNodes.length }}/{{ imageNodes.length }} 个 -image 节点</span>
    </div>
    <div v-if="imageNodes.length === 0" class="empty">未找到 -image 节点</div>
    <template v-else>
      <input v-model="search" class="search-input" placeholder="搜索节点名称或 ID…" />
      <div v-if="filteredImageNodes.length === 0" class="empty">无匹配节点</div>
      <ul v-else class="node-list">
        <li v-for="node in filteredImageNodes" :key="node.id" class="node-item">
          <span class="node-type">{{ node.nodeType }}</span>
          <div class="match-info">
            <span class="node-name">{{ node.name }}</span>
            <span v-if="node.parentPath" class="match-sub">↳ {{ node.parentPath }}</span>
          </div>
        </li>
      </ul>
      <button
        class="select-btn"
        style="margin-top: 6px"
        :disabled="exporting || filteredImageNodes.length === 0"
        @click="exportImages"
      >
        <template v-if="exporting && exportProgress">
          导出中… {{ exportProgress.current }}/{{ exportProgress.total }}
        </template>
        <template v-else-if="exporting"> 导出中… </template>
        <template v-else> 导出为 ZIP </template>
      </button>
      <button
        class="select-btn"
        style="margin-top: 6px"
        :disabled="uploadingToMinio || filteredImageNodes.length === 0"
        @click="exportImagesToMinio"
      >
        <template v-if="uploadingToMinio && minioProgress">
          上传minio中… {{ minioProgress.current }}/{{ minioProgress.total }}
        </template>
        <template v-else-if="uploadingToMinio"> 上传中… </template>
        <template v-else> 上传minio </template>
      </button>
    </template>
  </div>

  <div class="section">
    <div class="section-title">节点数据简化</div>
    <button class="select-btn" :disabled="simplifying" @click="simplifyNodeData">
      <template v-if="simplifying">上传中…</template>
      <template v-else>上传节点数据</template>
    </button>
  </div>
</template>
