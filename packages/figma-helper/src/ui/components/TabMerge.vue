<script setup lang="ts">
import type { NodeInfo, MergeSourceInfo, PanelMatchInfo } from "../../types";

defineProps<{
  selectedNodes: NodeInfo[];
  mergeSourceInfo: MergeSourceInfo | null | undefined;
  panelMatches: PanelMatchInfo[] | null;
  syncingIds: Set<string>;
  selectNode: (nodeId: string) => void;
  selectAllMatched: () => void;
  syncNodeName: (nodeId: string) => void;
}>();
</script>

<template>
  <div class="section">
    <div class="section-title">
      {{ mergeSourceInfo && mergeSourceInfo.mode === "status" ? "同面板状态识别" : "-MERGE 合并识别" }}
    </div>

    <div v-if="mergeSourceInfo === null" class="empty" style="margin-top: 8px">
      该节点不在任何 -merge frame 中
    </div>

    <template v-else-if="mergeSourceInfo !== undefined && panelMatches !== null">
      <div class="merge-source">
        <span class="source-label">所在帧</span>
        <span class="node-name">{{ mergeSourceInfo.mergeFrameName }}</span>
      </div>
      <div v-if="!mergeSourceInfo.isMergeFrame" class="merge-path">
        路径：{{ mergeSourceInfo.path.join(" › ") || "（根节点）" }}
      </div>

      <div v-if="panelMatches.length === 0" class="empty" style="margin-top: 6px">
        父级下无其他 -merge frame
      </div>
      <template v-else>
        <ul class="node-list" style="margin-top: 6px">
          <li
            v-for="match in panelMatches"
            :key="match.mergeFrameId"
            class="node-item"
            :class="{ 'node-item-clickable': match.matchedNodeId && mergeSourceInfo.isMergeFrame }"
            @click="match.matchedNodeId && mergeSourceInfo.isMergeFrame && selectNode(match.matchedNodeId)"
          >
            <template v-if="mergeSourceInfo.isMergeFrame">
              <span class="match-badge match-ok">✓</span>
              <span class="node-name">{{ match.mergeFrameName }}</span>
            </template>

            <template v-else>
              <span
                :class="[
                  'match-badge',
                  match.status === 'confirmed'
                    ? 'match-ok'
                    : match.status === 'suspected'
                      ? 'match-warn'
                      : 'match-miss'
                ]"
              >
                {{ match.status === "confirmed" ? "✓" : match.status === "suspected" ? "~" : "✗" }}
              </span>
              <div
                class="match-info"
                :class="{ 'node-item-clickable': match.matchedNodeId }"
                @click.stop="match.matchedNodeId && selectNode(match.matchedNodeId)"
              >
                <span class="node-name">{{ match.mergeFrameName }}</span>
                <span v-if="match.status === 'confirmed'" class="match-sub">
                  {{ match.matchedNodeName }}
                </span>
                <span v-else-if="match.status === 'suspected'" class="match-sub match-warn-text">
                  疑似：{{ match.matchedNodeName }}
                </span>
                <span v-else class="match-sub match-miss-text">未找到对应节点</span>
              </div>
              <button
                v-if="match.status === 'suspected' && match.matchedNodeId"
                class="sync-btn"
                :disabled="syncingIds.has(match.matchedNodeId)"
                :title="`重命名为：${selectedNodes[0]?.name}`"
                @click.stop="syncNodeName(match.matchedNodeId)"
              >
                {{ syncingIds.has(match.matchedNodeId) ? "…" : "同步" }}
              </button>
            </template>
          </li>
        </ul>
        <button
          v-if="panelMatches.some((m) => m.matchedNodeId)"
          class="select-btn"
          style="margin-top: 6px"
          @click="selectAllMatched"
        >
          全部选中（含当前）
        </button>
      </template>
    </template>
  </div>
</template>
