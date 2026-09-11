<template>
  <div class="tool-call">
    <div class="tool-call__header">
      <Icon type="iconfont-gongjv" class="tool-call__icon" />
      <span class="tool-call__name">{{ toolName }}</span>
      <!-- 高频工具（读取/编辑文件）：紧跟工具名展示目标组件路径（name/name 形式） -->
      <span v-if="pathText" class="tool-call__path" :title="rawPath">{{ pathText }}</span>
    </div>

    <!-- 状态由时间线圆点指示，不再展示徽标；入参/结果已隐藏，仅失败时保留错误信息 -->
    <div v-if="isError" class="tool-call__error">{{ errorMessage }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import Icon from "@/components/Icon/index.vue";

import type { V5ToolPart } from "./AssistantMessage.vue";

const props = defineProps<{
  part: V5ToolPart;
}>();

/** 需要在标题栏展示目标路径的高频工具（按注册对象 key 命名，兼容旧的 tool id 命名） */
const PATH_TOOLS = new Set(["readFileTool", "editFilesTool", "read_file", "edit_files"]);

const toolName = computed(() => props.part.toolName ?? props.part.type.replace(/^tool-/, ""));

const isPathTool = computed(() => PATH_TOOLS.has(toolName.value));

const isError = computed(() => props.part.state === "output-error");

const errorMessage = computed(() => {
  const raw = props.part.errorText ?? "";
  if (!raw) {
    return String(props.part.output ?? "未知错误");
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed.message ?? raw;
  } catch {
    return raw;
  }
});

const rawPaths = computed(() => {
  if (!isPathTool.value) {
    return [];
  }
  const input = props.part.input as { path?: string; files?: Array<{ path?: string }> } | undefined;
  if (typeof input?.path === "string") {
    return [input.path];
  }
  return input?.files?.flatMap((file) => (typeof file.path === "string" ? [file.path] : [])) ?? [];
});

const rawPath = computed(() => rawPaths.value.join("\n"));

/**
 * 将 workspace 相对路径（形如 `screen_123/component/456_柱状图_bar.json`）压缩为 `name/name`。
 * 文件名/目录名遵循 `{id}_{name}_{prop}` 约定，这里仅保留数字 id 打头的组件段并取其 name 部分。
 * 非组件段（screen_xxx / component 等）跳过；若无任何组件段则回退展示原始路径。
 */
const formatComponentPath = (raw: string): string => {
  const names: string[] = [];
  for (const seg of raw.split(/[\\/]/).filter(Boolean)) {
    const noExt = seg.replace(/\.(json|vue|js|md|ts)$/i, "");
    const parts = noExt.split("_");
    if (!/^\d+$/.test(parts[0])) {
      continue;
    }
    if (parts.length >= 3) {
      // {id}_{name}_{prop} → name（name 自身可能含下划线，取首段 id 与末段 prop 之间的部分）
      names.push(parts.slice(1, -1).join("_"));
    } else if (parts.length === 2) {
      names.push(parts[1]);
    } else {
      names.push(parts[0]);
    }
  }
  return names.length ? names.join("/") : raw;
};

const pathText = computed(() => {
  const [firstPath, ...remainingPaths] = rawPaths.value;
  if (!firstPath) {
    return "";
  }
  const firstLabel = formatComponentPath(firstPath);
  return remainingPaths.length > 0 ? `${firstLabel} +${remainingPaths.length}` : firstLabel;
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.tool-call {
  font-size: 13px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: start;
    min-width: 0;
    user-select: none;
  }

  &__icon {
    font-size: 12px;
    color: $color-text-dim;
    flex-shrink: 0;
  }

  &__name {
    margin-right: 6px;
    white-space: nowrap;
    flex-shrink: 0;
    color: $color-text-secondary;
  }

  &__path {
    min-width: 0;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: $color-text-dim;
    font-family: $font-monospace;
  }

  &__error {
    margin-top: 4px;
    color: #f56c6c;
    font-size: 12px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
