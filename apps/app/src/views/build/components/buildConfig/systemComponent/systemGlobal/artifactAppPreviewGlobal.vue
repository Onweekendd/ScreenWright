<script setup lang="ts">
import { computed } from "vue";

import type { ArtifactAppPreviewOption } from "@screenwright/types";

import { useUpdateInstance } from "../../useUpdateInstance";

const { selectTargetData, update } = useUpdateInstance();

const previewOption = computed(() => selectTargetData.value[0]?.option as ArtifactAppPreviewOption | undefined);
</script>

<template>
  <div v-if="previewOption" class="artifact-app-preview-config">
    <el-form-item label="预览模式">
      <el-select v-model="previewOption.previewMode" popper-class="sw-select-dropdown" @change="update">
        <el-option label="开发预览" value="development" />
        <el-option label="发布预览" value="published" />
      </el-select>
    </el-form-item>

    <el-form-item label="允许交互">
      <el-checkbox v-model="previewOption.allowInteraction" @change="update" />
    </el-form-item>

    <el-form-item label="显示状态">
      <el-checkbox v-model="previewOption.showStatus" @change="update" />
    </el-form-item>
  </div>
</template>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include checkbox-style();
@include common-element-style(".el-select__wrapper");

.artifact-app-preview-config {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

:deep(.el-select__wrapper) {
  min-height: 28px;
}
</style>
