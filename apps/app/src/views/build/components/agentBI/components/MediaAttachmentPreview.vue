<template>
  <div class="media-preview">
    <button
      v-if="isVideo"
      type="button"
      class="thumb-video-button"
      :title="media.filename"
      :aria-label="`预览视频：${media.filename}`"
      @click="openPreview"
    >
      <video
        :src="media.url"
        class="thumb-video"
        preload="metadata"
        muted
        playsinline
        @loadedmetadata="rememberVideoSize"
      />
      <span class="thumb-play" aria-hidden="true"><Icon type="VideoPlay" :size="24" /></span>
    </button>
    <el-image
      v-else
      :src="media.url"
      :alt="media.filename"
      :title="media.filename"
      fit="cover"
      class="thumb-img"
      role="button"
      tabindex="0"
      :aria-label="`预览图片：${media.filename}`"
      @click="openPreview"
      @keydown.enter.prevent="openPreview"
      @keydown.space.prevent="openPreview"
    />
    <el-dialog
      v-if="previewVisible"
      v-model="previewVisible"
      :title="activeMedia.filename || '素材预览'"
      :width="dialogWidth"
      class="media-gallery-dialog"
      modal-class="sw-dialog build-render-ignore"
      append-to-body
      align-center
      destroy-on-close
    >
      <div class="media-gallery-stage">
        <video
          v-if="activeMedia.mediaType.startsWith('video/')"
          :key="activeMedia.url"
          :src="activeMedia.url"
          class="attachment-video-preview"
          controls
          preload="metadata"
          muted
          playsinline
          @loadedmetadata="rememberVideoSize"
        />
        <img
          v-else
          :key="`image-${activeMedia.url}`"
          :src="activeMedia.url"
          :alt="activeMedia.filename"
          class="attachment-image-preview"
          @load="rememberImageSize"
        />
      </div>
      <div v-if="gallery.length > 1" class="media-gallery-navigation">
        <button type="button" aria-label="上一个素材" @click="move(-1)">‹</button>
        <span aria-live="polite">{{ activeIndex + 1 }} / {{ gallery.length }}</span>
        <button type="button" aria-label="下一个素材" @click="move(1)">›</button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";

import Icon from "@/components/Icon/index.vue";

import type { MediaAttachment } from "../hooks/attachmentMedia";

const props = defineProps<{ media: MediaAttachment; previewMedia?: MediaAttachment[] }>();
const isVideo = computed(() => props.media.mediaType.startsWith("video/"));
const gallery = computed(() => (props.previewMedia?.length ? props.previewMedia : [props.media]));
const previewVisible = ref(false);
const activeIndex = ref(0);
const activeMedia = computed(() => gallery.value[activeIndex.value] ?? props.media);
const aspectRatios = ref<Record<string, number>>({});
// 弹窗跟随媒体本身的比例，竖屏视频不再被撑进宽屏播放器中。
const dialogWidth = computed(() => {
  const ratio =
    aspectRatios.value[activeMedia.value.url] ?? (activeMedia.value.mediaType.startsWith("video/") ? 9 / 16 : 4 / 3);
  return `min(880px, 92vw, calc(68vh * ${ratio} + 40px))`;
});
const rememberVideoSize = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  if (video.videoWidth && video.videoHeight) {
    aspectRatios.value[video.getAttribute("src") ?? ""] = video.videoWidth / video.videoHeight;
  }
};
const rememberImageSize = (event: Event) => {
  const image = event.target as HTMLImageElement;
  if (image.naturalWidth && image.naturalHeight) {
    aspectRatios.value[image.getAttribute("src") ?? ""] = image.naturalWidth / image.naturalHeight;
  }
};
const openPreview = () => {
  activeIndex.value = Math.max(
    0,
    gallery.value.findIndex((item) => item.url === props.media.url)
  );
  previewVisible.value = true;
};
const move = (direction: number) => {
  activeIndex.value = (activeIndex.value + direction + gallery.value.length) % gallery.value.length;
};
const onKeydown = (event: KeyboardEvent) => {
  // 保留视频播放器原生的方向键快进、快退。
  if ((event.target as HTMLElement)?.tagName === "VIDEO" || event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }
  if (gallery.value.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    event.preventDefault();
    move(event.key === "ArrowLeft" ? -1 : 1);
  }
};
watch(previewVisible, (visible) => {
  if (visible) {
    window.addEventListener("keydown", onKeydown);
  } else {
    window.removeEventListener("keydown", onKeydown);
  }
});
onUnmounted(() => window.removeEventListener("keydown", onKeydown));
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.media-preview {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border: 1px solid $color-lp-25;
  border-radius: 6px;
  overflow: hidden;
}

.thumb-img,
.thumb-video-button,
.thumb-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-img {
  cursor: zoom-in;
}

.thumb-video-button {
  position: relative;
  padding: 0;
  border: none;
  background: #11131b;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $color-primary;
    outline-offset: -2px;
  }
}

.thumb-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

.attachment-video-preview,
.attachment-image-preview {
  display: block;
  width: 100%;
  height: auto;
  max-height: 68vh;
  object-fit: contain;
  border-radius: 12px;
}

.media-gallery-stage {
  overflow: hidden;
  border-radius: 12px;
}

.media-gallery-dialog {
  padding: 20px;
  border-radius: 16px;

  :deep(.el-dialog__title) {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    padding-right: 20px;
    font-size: 14px;
  }
}

.media-gallery-navigation {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 12px;
  color: $color-text-secondary;

  button {
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid $color-lp-25;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    font-size: 24px;
    cursor: pointer;

    &:hover,
    &:focus-visible {
      color: $color-primary;
      border-color: $color-primary;
    }
  }
}
</style>
