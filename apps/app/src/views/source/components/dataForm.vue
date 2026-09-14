<template>
  <div class="data-form">
    <el-form ref="validateForm" :model="formData" :rules="formRules" label-width="120px">
      <el-form-item prop="type" label="类型:">
        <el-select
          :disabled="row && !!row.id"
          @change="changeFormType"
          v-model="formData.type"
          popper-class="sw-select-dropdown"
        >
          <el-option
            v-for="item in typeOptions"
            :value="item.value"
            :label="item.label"
            :key="item.value"
            :disabled="item.disabled"
          />
        </el-select>
      </el-form-item>
      <el-form-item prop="name" label="数据源名称:">
        <el-input v-model="formData.name" placeholder="请输入数据源名称" />
      </el-form-item>
      <el-form-item label="描述:">
        <el-input
          :autosize="{ minRows: 6, maxRows: 10 }"
          v-model="formData.description"
          placeholder="请输入描述"
          type="textarea"
        />
      </el-form-item>
      <!-- localForm表单 -->
      <localForm
        :onChange="onChange"
        :form-data="formData"
        v-if="menuActive.value === DataSourceType.LOCAL"
        :option="option"
      />
      <!-- mysqlForm表单 -->
      <template v-if="menuActive.value === DataSourceType.DB">
        <el-form-item label="链接地址:" prop="url">
          <el-input v-model="formData.url" placeholder="请输入连接地址" />
        </el-form-item>
        <el-form-item label="用户名:" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名称" />
        </el-form-item>
        <el-form-item label="密码:" prop="password">
          <el-input type="password" show-password v-model="formData.password" placeholder="请输入密码" />
        </el-form-item>
      </template>

      <!-- api表单 -->
      <el-form-item
        v-if="
          (menuActive.value === DataSourceType.API || menuActive.value === DataSourceType.WEBSOCKET) &&
          formData.type !== 'bimPropertyData'
        "
        label="Base URL:"
        prop="baseUrl"
      >
        <el-input v-model="formData.baseUrl" :placeholder="cPlaceholder" />
      </el-form-item>
      <el-form-item
        v-if="menuActive.value === DataSourceType.API && formData.type !== 'bimPropertyData'"
        label="Swagger 地址:"
      >
        <el-input v-model="formData.swaggerUrl" placeholder="http://hostname[:port]/v2/api-docs" />
      </el-form-item>

      <template v-if="formData.type === 'bimPropertyData'">
        <el-form-item label="上传文件" prop="jsonFile">
          <sourceUpload :option="jsonFileOptions" :model-value="formData.fileName" @change="handleJsonFileChange" />
        </el-form-item>

        <el-form-item prop="charsetName" label="编码格式:">
          <el-radio-group v-model="formData.charsetName">
            <el-radio value="UTF-8">UTF-8</el-radio>
            <el-radio value="GBK">GBK</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- TCPUDP表单 -->
      <template v-if="menuActive.value === DataSourceType.TCPUDP">
        <el-form-item prop="charsetName" label="编码格式:">
          <el-radio-group v-model="formData.charsetName">
            <el-radio value="UTF-8">UTF-8</el-radio>
            <el-radio value="GBK">GBK</el-radio>
            <el-radio value="HEX">HEX</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="IP地址" prop="desIp">
          <el-input v-model="formData.desIp" placeholder="请输入对方ip" />
        </el-form-item>
        <el-form-item label="IP端口" prop="desPort">
          <el-input v-model="formData.desPort" placeholder="端口范围：1-65535" />
        </el-form-item>

        <el-form-item label="本地端口" prop="localPort" v-if="formData.type === '2'">
          <el-input v-model="formData.localPort" placeholder="端口范围：1-65535" />
        </el-form-item>
      </template>

      <el-form-item prop="group" label="分组:">
        <el-select v-model="formData.group" popper-class="sw-select-dropdown">
          <el-option v-for="item in groupDataOptions" :value="item.value" :label="item.label" :key="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <div class="data-form-footer">
      <span @click="cancel">取消</span>
      <span @click="confirm" class="button-primary">确定</span>
      <span @click="checkIsConnect" v-if="menuActive.value === DataSourceType.DB">测试链接</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { Ref } from "vue";
