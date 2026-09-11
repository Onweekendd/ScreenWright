<template>
  <el-form-item prop="charsetName" label="编码格式:">
    <el-radio-group :model-value="formData.charsetName" @change="handleCharsetChange">
      <el-radio value="UTF-8">UTF-8</el-radio>
      <el-radio value="GBK">GBK</el-radio>
    </el-radio-group>
  </el-form-item>
  <el-form-item prop="fileName">
    <template #label>
      <span style="color: #f56c6c">*</span>
      <span>上传文件</span>
    </template>
    <sourceUpload :option="option" :model-value="formData.fileName" @change="handleFileNameChange" />
  </el-form-item>
</template>
<script setup lang="ts">
import { inject } from "vue";

import type { DataForm } from "../type";
import { dataFormKey } from "./constant";
import sourceUpload from "./sourceUpload.vue";

const { FormInstance } = inject(dataFormKey)!;
interface Option {
  fileName?: string;
  type?: string;
  url?: string;
  name?: string;
}
interface Props {
  option: Option;
  formData: any;
  onChange: (key: keyof DataForm, value: any, cb?: () => void) => void;
}

const props = defineProps<Props>();
// const formData = ref({
//   charsetName: "UTF-8",
//   fileName: {}
// })
// const emit = defineEmits(["update:formData"])

const handleCharsetChange = (val: string | number | boolean | undefined) => {
  props.onChange("charsetName", val);
};
const handleFileNameChange = (val: any) => {
  props.onChange("fileName", val);
  FormInstance.value?.validateField("fileName");
};
</script>
