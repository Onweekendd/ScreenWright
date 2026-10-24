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

    <!-- 生图 / 生视频进行中：阶段 + 进度条 + 已等时间。进度是估的（服务商不给真实进度），所以不写成精确百分比 -->
    <div v-if="generationView" class="tool-call__progress" role="progressbar" :aria-valuenow="generationView.percent">
      <div class="tool-call__progress-text">
        <span>
          {{ generationView.stage
          }}<template v-if="generationView.count > 1"> · 共 {{ generationView.count }} 张</template>
        </span>
        <span v-if="generationView.elapsed">{{ generationView.elapsed }}</span>
      </div>
      <div class="tool-call__progress-track">
        <div class="tool-call__progress-bar" :style="{ width: `${generationView.percent}%` }" />
      </div>
    </div>

    <div v-if="generationFailure" class="tool-call__error">{{ generationFailure }}</div>

    <!-- 生图、截图、读图工具：结果里的 url 直接出图，不指望模型在文字回复里贴链接。
         用 el-image + preview-src-list，和 UserMessage 里用户携带图片的点击放大保持一致 -->
    <div
      v-if="imageSlots.length > 0"
      class="tool-call__images"
      :class="{ 'tool-call__images--multi': imageSlots.length > 1 }"
    >
      <template v-for="(slot, index) in imageSlots" :key="index">
        <el-image
          v-if="slot.kind === 'image'"
          :src="slot.url"
          :preview-src-list="previewUrls"
          :initial-index="previewUrls.indexOf(slot.url)"
          fit="cover"
          class="tool-call__image-thumb"
          preview-teleported
        />
        <!-- 还在生成：呼吸占位，一个位置对应一张图，一眼看出共要几张 -->
        <div v-else-if="slot.kind === 'pending'" class="tool-call__image-thumb tool-call__image-pending" />
        <div v-else class="tool-call__image-thumb tool-call__image-failed" :title="slot.error">生成失败</div>
      </template>
    </div>
    <div v-if="generatedVideos.length" class="tool-call__collected-assets">
      <MediaAttachmentPreview
        v-for="video in generatedVideos"
        :key="video.url"
        :media="video"
        :preview-media="generatedVideos"
      />
    </div>
    <div v-if="collectedAssets.length" class="tool-call__collected-assets">
      <MediaAttachmentPreview
        v-for="asset in collectedAssets"
        :key="asset.url"
        :media="asset"
        :preview-media="collectedAssets"
      />
    </div>
    <div v-if="collectionNote" class="tool-call__collection-note">{{ collectionNote }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, watch } from "vue";

import Icon from "@/components/Icon/index.vue";
import { markComponentEditing, unmarkComponentEditing } from "@/hooks/useEditingComponents";

import {
  imageSlotsOf,
  isGenerationRunning,
  requestedImageCount,
  resultUrlsOf,
  useGenerationProgress
} from "../hooks/useGenerationProgress";
import type { V5ToolPart } from "./AssistantMessage.vue";
import MediaAttachmentPreview from "./MediaAttachmentPreview.vue";

const props = defineProps<{
  part: V5ToolPart;
}>();

/** 需要在标题栏展示目标路径的高频工具（按注册对象 key 命名，兼容旧的 tool id 命名） */
const PATH_TOOLS = new Set(["readFileTool", "editFilesTool", "read_file", "edit_files"]);

/** 会真的改动组件文件的工具——只有这些调用期间才在画布上叠加扫光，只读工具不算 */
const EDIT_TOOLS = new Set(["editFilesTool", "edit_files"]);

/** 结果里带图片 url、需要直接出图预览的工具 */
const IMAGE_TOOLS = new Set(["createImageTool", "captureCanvasTool", "capture_canvas", "readFileTool", "read_file"]);

const toolName = computed(() => props.part.toolName ?? props.part.type.replace(/^tool-/, ""));

const isPathTool = computed(() => PATH_TOOLS.has(toolName.value));

const isError = computed(() => props.part.state === "output-error");

// 生图 / 生视频要等一两分钟：生成期间按 toolCallId 轮询后端进度，前台和后台执行共用这一套
const generating = computed(() => isGenerationRunning(toolName.value, props.part.state, props.part.output));
const { progress: generationProgress } = useGenerationProgress(() => props.part.toolCallId, generating);

