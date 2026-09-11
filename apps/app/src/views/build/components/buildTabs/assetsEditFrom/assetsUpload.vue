<template>
  <div class="upload-file">
    <div
      class="upload-trigger"
      :class="{ 'drag-over': isDragOver }"
      @click="handleOpenFileDialog"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="upload-placeholder" v-if="!previewImages || previewImages.length === 0">
        <Icon type="Document" size="16" />
        <p>单击或拖放文件至此处进行上传</p>
      </div>

      <div class="upload-image-list" :class="{ 'single-image': previewImages && previewImages.length === 1 }" v-else>
        <PreviewImageItem
          v-for="(image, index) in previewImages"
          :key="index"
          :image-url="image.previewUrl"
          :title="image.title"
          :index="index"
          :resource-type="resourceType"
          @delete="handleDeleteImage"
          @replace="handleReplaceImage"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, toRefs, watch } from "vue";
import { useFileDialog } from "@vueuse/core";

import { ElMessage } from "element-plus";

import Icon from "@/components/Icon/index.vue";
import {
  getAcceptByResourceType,
  validateFileByResourceType
} from "@/views/build/components/buildTabs/selectAssets/assetsClass/uploadValidators";

import PreviewImageItem from "./PreviewImageItem.vue";
import { ResourceTypeEnum } from "./type";

interface Props {
  resourceType: ResourceTypeEnum;
  fileUrl: string | null;
  multiple?: boolean;
  previewImages?: Array<{ file: File | null; previewUrl: string; title: string }>;
}

const props = withDefaults(defineProps<Props>(), {
  resourceType: ResourceTypeEnum.image,
  multiple: false // 默认单选
});

const { resourceType, previewImages, multiple } = toRefs(props);

const emit = defineEmits<{
  (e: "change", files: File[]): void;
  (e: "delete", index: number): void;
  (e: "replace", index: number, file: File): void;
}>();

// 初始化 fileDialogOptions - 根据 multiple prop 决定是否多选
const fileDialogOptions = ref({
  accept: getAcceptByResourceType(resourceType.value),
  multiple: multiple.value
});

const { open: openFileDialog, onChange: onChangeFile } = useFileDialog(fileDialogOptions.value);

// 单选文件对话框用于替换
const singleFileDialogOptions = ref({
  accept: getAcceptByResourceType(resourceType.value),
  multiple: false
});

const { open: openSingleFileDialog, onChange: onChangeSingleFile } = useFileDialog(singleFileDialogOptions.value);
const replaceIndex = ref<number>(-1);
const handleOpenFileDialog = () => {
  openFileDialog({
    accept: fileDialogOptions.value.accept,
    multiple: fileDialogOptions.value.multiple
  });
};

onChangeFile(async (files) => {
  if (files && files.length > 0) {
    emit("change", Array.from(files));
  }
});

// 单选文件变化处理
onChangeSingleFile(async (files) => {
  if (files && files.length > 0 && replaceIndex.value >= 0) {
    const file = files[0];
    const validationResult = validateFileByResourceType(file, resourceType.value);

    if (validationResult.success) {
      emit("replace", replaceIndex.value, file);
      replaceIndex.value = -1; // 重置
    } else {
      ElMessage.error(validationResult.message);
    }
  }
});

// 监听 resourceType 和 multiple 变化，动态更新 accept 和 multiple
watch([resourceType, multiple], ([newType, newMultiple]) => {
  if (newType) {
    fileDialogOptions.value.accept = getAcceptByResourceType(newType);
    singleFileDialogOptions.value.accept = getAcceptByResourceType(newType);
  }
  if (newMultiple !== undefined) {
    fileDialogOptions.value.accept = getAcceptByResourceType(newType);
    fileDialogOptions.value.multiple = newMultiple;
  }
});

const isDragOver = ref(false);

const handleDragOver = () => {
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const filesArray = Array.from(files);
    const validFiles: File[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const validationResult = validateFileByResourceType(file, resourceType.value);

      if (validationResult.success) {
        validFiles.push(file);
      } else {
        ElMessage.error(validationResult.message);
      }
    }

    if (validFiles.length > 0) {
      emit("change", validFiles);
    }
  }
};

const handleDeleteImage = (index: number) => {
  emit("delete", index);
};

const handleReplaceImage = (index: number) => {
  replaceIndex.value = index;
  openSingleFileDialog();
};
</script>

<style lang="scss" scoped>
.upload-file {
  .upload-trigger {
    width: 502px;
    min-height: 168px;
    background: #0f1014;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;

    .upload-placeholder {
      width: 100%;
      height: 168px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: rgba(255, 255, 255, 0.6);

      p {
        margin: 8px 0 0 0;
        font-size: 14px;
        line-height: 20px;
      }
    }

    &.drag-over {
      border: 2px dashed #6095ff;
      background: #181c25;
    }
  }

  .upload-image-list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    box-sizing: border-box;
    gap: 12px;
    min-height: 168px;
    padding: 12px;
    max-height: 400px;
    overflow-y: auto;

    &.single-image {
      display: flex;
      justify-content: center;
      align-items: flex-start;

      :deep(.preview-image-item) {
        width: calc((100% - 36px) / 4);
      }
    }
  }
}
</style>
