<template>
  <div class="upload-box">
    <el-button type="primary" @click="onManageImage">管理图片</el-button>
  </div>
</template>
<script setup lang="ts">
import { useVModel } from "@vueuse/core";

import type { ImageItem } from "../types";
import { useImagePreviewDialog } from "./useImagePreviewDialog";

const props = defineProps<{
  value: ImageItem[];
  draggable?: boolean;
}>();
const emit = defineEmits<{
  "update:value": [newData: ImageItem[]];
}>();

const modelValue = useVModel(props, "value", emit);

const { openImagePreview } = useImagePreviewDialog();

const onManageImage = async () => {
  const next: ImageItem[] | undefined = await openImagePreview(modelValue.value, props.draggable);
  console.log(next, "nextnextnextnext");
  if (next) {
    modelValue.value = next;
  }
};
</script>
<style lang="scss" scoped>
.upload-box {
  width: 99%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-radius: 4px;
  position: relative;
  height: 103px;
  text-align: center;
  line-height: 103px;
  background: #1a1e27;
  border-radius: 4px;
  border: 1px solid #333543;
  .el-button {
    width: 70px;
    height: 25px;
    background-image: -webkit-gradient(linear, left top, left bottom, from(var(--sw-theme-color)), to(var(--sw-theme-color)));
    background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
    padding: 0 !important;
  }
  &:hover {
    border-color: var(--sw-theme-color);
  }
}
</style>
