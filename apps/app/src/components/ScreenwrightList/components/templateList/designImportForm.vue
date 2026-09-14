<template>
  <div class="design-import-form">
    <el-form ref="formRef" :model="formData" label-width="120" :rules="formRules">
      <el-form-item label="类型:" prop="type">
        <el-select
          popper-class="sw-select-dropdown"
          class="sw-select"
          v-model="formData.type"
          placeholder="请选择类型"
        >
          <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="大屏名称:" prop="name">
        <el-input v-model="formData.name" placeholder="请输入大屏名称" size="small" clearable :max="20" />
      </el-form-item>

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

      <el-form-item>
        <template #label>
          <span
            >Figma链接
            <el-tooltip class="item" effect="dark" placement="left">
              <Icon type="QuestionFilled" size="14" style="position: relative; top: 3px" />
              <template #content>
                <p>链接示例: https://www.figma.com/design/fileId/fileName?node-id=1-3 需要包含 fileId 和 node-id</p>
                <p>填写链接，点击加载Figma页面，目前仅支持选择单个页面</p>
              </template>
            </el-tooltip>
          </span>
        </template>
        <el-input
          v-model="formData.link"
          type="textarea"
          :rows="1"
          :autosize="{ minRows: 5, maxRows: 10 }"
          resize="none"
          placeholder="请输入Figma链接"
        />
      </el-form-item>
      <el-form-item label="">
        <div class="example-figma-tip">
          目前仅支持选择单个页面
          <strong>{{ figmaConfig ? "【已选中：" + figmaConfig?.name + "】" : "未选择渲染的页面" }}</strong>
        </div>
      </el-form-item>
      <el-form-item label="Figma页面：">
        <div class="example-view flex flex-wrap flex-center fs-12" v-loading="loading">
          <div
            :class="['example-view-item', figmaConfig && figmaConfig.id === item.id ? 'selected' : '']"
            v-for="item in thumbnailList"
            :key="item.id"
            @click.stop="handleSelectFrame(item)"
          >
            <img :src="thumbnailImageMap[item.id]" alt="" v-if="thumbnailImageMap[item.id]" />
            <span :data-id="item.id">{{ item.name }}</span>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <div class="form-footer">
      <el-button @click="cancel">取消</el-button>
      <el-button type="primary" @click="onDefine">确 定</el-button>
      <el-button @click="handleReloadFile">加载Figma页面</el-button>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { inject, ref, shallowRef } from "vue";

import type { FormInstance } from "element-plus";
import { ElMessage } from "element-plus";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import Icon from "@/components/Icon/index.vue";
import type { MenuItem } from "@/layout/Siderbar/components/config/menuConfig";

import { fetchFigmaFileNodes, fetchImageUrls, parseFigmaData } from "./components/utils";

interface Props {
  options: MenuItem[];
}
defineProps<Props>();
const formData = ref<Record<string, any>>({
  type: "figma",
  fileName: "",
  figma: {},
  name: "",
  groupId: "",
  link: ""
});
const figmaConfig = ref({
  id: "",
  name: ""
});
const { confirm, cancel } = inject(dialogInjectionKey)!;
const thumbnailList = ref<any[]>([]);
const thumbnailImageMap = ref<Record<string, any>>({});
const loading = ref(false);
const formRef = ref<FormInstance>();
const formRules = shallowRef({
  type: [{ required: true, message: "选择类型", trigger: ["blur", "change"] }],
  name: [{ required: true, message: "长度要在20字符内", max: 20, trigger: ["blur", "change"] }]
});
const typeOptions = ref([
  { label: "Figma", value: "figma" },
  { label: "PSD文件", value: "psd" }
]);

const onDefine = async () => {
  // confirm()
  if (!formRef.value) return;
  const { type, figma } = formData.value;
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      if (type === "figma" && !figma.option) {
        ElMessage.warning("未选择Figma画框！");
        return;
      }
      console.log("submit!");
      confirm();
      // handleImportDesign(formData.value)
    } else {
      console.log("error submit!", fields);
    }
  });
};