/** 进度条的展示数据：还没查到进度时先显示「准备中」，不让卡片在等待的头几秒是空的 */
const generationView = computed(() => {
  if (!generating.value) {
    return null;
  }
  const data = generationProgress.value;
  const count = requestedImageCount(props.part.input);
  if (!data || data.status === "unknown") {
    // 查不到进度 = 这次调用还没开始执行：前台时同一步里的调用是排队一个个跑的，后面的要等前面的做完
    return { percent: 0, stage: "等待开始", elapsed: "", count };
  }
  // 完成 / 失败后收起进度条：完成的结果在下面出图，失败的原因在下面写出来
  if (data.status === "done" || data.status === "failed") {
    return null;
  }
  const elapsed = data.elapsedSec > 0 ? `已等 ${data.elapsedSec} 秒` : "";
  return { percent: data.percent, stage: data.stage, elapsed, count };
});

/** 后台生成失败时，卡片的结果不会变成错误（它停在占位文字上），失败原因从进度里取 */
const generationFailure = computed(() => {
  const data = generationProgress.value;
  return generating.value && data?.status === "failed" ? (data.error ?? "生成失败") : "";
});

/**
 * 工具结果只在 output-available 之后才可信；但生成类工具在前台串行执行时，卡片要等整步结束才变成
 * output-available，而图早就生成好了——此时用进度接口带回来的地址先出图，不让用户干等。
 */
const readyOutput = computed(() => (props.part.state === "output-available" ? props.part.output : undefined));

const collectionOutput = computed(() => {
  if (!["searchMediaAssetsTool", "importMediaAssetsTool"].includes(toolName.value)) {
    return undefined;
  }
  return readyOutput.value as
    | {
        assets?: Array<{ type?: string; url?: string; title?: string; contentType?: string }>;
        note?: string;
        errors?: string[];
      }
    | undefined;
});
const collectedAssets = computed(() =>
  (collectionOutput.value?.assets ?? []).flatMap((asset) =>
    typeof asset.url === "string" && (asset.type === "image" || asset.type === "video")
      ? [{ url: asset.url, filename: asset.title ?? "素材", mediaType: asset.contentType || `${asset.type}/*` }]
      : []
  )
);
const collectionNote = computed(() => collectionOutput.value?.note || collectionOutput.value?.errors?.join("\n") || "");

/** 图片区域：生成中每张一个呼吸占位，出图后换成图，没生成出来的标失败 */
const imageSlots = computed(() => {
  if (!IMAGE_TOOLS.has(toolName.value)) {
    return [];
  }
  return imageSlotsOf(
    readyOutput.value,
    generationProgress.value,
    requestedImageCount(props.part.input),
    generating.value
  );
});

/** 点开大图时在已出的图里左右翻 */
const previewUrls = computed(() => imageSlots.value.flatMap((slot) => (slot.kind === "image" ? [slot.url] : [])));

const generatedVideos = computed(() => {
  if (toolName.value !== "createVideoTool") {
    return [];
  }
  return resultUrlsOf(readyOutput.value, generationProgress.value).map((url, index) => ({
    url,
    filename: `生成视频 ${index + 1}`,
    mediaType: "video/mp4"
  }));
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
    if (!leaf) {
      continue;
    }
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

  &__images {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }

  &__collected-assets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 6px;
  }

  &__collection-note {
    margin-top: 6px;
    color: $color-text-secondary;
    font-size: 12px;
    white-space: pre-wrap;
  }

  &__image-thumb {
    display: block;
    width: 320px;
    height: 180px;
    border-radius: 6px;
    border: 1px solid $color-primary-20;
    cursor: zoom-in;
  }

  // 一次出多张时缩小，一排放得下两张，别让六张图把对话撑得很长
  &__images--multi &__image-thumb {
    width: 156px;
    height: 88px;
  }

  &__image-pending {
    cursor: default;
    background: $color-primary-20;
    animation: tool-call-breathe 1.8s ease-in-out infinite;
  }

  &__image-failed {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: default;
    color: #f56c6c;
    font-size: 12px;
    border-style: dashed;
    border-color: #f56c6c;
  }

  @keyframes tool-call-breathe {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 0.7;
    }
  }

  &__progress {
    margin-top: 6px;
    width: 320px;
  }

  &__progress-text {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 12px;
    color: $color-text-dim;
  }

  &__progress-track {
    height: 4px;
    overflow: hidden;
    border-radius: 999px;
    background: $color-primary-18;
  }

  &__progress-bar {
    height: 100%;
    border-radius: inherit;
    background: $color-primary;
    transition: width 0.6s ease;
  }
}
</style>
