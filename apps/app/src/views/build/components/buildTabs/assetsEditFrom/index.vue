<template>
  <div class="assets-edit-from">
    <div class="upload-dialog-content" @click.stop>
      <el-form ref="formRef" :model="form" :rules="showNameField ? assetsCloudRules : localAssetsRules">
        <el-form-item label="类型" v-if="resourceTypeOptions.length > 0" prop="resourceType" :label-width="100">
          <SwRadio
            class="config-padding"
            direction="row"
            :option="resourceTypeOptions"
            v-model="form.resourceType"
            @change="handleRemoveFile"
            :disabled="editType === EditTypeEnum.edit"
          />
        </el-form-item>

        <el-form-item label="上传文件" prop="file" :label-width="100">
          <asset-upload
            :multiple="editType === EditTypeEnum.add"
            :resourceType="form.resourceType"
            :fileUrl="form.fileUrl"
            :previewImages="previewImages"
            @change="onFileChange"
            @delete="handleDeletePreviewImage"
            @replace="handleReplacePreviewImage"
          />
        </el-form-item>

        <el-form-item label="上传到" prop="groupId" v-if="showGroupSelect" :label-width="100">
          <el-select
            popper-class="sw-select-dropdown"
            v-model="form.groupId"
            :teleported="false"
            :popper-append-to-body="false"
          >
            <el-option v-for="item in groupOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="名称" prop="name" v-if="showNameField" :label-width="100">
          <sw-input style="height: 32px" v-model="form.name" />
        </el-form-item>
      </el-form>
      <div class="dialog-footer flex flex-end">
        <el-button class="cancel" type="default" @click="handleCancel">取消</el-button>
        <el-button class="check" type="primary" @click="handleCheck">确定</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from "vue";

import { ElMessage } from "element-plus";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import SwInput from "@/components/SwInput/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import { assetsClassManager, getTitleByFileType } from "@/views/build/components/buildTabs/selectAssets/assetsClass";

import AssetUpload from "./assetsUpload.vue";
import type { Props } from "./type";
import { EditTypeEnum, FileTypeEnum, ResourceTypeEnum } from "./type";
import { useAssetsEdit } from "./useAssetsEdit";

const { confirm, cancel } = inject(dialogInjectionKey)!;

const props = withDefaults(defineProps<Props>(), {
  fileType: FileTypeEnum.personalPageAssets
});

// 获取当前资产类型的实例
const currentAssetsClass = computed(() => {
  return assetsClassManager.getAssetsClassByTitle(getTitleByFileType(props.fileType));
});

// 根据资产类属性计算显示逻辑
const showGroupSelect = computed(() => {
  return currentAssetsClass.value.isAvailableEditGroup;
});

const showNameField = computed(() => {
  return !previewImages || previewImages.value.length <= 1;
});

const {
  editType,
  form,
  formRef,
  assetsCloudRules,
  localAssetsRules,
  groupOptions,
  previewImages,
  handleRemoveFile,
  handleFileChange,
  handleDeletePreviewImage,
  handleReplacePreviewImage,
  handleUpload
} = useAssetsEdit(props);

const resourceTypeOptions = computed(() => {
  const labelValueMap = [
    { label: "图片", value: ResourceTypeEnum.image },
    { label: "视频", value: ResourceTypeEnum.video }

  ];

  return props.availableResourceType
    .map((item) => {
      return labelValueMap.find((labelValue) => labelValue.value === item);
    })
    .filter((item) => Boolean(item)) as { label: string; value: ResourceTypeEnum }[];
});

const handleCheck = async () => {
  const res = await handleUpload();
  if (res?.success) {
    ElMessage.success(res.message || "操作成功");
  }

  confirm();
};
const onFileChange = (value: File[]) => {
  handleFileChange(value);
};

const handleCancel = () => {
  cancel();
};
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
:deep(.el-input) {
  height: 32px;
}
:deep(.el-select) {
  width: 100%;

  .el-select__popper {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    margin-top: 4px !important;
  }
}
:deep(.custom-select-dropdown) {
  background-color: #18181c !important;
  border: 1px solid #434343 !important;
  width: 100% !important;
}

:deep(.el-form-item__label) {
  width: 80px;
}
.upload-dialog-content {
  position: relative;
  z-index: 1;

  padding: 20px;
  border-radius: 8px;

  :deep(.el-form) {
    .el-form-item {
      .el-form-item__label {
        color: #fff;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;

  .el-button {
    border-color: transparent;
    padding: 7px 15px;
    text-align: center;
    color: #ffffff;
    border-radius: 0;

    &.cancel {
      background-color: #3d404c;
      border-color: #3d404c;
    }

    &.check {
      border-color: var(--sw-theme-color);
      background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    }
  }
}
</style>
