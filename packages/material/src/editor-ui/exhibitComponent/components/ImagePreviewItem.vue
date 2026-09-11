<template>
  <div class="image-preview-item">
    <img :src="imageUrl" :alt="title" />
    <div class="image-info">
      <span class="image-title">{{ title }}</span>
    </div>
    <div class="image-actions">
      <el-button type="danger" :icon="Delete" circle @click="handleDelete" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { Delete } from "@element-plus/icons-vue";

interface Props {
  imageUrl: string;
  title: string;
  index: number;
}
const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "delete", index: number): void;
}>();
const handleDelete = () => {
  emit("delete", props.index);
};
</script>
<style lang="scss" scoped>
.image-preview-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background-color: #232630;
  border: 1px solid rgba(139, 88, 231, 0.2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 8px;
    background: rgba(35, 38, 48, 0.8);
    color: #8b58e7;
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
    opacity: 0;
    transition: opacity 0.3s;

    :deep(.el-button--danger) {
      background-color: rgba(35, 38, 48, 0.8);
      border-color: transparent;
      color: #8b58e7;

      &:hover {
        background-color: rgba(139, 88, 231, 0.2);
        color: #fff;
      }
    }
  }

  &:hover {
    .image-info,
    .image-actions {
      opacity: 1;
    }
  }
}
</style>
