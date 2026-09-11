<template>
  <div class="preview-image-item">
    <img
      v-if="resourceType === ResourceTypeEnum.image"
      :src="setMinioUrl(imageUrl)"
      :alt="title"
      @click.stop="handleReplace"
    />
    <video
      v-else-if="resourceType === ResourceTypeEnum.video"
      :src="setMinioUrl(imageUrl)"
      class="preview-video"
      autoplay
      muted
      loop
      crossorigin="anonymous"
      @click.stop="handleReplace"
    />
    <div v-else class="compress-preview" @click.stop="handleReplace">
      <Icon type="Document" size="32" />
      <p>文件预览</p>
    </div>
    <div class="image-info">
      <span class="image-title">{{ title }}</span>
    </div>
    <div class="image-actions">
      <Icon type="delete" size="16" color="#fff" @click.stop="handleDelete" />
    </div>
  </div>
</template>

<script setup lang="ts">
import Icon from "@/components/Icon/index.vue";
import { setMinioUrl } from "@/utils/config";

import { ResourceTypeEnum } from "./type";

interface Props {
  imageUrl: string;
  title: string;
  index: number;
  resourceType?: ResourceTypeEnum;
}

const props = withDefaults(defineProps<Props>(), {
  resourceType: ResourceTypeEnum.image
});
const emit = defineEmits<{
  (e: "delete", index: number): void;
  (e: "replace", index: number): void;
}>();

const handleDelete = () => {
  emit("delete", props.index);
};

const handleReplace = () => {
  emit("replace", props.index);
};
</script>

<style lang="scss" scoped>
.preview-image-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  background-color: #0f1014;
  border: 1px solid rgba(96, 149, 255, 0.2);
  cursor: pointer;

  img,
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  .compress-preview {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #6095ff;
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }

    p {
      margin: 8px 0 0 0;
      font-size: 12px;
      font-weight: 500;
    }
  }

  .image-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 6px;
    background: rgba(15, 16, 20, 0.9);
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    opacity: 0;
    transition: opacity 0.3s;

    .image-title {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .image-actions {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: rgba(15, 16, 20, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
    cursor: pointer;

    &:hover {
      background-color: rgba(96, 149, 255, 0.3);
    }
  }

  &:hover {
    border-color: #8b58e7;

    .image-info,
    .image-actions {
      opacity: 1;
    }
  }
}
</style>