const handleReloadFile = async () => {
  const { link } = formData.value;
  if (!link) {
    ElMessage.error("请输入Figma链接");
    return;
  }
  let url;
  try {
    url = new URL(link);
  } catch (e) {
    console.log(e);
    ElMessage.error("Figma链接格式有误，解析异常！");
    return;
  }
  if (!url) return;
  const pathParts = url.pathname.split("/");
  const fileId = pathParts[2]; // 假设路径格式固定为 /design/<fileId>/
  const params = new URLSearchParams(url.search);
  const nodeId = params.get("node-id");
  if (!fileId || !nodeId) {
    ElMessage.error("Figma链接格式有误，需包含 fileId 和 node-id");
    return;
  }
  const figmaData = await fetchFigmaFileNodes(fileId, { ids: nodeId }); // geometry: 'paths'
  const documentData = figmaData.nodes[nodeId.replace("-", ":")]?.document?.children || [];
  let resultData = documentData
    .filter((a: any) => !("visible" in a && a.visible === false))
    .map((item: any) => {
      // thumbnailObj[item.id] = item.id;
      const { id, name, children, absoluteBoundingBox, backgroundColor } = item;
      return {
        fileId,
        id,
        name,
        children,
        position: absoluteBoundingBox,
        backgroundColor: backgroundColor
          ? `rgba(${backgroundColor.r * 255}, ${backgroundColor.g * 255}, ${backgroundColor.b * 255}, ${
              backgroundColor.a
            })`
          : "transparent"
      };
    });
  loading.value = true;
  const images = await fetchImageUrls(fileId, {
    ids: resultData
      .slice(0, 9)
      .map((item: any) => item.id)
      .join(","),
    format: "jpg",
    scale: 0.025
  });
  thumbnailImageMap.value = images || {};
  thumbnailList.value = resultData;
  resultData = null;
  loading.value = false;
};
const handleSelectFrame = (info: any) => {
  if (figmaConfig.value && figmaConfig.value.id === info.id) return;
  const params = parseFigmaData(info);
  figmaConfig.value = {
    id: info.id,
    name: info.name
  };
  formData.value.figma = params;
};

defineExpose({
  formData
});
</script>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
.design-import-form {
  padding: 10px 20px;

  :deep(.el-form-item__label) {
    color: #fff;
  }
  :deep(.el-form-item__error) {
    padding-top: 5px;
  }
  @include common-element-style(".el-select__wrapper");
  @include common-element-style(".el-input__wrapper");
  :deep(.el-textarea) {
    padding: 1px 1px;
    border-radius: 10px;
    // border: 1px solid #333543;
    width: 100%;
    // background-color: rgba(26, 30, 39, 0.5);
    .el-textarea__inner {
      background-color: #0f1014 !important;
      color: #859094 !important;
      box-shadow: none !important;
      height: 102px !important;
      min-width: 102px !important;
      &:hover {
        box-shadow: 0 0 0 1px var(--sw-theme-color) inset !important;
      }
    }
  }
  .example-view {
    width: 100%;
    height: 300px;
    padding: 5px 5px;
    background-color: #0f1014;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0px;
      height: 0px;
    }
  }
  .example-view-item {
    cursor: pointer;
    width: calc(100% / 3 - 40px);
    height: 76px;
    line-height: 76px;
    text-align: center;
    background-color: #181b24;
    margin: 5px 10px;
    padding: 5px 5px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    position: relative;
    color: #ffffff;
    border: 1px solid #181b24;
    position: relative;
    &:hover {
      transform: scale(1.05);
    }
    &.selected::after {
      content: "已选中";
      position: absolute;
      top: 0;
      right: 0;
      background: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color));
      height: 16px;
      line-height: 16px;
      padding: 0px 5px;
      transform: translate(6px, 10px) rotate(45deg);
    }
    span {
      text-shadow: 1px 1px black;
      position: relative;
      z-index: 1;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      left: 0;
      top: 0;
    }
  }
  .example-figma-tip {
    color: #f56c6c;
    font-weight: 600;
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    background-image: linear-gradient(90deg, var(--sw-theme-color) 0px, var(--sw-theme-color) 100%);
  }
  .form-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    .el-button {
      color: #ffffff;
      background-color: #3d404c;
      border-color: #3d404c;
      &.el-button--primary {
        border-color: var(--sw-theme-color);
        background-image: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color));
      }
    }
  }
}
</style>
