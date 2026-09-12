<template>
  <el-upload
    class="asset-upload"
    :accept="acceptList"
    :show-file-list="false"
    drag
    action="#"
    :on-change="onChange"
    :auto-upload="false"
  >
    <img v-if="imageUrl.length > 0" :src="getTypeIcons" class="preview-image" />
    <SwItemEmpty v-else type="upload" />
    <div class="el-upload__text">
      <div>{{ imageUrl.length > 0 ? "点击更换文件" : "单击或拖放文件至此处进行上传" }}</div>
    </div>
  </el-upload>
</template>
<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";

import type { UploadFile } from "element-plus";
import { ElMessage } from "element-plus";

import IconModal from "@/assets/icon/assets-icon-modal.png";
import SwItemEmpty from "@/components/SwItemEmpty/index.vue";
import { getImageUrl, getVideoBase64 } from "@/utils/utils";

interface AssetUploadProps {
  modelValue: Record<string, any> | UploadFile | undefined | null;
  accept?: Array<string>;
}
const props = defineProps<AssetUploadProps>();
const emits = defineEmits(["change"]);

const acceptList = computed(() => {
  if (Array.isArray(props.accept)) {
    return props.accept.join(",");
  }
  return "";
});

const getTypeIcons = computed(() => {
  if (imageUrl.value.includes("glb") || imageUrl.value.includes("gltf")) {
    return IconModal;
  }

  return imageUrl.value;
});

const imageUrl = ref("");

function judgeFileType(fileInfo: UploadFile): string {
  // 获取文件名
  const fileName = fileInfo.name;

  const lastDotIndex = fileName.lastIndexOf(".");
  const ext = lastDotIndex !== -1 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";
  return ext;
}

const onChange = async (file: UploadFile) => {
  const fileType = judgeFileType(file);

  if (props.accept && props.accept.length > 0 && !props.accept.includes(`.${fileType}`)) {
    ElMessage.error("文件格式不支持，请重新选择");
    return;
  }
  if (file && file.raw && file.size) {
    // imageUrl.value = await getImageUrl(file, props.accept)
    emits("change", file);
  } else {
    emits("change", null);
  }
};
// 使用 watchEffect 来处理异步的 imageUrl 计算
watchEffect(async () => {
  const modelValue = props.modelValue;

  if (!modelValue) {
    imageUrl.value = "";
    return;
  }

  if (modelValue.url) {
    imageUrl.value = await getImageUrl(modelValue.url, props.accept);
  } else if (modelValue.raw && modelValue.size) {
    const fileType = judgeFileType(modelValue as UploadFile);
    if (fileType === "webm" || fileType === "mp4") {
      const url = URL.createObjectURL(modelValue.raw);
      imageUrl.value = await getVideoBase64(url);
    } else {
      imageUrl.value = await getImageUrl(modelValue as UploadFile, props.accept);
    }
  } else {
    imageUrl.value = "";
  }
});
</script>
<style lang="scss" scoped>
.asset-upload {
  width: 100%;
  font-size: 12px;
  :deep(.el-upload-dragger) {
    background-color: #0f1014;
    border-radius: 4px;
    border: none !important;
  }
  .preview-image {
    pointer-events: none;
    font-size: 40px;
    width: 200px;
    height: 200px;
    margin: 0 auto;
    border-radius: 4px;
  }
}
</style>
