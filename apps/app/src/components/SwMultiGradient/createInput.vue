<template>
  <div class="create-dir">
    <el-form ref="validateForm" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item prop="name">
        <el-input :autofocus="true" v-model="formData.name" placeholder="请输入渐变色值" @keyup.enter="validate" />
      </el-form-item>
    </el-form>
    <div class="create-dir-footer">
      <el-button type="primary" @click="confirm">确定</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref, shallowRef } from "vue";

import { ElMessage } from "element-plus";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import { useForm } from "@/hooks/useForm";

const { confirm } = inject(dialogInjectionKey)!;

const formData = ref({
  name: ""
});
const formRules = shallowRef({
  name: [{ required: true, message: "请输入渐变色值", trigger: ["blur", "change"] }]
});
const { validateForm, checkValidate } = useForm({
  loginForm: formData,
  rules: formRules
});

const splitByTopLevelComma = (value: string): string[] => {
  const result: string[] = [];
  let start = 0;
  let depth = 0;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth < 0) {
        return [];
      }
      continue;
    }
    if (char === "," && depth === 0) {
      result.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }

  if (depth !== 0) {
    return [];
  }

  result.push(value.slice(start).trim());
  return result.filter(Boolean);
};

const isValidGradientInput = (value: string): boolean => {
  const text = value.trim();
  if (!text) {
    return false;
  }

  const matched = text.match(/^background\s*:\s*([\s\S]+);$/i);
  if (!matched) {
    return false;
  }

  const gradientBody = matched[1].trim();
  const layers = splitByTopLevelComma(gradientBody);
  if (!layers.length) {
    return false;
  }

  return layers.every((layer) => /^linear-gradient\s*\([\s\S]+\)$/i.test(layer));
};

const validate = async () => {
  const res = await checkValidate();

  if (res) {
    const inputValue = formData.value.name;
    if (!isValidGradientInput(inputValue)) {
      ElMessage.warning("请输入合法的渐变色，格式如：background: linear-gradient(...), linear-gradient(...);");
      return {
        success: false,
        name: ""
      };
    }

    return {
      name: inputValue,
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
