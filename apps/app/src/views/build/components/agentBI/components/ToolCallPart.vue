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

    <!-- 生图工具：结果里的 url 直接出图，不指望模型在文字回复里贴链接。
         用 el-image + preview-src-list，和 UserMessage 里用户携带图片的点击放大保持一致 -->
    <div v-if="imageUrl" class="tool-call__image">
      <el-image
        :src="imageUrl"
        :preview-src-list="[imageUrl]"
        fit="cover"
        class="tool-call__image-thumb"
        preview-teleported
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";

import Icon from "@/components/Icon/index.vue";
import { markComponentEditing, unmarkComponentEditing } from "@/hooks/useEditingComponents";

import type { V5ToolPart } from "./AssistantMessage.vue";

const props = defineProps<{
  part: V5ToolPart;
}>();

/** 需要在标题栏展示目标路径的高频工具（按注册对象 key 命名，兼容旧的 tool id 命名） */
const PATH_TOOLS = new Set(["readFileTool", "editFilesTool", "read_file", "edit_files"]);

/** 会真的改动组件文件的工具——只有这些调用期间才在画布上叠加扫光，只读工具不算 */
const EDIT_TOOLS = new Set(["editFilesTool", "edit_files"]);

/** 结果里带图片 url、需要直接出图预览的工具 */
const IMAGE_TOOLS = new Set(["createImageTool"]);

const toolName = computed(() => props.part.toolName ?? props.part.type.replace(/^tool-/, ""));

const isPathTool = computed(() => PATH_TOOLS.has(toolName.value));

const isError = computed(() => props.part.state === "output-error");

const imageUrl = computed(() => {
  if (!IMAGE_TOOLS.has(toolName.value) || props.part.state !== "output-available") {
    return "";
  }
  const output = props.part.output as { url?: string } | undefined;
  return typeof output?.url === "string" ? output.url : "";
});

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
 * 从 workspace 相对路径里抠出被编辑的组件 id（`{id}_{name}_{prop}.json` 约定的首段）。
 * 只取路径最后一段（真正被改的文件），不取中间目录段——分组/动态面板的路径形如
 * `.../{groupId}_{groupName}/{id}_{name}.json`，中间目录段也是"数字开头"，
 * 若不加区分会把父级分组一起标记成 editing，导致分组外框也跟着叠一层扫光。
 */
const extractComponentIds = (paths: string[]): string[] => {
  const ids: string[] = [];
  for (const raw of paths) {
    const segs = raw.split(/[\\/]/).filter(Boolean);
    const leaf = segs[segs.length - 1];
    if (!leaf) continue;
    const id = leaf.split("_")[0];
    if (/^\d+$/.test(id)) {
      ids.push(id);
    }
  }
  return ids;
};

/**
 * edit_files 执行期间在画布上给目标组件叠加扫光效果，让用户看到"agent 正在改这个组件"。
 * 记着这一轮实际标记过的 id，而不是每次都重新从 rawPaths 派生——一是 input 在流式阶段
 * 可能还不完整，二是组件卸载时的兜底清理需要知道"我到底标记了什么"，不能假设 props 还在。
 */
let markedComponentIds: string[] = [];

watch(
  () => props.part.state,
  (state) => {
    if (!EDIT_TOOLS.has(toolName.value)) {
      return;
    }
    if (state === "input-available") {
      markedComponentIds = extractComponentIds(rawPaths.value);
      markedComponentIds.forEach(markComponentEditing);
    } else if (state === "output-available" || state === "output-error") {
      markedComponentIds.forEach(unmarkComponentEditing);
      markedComponentIds = [];
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  markedComponentIds.forEach(unmarkComponentEditing);
  markedComponentIds = [];
});

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

  &__image {
    margin-top: 6px;
  }

  &__image-thumb {
    display: block;
    width: 320px;
    height: 180px;
    border-radius: 6px;
    border: 1px solid $color-primary-20;
    cursor: zoom-in;
  }
}
</style>
