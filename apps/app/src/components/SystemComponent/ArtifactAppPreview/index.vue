<script setup lang="ts">
import { computed, shallowRef, watch } from "vue";

import type { ArtifactAppPreviewOption, ComponentType, PanelEnum } from "@screenwright/types";

import { useBaseData } from "@/hooks/useBaseData";

import { resolveArtifactPreviewUrl } from "./preview-url";

const FUNAI_BASE_URL = import.meta.env.VITE_FUNAI_API_URL || "http://localhost:4111";

const props = defineProps<{
  element: ComponentType<PanelEnum.artifactAppPreview, ArtifactAppPreviewOption>;
}>();

defineOptions({ name: "ArtifactAppPreview" });

const { isBuild, option } = useBaseData<PanelEnum.artifactAppPreview, ArtifactAppPreviewOption>(props.element);
const isLoading = shallowRef(true);

const previewUrl = computed(() =>
  resolveArtifactPreviewUrl({
    appId: option.value.appId,
    ScreenwrightBaseUrl: FUNAI_BASE_URL,
    previewMode: option.value.previewMode
  })
);
const interactionEnabled = computed(() => option.value.allowInteraction && !isBuild.value);
const statusText = computed(() => {
  if (!previewUrl.value) {
    if (!option.value.appId) {
      return "请选择 Artifact 应用";
    }
    return option.value.previewMode === "published" ? "发布预览尚未可用" : "开发预览地址无效";
  }
  if (isLoading.value) {
    return "正在加载应用";
  }
  return option.value.previewMode === "development" ? "开发预览" : "发布预览";
});

watch(previewUrl, (url) => (isLoading.value = Boolean(url)), { immediate: true });

function handleLoaded(): void {
  isLoading.value = false;
}
</script>

<template>
  <div class="artifact-app-preview">
    <iframe
      v-if="previewUrl"
      class="artifact-app-preview__frame"
      :class="{ 'artifact-app-preview__frame--interactive': interactionEnabled }"
      :src="previewUrl"
      :title="element.name || 'Artifact 应用预览'"
      allow="clipboard-read; clipboard-write; fullscreen"
      referrerpolicy="no-referrer"
      sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"
      @load="handleLoaded"
    />

    <div v-else class="artifact-app-preview__empty">
      <span class="artifact-app-preview__empty-title">Artifact App</span>
      <span class="artifact-app-preview__empty-description">{{ statusText }}</span>
    </div>

    <div v-if="option.showStatus" class="artifact-app-preview__status">
      <span class="artifact-app-preview__status-dot" :class="{ 'is-ready': previewUrl && !isLoading }" />
      <span>{{ statusText }}</span>
      <span v-if="option.appId" class="artifact-app-preview__app-id">{{ option.appId }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.artifact-app-preview {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0f1117;
  color: #d7d9e0;
}

.artifact-app-preview__frame {
  width: 100%;
  height: 100%;
  border: 0;
  pointer-events: none;
  background: #fff;
}

.artifact-app-preview__frame--interactive {
  pointer-events: auto;
}

.artifact-app-preview__empty {
  display: flex;
  width: 100%;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: radial-gradient(
      circle at 50% 20%,
      color-mix(in srgb, var(--sw-theme-color) 18%, transparent),
      transparent 45%
    ),
    #0f1117;
}

.artifact-app-preview__empty-title {
  font-size: 18px;
  font-weight: 600;
}

.artifact-app-preview__empty-description,
.artifact-app-preview__status {
  font-size: 12px;
  color: #9da1ad;
}

.artifact-app-preview__status {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  max-width: calc(100% - 16px);
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 6px;
  background: rgb(15 17 23 / 82%);
  backdrop-filter: blur(8px);
  pointer-events: none;
}

.artifact-app-preview__status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f5a524;
}

.artifact-app-preview__status-dot.is-ready {
  background: #45d483;
}

.artifact-app-preview__app-id {
  overflow: hidden;
  color: #d7d9e0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
