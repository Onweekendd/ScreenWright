<template>
  <div class="image-upload-dialog">
    <div
      class="upload-area flex flex-center flex-column"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <Icon type="UploadFilled" color="var(--sw-theme-color)" size="28" />
      <div class="el-upload__text">将文件拖到此处，或<em @click="() => openFileDialog()">点击上传</em></div>
    </div>
    <div class="el-upload__tip">支持jpg、png、gif格式，单个文件不超过5MB</div>
    <div class="preview-list" v-if="previewImages.length > 0">
      <image-preview-item
        v-for="(image, index) in previewImages"
        :key="index"
        :image-url="image.previewUrl"
        :title="image.title"
        :index="index"
        @delete="handleDelete(index)"
      />
    </div>
  </div>
  <span class="dialog-footer">
    <el-button class="custom-button" @click="cancel">取 消</el-button>
    <el-button class="custom-button" type="primary" :loading="loading" @click="handleConfirm">
      {{ loading ? "上传中" : "确 定" }}
    </el-button>
  </span>
</template>
<script setup lang="ts">
import { inject, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useFileDialog } from "@vueuse/core";

import { ElMessage } from "element-plus";

import { uploadMinioScene } from "../api";
import { dialogInjectionKey } from "@screenwright/ui";
import Icon from "@editor/base/Icon/index.vue";
import { BaseName, batchCompressPic } from "@screenwright/composables";
import { FileTypeEnum, ResourceTypeEnum } from "@screenwright/types";

import ImagePreviewItem from "./ImagePreviewItem.vue";

const { confirm, cancel } = inject(dialogInjectionKey)!;
const route = useRoute();
const { open: openFileDialog, onChange: onChangeFile } = useFileDialog({
  accept: "image/jpeg,image/png,image/gif,image/jpg",
  multiple: true
});
const previewImages = ref<any[]>([]);
const fileList = ref<any[]>([]);
const responseResult = ref<any[]>([]);
const loading = ref(false);
onChangeFile(async (files) => {
  if (files && files.length > 0) {
    console.log("Selected files:", files);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        ElMessage.error(`${file.name} 文件大小超过5MB`);
        continue;
      }

      const uploadFileRaw = await batchCompressPic(file as File, 2);
      fileList.value.push(uploadFileRaw);
      const previewUrl = URL.createObjectURL(uploadFileRaw);
      previewImages.value.push({
        file: uploadFileRaw,
        previewUrl,
        title: uploadFileRaw.name,
        src: "" // 上传成功后会更新这个字段
      });
    }
  }
});

const handleDelete = (index: number) => {
  previewImages.value.splice(index, 1);
};

const handleConfirm = async () => {
  for (let i = 0; i < previewImages.value.length; i++) {
    const file = previewImages.value[i].file;

    const res = await uploadMinioScene({
      name: file.name,
      resourceType: ResourceTypeEnum.image,
      fileType: FileTypeEnum.personalScreen,
      largeId: Array.isArray(route.params.id) ? route.params.id[0] : route.params.id,
      groupId: "",
      file: file as File,
      coverFile: null,
      coverFileUrl: null,
      fileUrl: null,
      applicationCode: BaseName.AppCode
    });

    if (res.code === 200) {
      responseResult.value.push({
        src: res.result.url,
        title: file.name,
        id: res.result.id
      });
    }
  }

  confirm();
};

const isDragOver = ref(false);

const handleDragOver = () => {
  isDragOver.value = true;
};

const handleDragLeave = () => {
  isDragOver.value = false;
};

const handleDrop = async (e: DragEvent) => {
  isDragOver.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const regex = /^(image\/(jpeg|png|gif|jpg))$/;
      // const str = "image/jpeg,image/png,image/gif,image/jpg"
      if (regex.test(file.type)) {
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
          ElMessage.error(`${file.name} 文件大小超过5MB`);
          continue;
        }
        loading.value = true;
        const uploadFileRaw = await batchCompressPic(file as File, 2);
        fileList.value.push(uploadFileRaw);
        const previewUrl = URL.createObjectURL(uploadFileRaw);
        previewImages.value.push({
          file: uploadFileRaw,
          previewUrl,
          title: uploadFileRaw.name,
          src: "" // 上传成功后会更新这个字段
        });
        loading.value = false;
      } else {
        ElMessage.error(`${file.name} 请上传符合格式的文件,仅支持jpg、png、gif格式`);
        continue;
      }
    }
  } else {
    ElMessage.error("请上传图片文件");
  }
};
onMounted(() => {
  responseResult.value = [];
  previewImages.value = [];
  fileList.value = [];
  loading.value = false;
});
const validate = () => {
  return responseResult.value;
};

defineExpose({
  validate
});
</script>
<style lang="scss" scoped>
.preview-list {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  // height: calc(100% - 36px);
  padding-right: 6px;
  padding-bottom: 6px;
}
.image-upload-dialog {
  height: 600px;
  overflow-y: auto;
  overflow-x: hidden;
  .upload-area {
    width: 204px;
    margin: 0 auto;
    margin-top: 10px;
    background-color: color-mix(in srgb, var(--sw-theme-color) 10%, transparent);
    border: 1px dashed color-mix(in srgb, var(--sw-theme-color) 50%, transparent);
    border-radius: 8px;
    padding: 20px 10px;
    height: 180px;
    cursor: pointer;
    &.drag-over {
      border: 2px dashed #6095ff;
      background: #181c25;
    }
    &:hover {
      border-color: var(--sw-theme-color);
      background-color: color-mix(in srgb, var(--sw-theme-color) 20%, transparent);
    }
  }
  .el-upload__text {
    color: var(--sw-theme-color);
    margin-top: 20px;
    em {
      color: var(--sw-theme-color);
      font-style: normal;
      text-decoration: underline;
    }
  }
  .el-upload__tip {
    color: color-mix(in srgb, var(--sw-theme-color) 70%, transparent);
    text-align: center;
    margin-top: 12px;
  }
}
.dialog-footer {
  display: flex;
  justify-content: end;
  .custom-button {
    border-radius: 8px;
    background-color: transparent;
    border-color: color-mix(in srgb, var(--sw-theme-color) 50%, transparent);
    color: var(--sw-theme-color);
    padding: 10px 20px;
    height: 36px;
    font-size: 14px;

    &:hover {
      background-color: color-mix(in srgb, var(--sw-theme-color) 20%, transparent);
      border-color: var(--sw-theme-color);
      color: #fff;
    }

    &.el-button--primary {
      background-color: var(--sw-theme-color);
      border-color: var(--sw-theme-color);
      color: #fff;

      &:hover {
        background-color: color-mix(in srgb, var(--sw-theme-color) 90%, white);
        border-color: color-mix(in srgb, var(--sw-theme-color) 90%, white);
      }

      &.is-loading {
        background-color: color-mix(in srgb, var(--sw-theme-color) 70%, transparent);
        border-color: color-mix(in srgb, var(--sw-theme-color) 70%, transparent);
      }
    }
  }
}
</style>
