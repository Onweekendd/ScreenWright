<template>
  <div class="upload-box" :class="{ 'is-has-url': fileUrl && fileUrl.length > 0 }">
    <div class="sw-upload">
      <div v-if="fileUrl" class="imgBox flex flex-center">
        <img v-if="isImg" :src="fileUrl" class="ft-upload__avatar" />
        <video v-else-if="isVideo" :src="fileUrl" autoplay muted loop class="ft-upload__avatar" crossorigin="anonymous" />
        <Icon v-else-if="isAudio" type="VideoPlay" size="60" />
      </div>
      <div class="btn-box">
        <el-button v-if="props.selectAssets && hasAssets" size="small" type="primary" class="assetsBtn" @click.stop="handleAssets">
          选择素材
        </el-button>
        <el-button size="small" type="primary" @click.stop="handleOpenFile">{{ fileUrl ? "更换" : "点击上传" }}</el-button>
      </div>
    </div>
    <Icon type="Delete" v-if="props.showDel" class="delete-wrapper" size="14" @click.stop="handleDelete" />
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useFileDialog } from "@vueuse/core";
import { useRoute } from "vue-router";

import { setMinioUrl } from "@screenwright/composables";

import Icon from "@editor/base/Icon/index.vue";

import type { SwUploadProps } from "./SwUpload";
import { SwUploadEmits, FileType } from "./SwUpload";
import { useUpload } from "./useUpload";

const props = withDefaults(defineProps<SwUploadProps>(), {
  fileType: FileType.img,
  selectAssets: true,
  showDel: true
});

const emit = defineEmits(SwUploadEmits);
const { upload, openAssets, hasAssets } = useUpload();
const route = useRoute();

const fileUrl = ref("");

watch(
  () => props.modelValue,
  (nVal) => {
    if (!nVal || nVal === "none") {
      fileUrl.value = "";
    } else if (typeof nVal === "string") {
      const isHasHttp = nVal.includes("http");
      const isBase64 = nVal.startsWith("data:") && nVal.includes(";base64,");
      // 已是绝对地址/base64 直接用；相对路径需拼接 minio 域名，否则会被 <img> 解析成路由地址
      fileUrl.value = isHasHttp || isBase64 ? nVal : setMinioUrl(nVal);
    }
  },
  { immediate: true }
);

const imgExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
const videoExts = ["mp4", "webm", "ogg", "avi", "mov", "wmv", "flv", "mkv"];
const audioExts = ["mp3", "wav", "ogg", "aac", "flac"];

const autoExt = computed(() => fileUrl.value?.split(".").pop()?.toLowerCase() || "");
const isImg = computed(() => props.fileType === FileType.img || imgExts.includes(autoExt.value));
const isVideo = computed(() => props.fileType === FileType.video || videoExts.includes(autoExt.value));
const isAudio = computed(() => props.fileType === FileType.audio || audioExts.includes(autoExt.value));

const acceptMap: Record<FileType, string> = {
  img: "image/jpg,image/jpeg,image/png,image/gif,image/webp,image/svg+xml",
  video: "video/mp4,video/webm,video/ogg",
  audio: "audio/mpeg,audio/wav,audio/ogg,audio/aac",
  model: "model/gltf-binary,application/octet-stream",
  imgAndVideo: "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm",
  file: ".pdf"
};

const { open: openFile, onChange: onChangeFile } = useFileDialog({
  accept: props.accept || acceptMap[props.fileType],
  multiple: props.multiple
});

const handleOpenFile = () => openFile();

onChangeFile(async (files) => {
  if (!files || !files.length) return;
  const largeId = route.params.id;
  const result = await upload(files[0], props.fileType, Array.isArray(largeId) ? largeId[0] : largeId);
  if (result) {
    // 存相对路径（不含 minio 域名），展示时才拼域名
    fileUrl.value = setMinioUrl(result.url);
    emit("update:modelValue", result.url);
    emit("change", result);
  }
});

const handleDelete = () => {
  fileUrl.value = "";
  emit("update:modelValue", "");
  emit("delete", "");
};

const handleAssets = () => {
  openAssets((payload) => {
    fileUrl.value = setMinioUrl(payload.url);
    emit("update:modelValue", payload.url);
    emit("change", payload);
  }, props.fileType);
};
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
    background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
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
    &:hover { border-color: var(--sw-theme-color); }
  }
  &.is-has-url:hover .delete-wrapper { display: block; }
  img, video {
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
  }
}
</style>
