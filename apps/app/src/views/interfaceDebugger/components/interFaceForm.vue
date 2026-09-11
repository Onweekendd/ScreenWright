<template>
  <el-form class="inter-face-form" ref="validateForm" label-width="100px" :model="formData" :rules="formRules">
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
    <el-form-item label="名称" prop="name">
      <el-input v-model="formData.name" placeholder="请输入名称" />
    </el-form-item>
    <el-form-item label="场景链接" prop="path">
      <el-input v-model="formData.path" placeholder="请输入场景链接" />
    </el-form-item>
    <el-form-item label="渲染类型">
      <el-radio-group v-model="formData.renderType">
        <el-radio label="端渲染" value="scene" />
        <el-radio label="流渲染" value="ue" />
      </el-radio-group>
    </el-form-item>
  </el-form>
  <div class="template-add-form-footer">
    <el-button type="default" @click="cancel">取消</el-button>
    <el-button type="primary" @click="confirm">确定</el-button>
  </div>
</template>
<script setup lang="ts">
import { inject, onMounted, ref, shallowRef } from "vue";

import { pick } from "lodash-es";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import type { MenuItem } from "@/layout/Siderbar/components/config/menuConfig";
import type { SaveInterReq } from "@/model/InterfaceDebugger";
import { setMinioUrl } from "@/utils/config";
import { useForm } from "@/hooks/useForm";

const { confirm, cancel } = inject(dialogInjectionKey)!;
interface Props {
  options: MenuItem[];
  defaultFormData?: SaveInterReq;
}
const props = defineProps<Props>();

const formData = ref<SaveInterReq>({
  name: "",
  groupId: 0,
  path: "",
  renderType: "scene"
});
const validatorName = (rule: any, value: any, callback: any) => {
  if (value.length === 0) {
    callback(new Error("请输入名称"));
  }
  const hasSpace = /\s/;
  if (hasSpace.test(value)) {
    callback(new Error("名称不能包含空格"));
  }
  const isAllSpace = /^\s*$/;
  if (isAllSpace.test(value)) {
    callback(new Error("名称不能全为空格"));
  }
  if (value.length > 20) {
    callback(new Error("名称长度不能超过20"));
  } else {
    callback();
  }
};
const validatorPath = (rule: any, value: any, callback: any) => {
  if (value.length === 0) {
    callback(new Error("请输入场景链接"));
  }
  const hasSpace = /\s/;
  if (hasSpace.test(value)) {
    callback(new Error("名称不能包含空格"));
  }
  const isAllSpace = /^\s*$/;
  if (isAllSpace.test(value)) {
    callback(new Error("名称不能全为空格"));
  }
  const isRight = /^http[s]?:\/\/([\w-]+\.)+[\w-]+([\w\-\\.,@?^=%&:/~\\+#]*[\w\-\\@?^=%&/~\\+#])/;
  if (!isRight.test(value)) {
    callback(new Error("请输入正确的链接"));
  } else {
    callback();
  }
};

const formRules = shallowRef({
  name: [{ required: true, validator: validatorName, trigger: ["blur", "change"] }],
  path: [{ required: true, validator: validatorPath, trigger: ["blur", "change"] }]
});
const { validateForm, checkValidate } = useForm({
  loginForm: formData,
  rules: formRules
});
const initFormData = () => {
  if (props.options.length > 0) {
    formData.value.groupId = props.options[0].id;
  } else {
    formData.value.groupId = "";
  }
  if (props.defaultFormData && Object.keys(props.defaultFormData).length > 0) {
    formData.value = pick(props.defaultFormData, Object.keys(formData.value)) as SaveInterReq;
    if (props.defaultFormData.path) {
      formData.value.path = setMinioUrl(props.defaultFormData.path);
    }
    formData.value.id = props.defaultFormData.id;
  }
};

const validate = async () => {
  const res = await checkValidate();
  return {
    ...formData.value,
    success: res
  };
};
onMounted(() => {
  initFormData();
});
defineExpose({
  validate
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.inter-face-form {
  :deep(.el-form-item__label) {
    color: #fff;
  }
  :deep(.el-form-item__error) {
    padding-top: 5px;
  }
  @include common-element-style(".el-select__wrapper");
  @include common-element-style(".el-input__wrapper");
  @include radio-style();
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