import { inject, provide, ref, shallowRef, watch } from "vue";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import type { DbItem } from "@/model/DataModel";
import { useForm } from "@/hooks/useForm";

import { DataSourceType } from "../type";
import { dataFormKey } from "./constant";
import localForm from "./localForm.vue";
import sourceUpload from "./sourceUpload.vue";
import { useDataForm } from "./useDataForm";

// import { toRef, toRefs } from "vue"
const { confirm, cancel } = inject(dialogInjectionKey)!;
interface Props {
  groupDataOptions: Array<{ value: string; label: string }>;
  menuActive: Ref<DataSourceType>;
  row: DbItem;
  group: number | "";
  dbIsConnect: (info: any) => Promise<boolean>;
  typeOptions: Array<{ value: string; label: string; disabled?: boolean; example?: string }>;
}
const props = defineProps<Props>();
const { formData, cPlaceholder, option, initFormData, handleChangeFormType, onChange } = useDataForm(props);

const jsonFileOptions = ref({
  fileName: "",
  type: "json",
  url: "",
  name: ""
});

const handleJsonFileChange = (val: any) => {
  onChange("jsonFile", val);
};

const changeFormType = (val: string) => {
  handleChangeFormType(val);
};
const checkIsConnect = async () => {
  const data = {
    url: formData.value.url,
    username: formData.value.username,
    password: formData.value.password,
    type: formData.value.type
  };
  await props.dbIsConnect(data);
};

watch(
  () => props.row,
  async (val) => {
    initFormData(val);
  },
  {
    immediate: true
  }
);

const validateFile = (rule: any, value: any, callback: any) => {
  if (Object.keys(value).length === 0) {
    callback(new Error("请选择上传文件"));
  } else {
    callback();
  }
};

const validateUrl = (rule: any, value: any, callback: any) => {
  const pattern = /^[A-Za-z0-9_@.\-:/]+$/;
  if (!value || value === "" || !pattern.test(value)) {
    callback(new Error("连接地址不包含中文、特殊字符"));
  } else {
    callback();
  }
};

const validatePassword = (rule: any, value: any, callback: any) => {
  const pattern = /^[^\u4e00-\u9fa5]+$/;
  if (!value || value === "") {
    callback(new Error("请输入密码"));
  }
  if (!pattern.test(value)) {
    callback(new Error("密码不包含中文字符"));
  } else {
    callback();
  }
};

const formRules = shallowRef({
  name: [
    { required: true, message: "请输入名称", trigger: ["blur", "change"] },
    { required: true, message: "长度要在20字符内", max: 20, trigger: ["blur", "change"] }
  ],
  charsetName: [{ required: true, message: "请选择编码格式", trigger: ["blur", "change"] }],
  fileName: [{ validator: validateFile, trigger: ["blur", "change"] }],
  baseUrl: [{ required: true, message: "请输入Base URL", trigger: ["blur", "change"] }],
  desIp: [{ required: true, message: "请输入对方ip", trigger: ["blur", "change"] }],
  desPort: [{ required: true, message: "请输入对方端口", trigger: ["blur", "change"] }],
  url: [{ required: true, validator: validateUrl, trigger: ["blur", "change"] }],
  username: [{ required: true, message: "请输入用户名", trigger: ["blur", "change"] }],
  password: [{ required: true, validator: validatePassword, trigger: ["blur", "change"] }]
});
const { validateForm, checkValidate } = useForm({
  loginForm: formData,
  rules: formRules
});
provide(dataFormKey, {
  FormInstance: validateForm
});

const validate = async () => {
  const res = await checkValidate();
  const uuid = props.groupDataOptions.find((v) => v.value === String(formData.value.group))?.value;
  return {
    ...formData.value,
    uuid,
    success: res
  };
};
defineExpose({
  validate
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.data-form {
  @include common-element-style(".el-input__wrapper");
  @include common-element-style(".el-select__wrapper");
  @include common-element-style(".el-textarea__inner");
  @include radio-style();
  :deep(.el-form-item__label) {
    color: #fff;
  }
  .data-form-footer {
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
      border-color: var(--sw-theme-color);
      background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    }
  }
}
</style>
