<template>
  <div class="upload-box" :class="{ 'is-has-url': fileUrl && fileUrl.length > 0 }">
    <div class="sw-upload">
      <div v-if="fileUrl" class="imgBox flex flex-center">
        <img v-if="fileType == 'img' || fileAutoType == 'img'" :src="fileUrl" class="ft-upload__avatar" />
        <img v-else-if="fileAutoType === 'pdf' || accept?.includes('.pdf')" :src="pdfIcon" />
        <img v-else-if="fileAutoType === 'model' || accept?.includes('.glb,.gltf')" :src="modelIcon" />
        <video
          v-if="fileType == 'video' || fileAutoType == 'video'"
          :src="fileUrl"
          autoplay
          muted
          loop
          class="ft-upload__avatar"
          crossorigin="anonymous"
        />
        <Icon type="VideoPlay" class="" v-if="fileType == 'audio' || fileAutoType == 'audio'" size="60" />
        <!-- <Icon type="MessageBox" v-if="fileType == 'model'" size="60" /> -->
      </div>
      <div class="btn-box">
        <el-button v-if="selectAssets" size="small" type="primary" class="assetsBtn" @click.stop="handleAssets"
          >选择素材</el-button
        >
        <el-button size="small" type="primary" @click.stop="handleOpenFileDialog">{{
          fileUrl ? "更换" : "点击上传"
        }}</el-button>
      </div>
    </div>
    <Icon type="Delete" v-if="showDel" class="delete-wrapper" size="14" @click.stop="handleDelete" />
    <el-button size="small" type="primary" class="screen-shot" @click="handleScreenShot" v-if="screenShot"
      >截图</el-button
    >
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useFileDialog } from "@vueuse/core";

import modelIcon from "@/assets/icon/assets-icon-modal.png";
import pdfIcon from "@/assets/icon/assets-icon-pdf.png";
import Icon from "@/components/Icon/index.vue";
import { useDialog } from "@/hooks/useDialog";
import { setMinioUrl } from "@/utils/config";
import SelectAssets from "@/views/build/components/buildTabs/selectAssets/index.vue";

import type { FtUploadProps } from "./SwUpload";
import { FtUploadEmits } from "./SwUpload";
import { FileType } from "./SwUpload";
import { useSwUpload } from "./useSwUpload";
// import { ElMessage } from "element-plus"

const props = withDefaults(defineProps<FtUploadProps>(), {
  fileType: FileType.img,
  selectAssets: true,
  showDel: true
});

const emit = defineEmits(FtUploadEmits);

const { fileUrl, fileTypeMap, handleDeleteClick, handleScreenShot, isFileTypeValid, onChange } = useSwUpload(
  props,
  emit
);

const fileAutoType = computed(() => {
  if (!fileUrl.value) return props.fileType; // 没有文件时返回默认类型

  // 获取文件后缀
  const url = fileUrl.value;
  const ext = url.split(".").pop()?.toLowerCase();

  if (!ext) return props.fileType;

  // 常见图片、视频、音频、模型类型
  const imgExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
  const videoExts = ["mp4", "webm", "ogg", "avi", "mov", "wmv", "flv", "mkv"];
  const audioExts = ["mp3", "wav", "ogg", "aac", "flac"];
  const modelExts = ["obj", "fbx", "gltf", "glb", "stl"];
  const pdfExts = ["pdf"];

  if (imgExts.includes(ext)) return "img";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  if (modelExts.includes(ext)) return "model";
  if (pdfExts.includes(ext)) return "pdf";

  return props.fileType; // 未知类型返回默认
});

const fileDialogOptions = computed(() => {
  return {
    accept: props.accept ? props.accept : fileTypeMap[props.fileType].accept,
    multiple: props.multiple
  };
});

const { open: openFileDialog, onChange: onChangeFile, reset: resetFileDialog } = useFileDialog(fileDialogOptions.value);

const handleDelete = () => {
  resetFileDialog();
  handleDeleteClick();
};

const handleOpenFileDialog = () => {
  openFileDialog();
};

const { dialog } = useDialog();
const handleAssets = () => {
  dialog({
    DialogProps: {
      title: "选择素材",
      width: "980px",
      modalClass: "build-render-ignore"
    },
    componentProps: {},
    component: SelectAssets,
    closeBefore: async (componentData, done) => {
      const res = componentData.validate();
      const validRes = isFileTypeValid({
        name: res.fileName || res.name,
        type: res.fileType
      });
      if (validRes) {
        fileUrl.value = setMinioUrl(res.url);

        emit("update:modelValue", res.url);
        emit("change", res);
      }

      done();
    }
  });
};

onChangeFile(async (files) => {
  if (files && files.length > 0) {
    onChange(files[0]);
  }
});
</script>
<style lang="scss" scoped>
.upload-box {
  width: 99%;
  border-radius: 4px;
  position: relative;
  .delete-wrapper {
    cursor: pointer;
    position: absolute;
    right: 3px;
    top: 3px;
    color: #fff;
    display: none;
  }
  .el-button {
    width: 70px;
    height: 25px;
    background-image: -webkit-gradient(linear, left top, left bottom, from(#8b58e7), to(#642cff));
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
    padding: 0 !important;
  }

  .sw-upload {
    position: relative;
    height: 103px;
    background: #1a1e27;
    border: 1px solid #333543;
    &:hover {
      border-color: #642cff;
    }
  }
  .screen-shot {
    margin-top: 10px;
  }

  &.is-has-url {
    &:hover {
      .delete-wrapper {
        display: block;
      }
    }
  }
  :deep(.el-upload) {
    height: 100%;
    width: 100%;
  }

  img {
    height: 100%;
    width: 100%;
    object-fit: scale-down;
  }
  video {
    height: 100%;
    width: 100%;
    object-fit: scale-down;
  }
  .btn-box {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    flex-wrap: wrap;
  }
  .imgBox {
    position: relative;
    height: 100%;
    width: 100%;
    &:hover .deleteBtn {
      display: block;
      margin: 0;
    }
    .deleteBtn {
      z-index: 10;
      display: none;
      position: absolute;
      right: 2%;
      bottom: 39%;
      font-size: 14px;
      color: #fff;
    }
    .addBtn,
    .clearBtn {
      display: block;
      z-index: 10;
      position: absolute;
      right: 10px;
      top: 6px;
      font-size: 14px;
      color: #fff;
      height: 14px;
      width: 14px;
      line-height: 14px;
    }
    .addBtn {
      right: 34px;
    }
  }
}
</style>
