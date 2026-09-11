<template>
  <div class="template-add-form">
    <el-form ref="validateForm" label-width="100px" :model="formData" :rules="formRules">
      <el-form-item label="分组:">
        <el-select
          popper-class="sw-select-dropdown"
          class="sw-select"
          v-model="formData.groupId"
          placeholder="请选择分组"
        >
          <el-option v-for="item in options" :key="item.id" :label="item.label" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="大屏名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入大屏名称" @keyup.enter="confirm" />
      </el-form-item>
    </el-form>
    <div class="template-add-form-footer">
      <el-button type="default" @click="cancel">取消</el-button>
      <el-button type="primary" @click="confirm" :loading="loading">确定</el-button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref, shallowRef } from "vue";

import { isUndefined } from "lodash-es";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import type { MenuItem } from "@/layout/Siderbar/components/config/menuConfig";
import { useForm } from "@/hooks/useForm";

interface FormProps {
  name: string;
  groupId: number;
}

interface Props {
  options: MenuItem[];
  defaultFormData?: FormProps;
}

const props = defineProps<Props>();

const { confirm, cancel } = inject(dialogInjectionKey)!;
const loading = ref(false);

const formData = ref<FormProps>({
  name: "",
  groupId: 0
});
const formRules = shallowRef({
  name: [{ required: true, message: "请输入大屏名称，且字符长度不超过20", max: 20, trigger: ["blur", "change"] }]
});
const { validateForm, checkValidate } = useForm({
  loginForm: formData,
  rules: formRules
});
const setLoading = (value: boolean) => {
  loading.value = value;
};

const validate = async () => {
  const res = await checkValidate();
  if (res) {
    const uuid = props.options.find((v) => v.id === formData.value.groupId)?.uuid;
    return {
      name: formData.value.name,
      groupId: formData.value.groupId,
      uuid,
      success: res
    };
  }
  return {
    success: false,
    name: ""
  };
};
const getGroupId = (groupId: any) => {
  if (isUndefined(groupId) || groupId === null || groupId === 0) {
    return props.options[0].id as number;
  }
  const isExist = props.options.some((item) => `${item.id}` === `${groupId}`);
  if (!isExist) {
    return "";
  }
  return groupId;
};
const setDefaultValue = () => {
  if (props.defaultFormData) {
    formData.value.name = props.defaultFormData.name;
    formData.value.groupId = getGroupId(props.defaultFormData.groupId);
  } else {
    formData.value.name = "";
    formData.value.groupId = props.options[0].id as number;
  }
};

onMounted(() => {
  setDefaultValue();
});
defineExpose({
  validate,
  setLoading
});
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.template-add-form {
  :deep(.el-form-item__label) {
    color: #fff;
  }
  :deep(.el-form-item__error) {
    padding-top: 5px;
  }
  @include common-element-style(".el-select__wrapper");
  @include common-element-style(".el-input__wrapper");
}
.template-add-form-footer {
  text-align: center;
  padding: 10px 0px 20px 20px;
  .el-button--primary {
    font-size: 14px;
    color: #fff;
    border: none;
    border-radius: 2px;
    background: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    margin-left: 10px;
  }
  .el-button--default {
    background-color: #3d404c;
    font-size: 14px;
    color: #fff;
    border: none;
    border-radius: 2px;
  }
}
</style>
