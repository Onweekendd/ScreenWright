<template>
  <div class="create-dir">
    <el-form ref="validateForm" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item prop="name" label="分组名称:">
        <el-input :autofocus="true" v-model="formData.name" placeholder="请输入分组名称" @keyup.enter="validate" />
      </el-form-item>
    </el-form>
    <div class="create-dir-footer">
      <el-button type="primary" @click="confirm">确定</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, shallowRef } from "vue";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import { useForm } from "@/hooks/useForm";

const { confirm } = inject(dialogInjectionKey)!;

const formData = ref({
  name: ""
});
const formRules = shallowRef({
  name: [
    { required: true, message: "请输入名称", trigger: ["blur", "change"] },
    { required: true, message: "长度要在20字符内", max: 20, trigger: ["blur", "change"] }
  ]
});
const { validateForm, checkValidate } = useForm({
  loginForm: formData,
  rules: formRules
});

const validate = async () => {
  const res = await checkValidate();
  if (res) {
    return {
      name: formData.value.name,
      success: res
    };
  }
  return {
    success: false,
    name: ""
  };
};
defineExpose({
  validate
});
</script>
<style lang="scss" scoped>
.create-dir {
  :deep(.el-form-item__label) {
    color: #fff;
  }
  :deep(.el-form-item__error) {
    padding-top: 5px;
  }
  :deep(.el-input__wrapper) {
    background-color: #0f1014 !important;
    color: #859094 !important;
    border-color: #282e3a !important;
    box-shadow: none !important;
    &:hover {
      box-shadow: 0 0 0 1px var(--sw-theme-color) inset !important;
    }
  }
}
.create-dir-footer {
  text-align: right;
  padding: 10px 0px 20px 20px;
  .el-button--primary {
    font-size: 14px;
    color: #fff;
    border: none;
    border-radius: 2px;
    background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    margin-left: 10px;
  }
}
</style>
