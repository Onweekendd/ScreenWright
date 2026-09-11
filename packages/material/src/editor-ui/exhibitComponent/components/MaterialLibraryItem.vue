<template>
  <div
    class="material-library-item"
    :class="{
      'is-selected': isSelected,
      'is-invalid': !isValidImage,
      'is-used': isUsed
    }"
    @click="handleClick"
  >
    <template v-if="isValidImage">
      <img v-if="imageUrl" :src="imageUrl" :alt="title" @error="handleImageError" />
      <div class="image-info">
        <span class="image-title">{{ title }}</span>
      </div>
      <div class="image-selected-mask" v-if="isSelected">
        <Icon type="Check" />
      </div>
      <div class="image-used-mask" v-if="isUsed">
        <i class="el-icon-success" />
        <span>已使用</span>
      </div>
    </template>
    <div v-else class="invalid-type-mask">
      <i class="el-icon-warning-outline" />
      <span>素材类型不匹配</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import Icon from "@editor/base/Icon/index.vue";

const VALID_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];
interface Props {
  imageUrl: string;
  title: string;
  isSelected: boolean;
  isUsed: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  imageUrl: "",
  title: "",
  isSelected: false,
  isUsed: false
});
const emits = defineEmits(["select"]);
const isValidImage = computed(() => {
  if (!props.imageUrl) return false;
  const extension = props.imageUrl.toLowerCase().substring(props.imageUrl.lastIndexOf(".")).split("?")[0];
  return VALID_IMAGE_EXTENSIONS.includes(extension);
});
const handleImageError = (event: Event) => {
  console.error(`Failed to load image: ${props.imageUrl}`);
  if (event.target instanceof HTMLImageElement) {
    event.target.src = "/path/to/fallback-image.png";
  }
};
const handleClick = () => {
  if (isValidImage.value && !props.isUsed) {
    emits("select");
  }
};
</script>
<style lang="scss" scoped>
.material-library-item {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 4px;
  overflow: hidden;
  background-color: #232630;
  border: 1px solid rgba(139, 88, 231, 0.2);
  cursor: pointer;
  transition: all 0.3s;

  &.is-selected {
    border-color: #8b58e7;
    box-shadow: 0 0 0 2px rgba(139, 88, 231, 0.5);
  }

  &.is-invalid {
    cursor: not-allowed;
    border-color: rgba(139, 88, 231, 0.1);
    background-color: rgba(35, 38, 48, 0.8);

    &:hover {
      transform: none;
      border-color: rgba(139, 88, 231, 0.1);
    }
  }

  &.is-used {
    cursor: not-allowed;
    border-color: rgba(139, 88, 231, 0.3);

    &:hover {
      transform: none;
      border-color: rgba(139, 88, 231, 0.3);
    }

    .image-used-mask {
      opacity: 1;
    }
  }

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
    padding: 4px 8px;
    background: rgba(35, 38, 48, 0.8);
    color: #8b58e7;
    font-size: 12px;

    .image-title {
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .image-selected-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(139, 88, 231, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;

    i {
      font-size: 24px;
      color: #fff;
    }
  }

  .image-used-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(35, 38, 48, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s;

    i {
      font-size: 24px;
      color: #8b58e7;
      margin-bottom: 8px;
    }

    span {
      font-size: 12px;
      color: #8b58e7;
    }
  }

  .invalid-type-mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    color: rgba(139, 88, 231, 0.5);

    i {
      font-size: 24px;
      margin-bottom: 8px;
    }

    span {
      font-size: 12px;
    }
  }

  &:hover {
    border-color: #8b58e7;
    transform: translateY(-2px);
  }
}
</style>
