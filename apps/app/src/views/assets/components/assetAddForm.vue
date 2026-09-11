<template>
  <div class="asset-add-form" v-loading="loading">
    <el-form
      ref="validateForm"
      label-width="100px"
      :model="formData"
      :rules="isArray(formData.file) && formData.file.length === 1 ? formRules : formFilesRules"
    >
      <el-form-item label="类型:" prop="resourceType">
        <el-radio-group :disabled="resourceTypeDisabled" v-model="formData.resourceType" @change="changeResourceType">
          <el-radio
            v-for="materialTypeItem in radioMaterialTypeOptions"
            :key="materialTypeItem.value"
            :label="materialTypeItem.value"
            >{{ materialTypeItem.label }}</el-radio
          >
        </el-radio-group>
      </el-form-item>
      <el-form-item label="上传文件:" prop="file">
        <asset-upload
          fileUrl=""
          :multiple="multiple"
          :previewImages="previewImages"
          :resourceType="getAccept"
          @change="handleFileChange"
          @delete="handleDeletePreviewImage"
          @replace="handleReplacePreviewImage"
        />
        <!-- <assetUpload @change="changeUploadFileUrl" v-model="formData.file" :accept="getAccept" :multiple="multiple" /> -->
      </el-form-item>
      <el-form-item label="上传到:" prop="groupId">
        <el-select
          popper-class="sw-select-dropdown"
          style="width: 100%"
          v-model="formData.groupId"
          placeholder="请选择"
          clearable
        >
          <el-option v-for="item in groupOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="名称:" prop="name" v-if="isArray(formData.file) && formData.file.length === 1">
        <el-input placeholder="请输入名称" v-model="formData.name" autocomplete="off" maxlength="30" show-word-limit />
      </el-form-item>
    </el-form>
    <div class="asset-add-footer">
      <span @click="cancel">取消</span>
      <span class="button-primary" @click="handleConfirm">确定</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref, shallowRef } from "vue";
import { computed } from "vue";

import { isArray, pick } from "lodash-es";

import { getMinioScene } from "@/api/assets";
import { dialogInjectionKey } from "@/components/Dialog/constant";
import type { uploadFileReq } from "@/model/Assets";
import type { assetItem } from "@/model/Assets";
import { setMinioUrl } from "@/utils/config";
import { batchCompressPic } from "@/utils/utils";
// import assetUpload from "./assetUpload.vue";
import AssetUpload from "@/views/build/components/buildTabs/assetsEditFrom/assetsUpload.vue";
import { FileTypeEnum, ResourceTypeEnum } from "@/views/build/components/buildTabs/assetsEditFrom/type";
import { useForm } from "@/hooks/useForm";

import { iconTypeOptions, radioOptions } from "../baseSetting";
// import { imgUploadAccept, mapUploadAccept, modalUploadAccept, videoUploadAccept } from "../emum";

const { confirm, cancel } = inject(dialogInjectionKey)!;

interface Props {
  item?: assetItem;
  fileType: FileTypeEnum;
  groupId: string | number;
  groupOptions: Array<{ label: string; value: string }>;
}
const props = defineProps<Props>();
const loading = ref(false);
const multiple = ref(true);

const radioMaterialTypeOptions = computed(() => {
  return props.fileType === FileTypeEnum.personalPageAssets ? radioOptions : iconTypeOptions;
});
const previewImages = ref<Array<{ file: File | null; previewUrl: string; title: string }>>([]);

const formData = ref<uploadFileReq>({
  name: "",
  resourceType: ResourceTypeEnum.image,
  fileType: FileTypeEnum.personalPageAssets,
  groupId: "",
  file: null,
  coverFile: null,
  coverFileUrl: null,
  fileUrl: null,
  applicationCode: "BI"
});
const handleDeletePreviewImage = (index: number) => {
  previewImages.value.splice(index, 1);
  if (Array.isArray(formData.value.file)) {
    formData.value.file.splice(index, 1);
  }
};
// 替换单个预览图片
const handleReplacePreviewImage = (index: number, file: File) => {
  if (index >= 0 && index < previewImages.value.length) {
    // 释放旧的 URL
    URL.revokeObjectURL(previewImages.value[index].previewUrl);

    // 创建新的预览
    const previewUrl = URL.createObjectURL(file);
    previewImages.value[index] = {
      file: file,
      previewUrl: previewUrl,
      title: file.name
    };

    // 更新 form 中的文件
    if (Array.isArray(formData.value.file)) {
      formData.value.file[index] = file;
    }
  }
};
const handleFileChange = async (fileArray: File[]) => {
  console.log(fileArray, formData.value, "value");
  if (fileArray && fileArray.length > 0) {
    // 清空之前的数据
    previewImages.value = [];
    formData.value.file = [];

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      let tranFormFile = file;
      // 存储文件到表单
      if (Array.isArray(formData.value.file)) {
        if (formData.value.resourceType == ResourceTypeEnum.image) {
          tranFormFile = await batchCompressPic(file as File, 4);
        }
        formData.value.file.push(tranFormFile);
      }

      // 如果是第一个文件且名称为空,使用其名称作为资产名称
      if (i === 0 && !formData.value.name) {
        formData.value.name = file.name.split(".")[0];
      }

      // 创建预览URL并存储
      const previewUrl = URL.createObjectURL(file);
      previewImages.value.push({
        file: tranFormFile,
        previewUrl: previewUrl,
        title: tranFormFile.name
      });
    }
  }
};

const getAccept = computed(() => {
  const mapAccept: Record<string, any> = {
    "0": ResourceTypeEnum.threeModel,
    "1": ResourceTypeEnum.image,
    "2": ResourceTypeEnum.video,
    "3": ResourceTypeEnum.materialTexture
  };
  return formData.value.resourceType ? mapAccept[formData.value.resourceType] : ResourceTypeEnum.threeModel;
});

const resourceTypeDisabled = computed(() => {
  return !!props.item?.id;
});

const formRules = shallowRef({
  resourceType: [{ required: true, message: "请选择素材类型", trigger: "blur" }],
  file: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value === null || value === undefined) {
          callback(new Error("请选择上传文件"));
          return;
        }
        if (isArray(value)) {
          if (value.length > 0) {
            callback();
          } else {
            callback(new Error("请选择上传文件"));
          }
        } else if (typeof value === "object" && Object.keys(value).length > 0) {
          callback();
        } else {
          callback(new Error("请选择上传文件"));
        }
      }
    }
  ],
  name: [{ required: true, message: "请输入名称", trigger: "blur" }]
});

const formFilesRules = shallowRef({
  resourceType: [{ required: true, message: "请选择素材类型", trigger: "blur" }],
  file: [
    {
      required: true,
      validator: (rule: any, value: any, callback: any) => {
        if (!value || value === null || value === undefined) {
          callback(new Error("请选择上传文件"));
          return;
        }
        if (isArray(value)) {
          if (value.length > 0) {
            callback();
          } else {
            callback(new Error("请选择上传文件"));
          }
        } else if (typeof value === "object" && Object.keys(value).length > 0) {
          callback();
        } else {
          callback(new Error("请选择上传文件"));
        }
      }
    }
  ],
  name: [{ required: false, message: "请输入名称", trigger: "blur" }]
});

const { validateForm, checkValidate } = useForm({
  loginForm: formData,
  rules: isArray(formData.value.file) && formData.value.file.length === 1 ? formRules : formFilesRules
});

// const changeUploadFileUrl = (file: Array<File>) => {
//   if (file === null) {
//     changeResourceType();
//     return;
//   }
//   // console.log(file);
//   formData.value.file = file;
//   formData.value.name = file.length > 1 ? "" : file[0].name.substring(0, 30);
//   validateForm.value?.validateField("file");
//   if (isArray(file) && file.length === 1) {
//     validateForm.value?.validateField("name");
//   }
// };

const changeResourceType = () => {
  formData.value.file = null;
  formData.value.coverFile = null;
  formData.value.name = "";
};

const handleConfirm = () => {
  confirm();
};
const validate = async () => {
  const res = await checkValidate();
  return {
    success: res,
    data: formData.value
  };
};
const initFormData = async (item: assetItem) => {
  if (!item.id) {
    return;
  }
  loading.value = true;
  const res = await getMinioScene(item.id);
  multiple.value = false;
  if (res.success) {
    const keys = Object.keys(formData.value);
    formData.value = pick(res.result, keys) as uploadFileReq;
    formData.value.applicationCode = "BI";
    formData.value.groupId = props.groupId;
    formData.value.resourceType = res.result.resourceType;
    formData.value.fileUrl = setMinioUrl(res.result.url || "");
    formData.value.coverFileUrl = setMinioUrl(res.result.cover || "");
    previewImages.value = [
      {
        file: null,
        previewUrl: formData.value.fileUrl || "",
        title: formData.value.name
      }
    ];
    formData.value.file = [
      {
        name: formData.value.name,
        percentage: 100,
        status: "success",
        uid: formData.value.id ?? Math.random(),
        url: formData.value.fileUrl
      } as any
    ] as any;

    formData.value.coverFile = {
      name: formData.value.name,
      percentage: 100,
      uid: formData.value.id ?? Math.random(),
      status: "success",
      url: formData.value.coverFileUrl
    };
  }
  loading.value = false;
};

onMounted(async () => {
  if (props.item && props.item.id) {
    initFormData(props.item);
  } else {
    formData.value.resourceType = ResourceTypeEnum.image;
    const isHasGroupId = props.groupOptions.some((item) => `${item.value}` === `${props.groupId}`);
    formData.value.groupId = isHasGroupId ? props.groupId : "";
  }
});

defineExpose({
  validate
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.asset-add-form {
  @include common-element-style(".el-select__wrapper");
  @include common-element-style(".el-input__wrapper");
  @include radio-style();
  :deep(.el-input__wrapper) {
    .el-input__suffix {
      .el-input__count {
        .el-input__count-inner {
          background: transparent;
        }
      }
    }
  }
  :deep(.el-form-item__label) {
    color: #fff;
  }
}
.asset-add-footer {
  text-align: right;
  padding: 20px 0px 10px 0px;
  span {
    color: #ffffff;
    cursor: pointer;
    padding: 5px 10px;
    margin: 0 5px;
    border-color: #3d404c;
    background-color: #3d404c;
  }
  .button-primary {
    border-color: #642cff;
    background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
  }
}
</style>
