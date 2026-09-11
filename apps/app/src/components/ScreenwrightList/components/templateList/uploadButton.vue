<template>
  <div class="upload-button">
    <el-upload
      :class="{ 'not-allowed': disabled }"
      class="sw-upload"
      ref="uploadRef"
      action="#"
      :accept="accept"
      :auto-upload="false"
      :show-file-list="false"
      :disabled="disabled"
      :on-change="handleChange"
      v-permission="['import']"
    >
      <span>
        <i class="iconfont iconfont-cloudupload" style="vertical-align: middle; font-size: 16px" /> {{ title }}
      </span>
    </el-upload>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from "vue";

import type { UploadFile } from "element-plus";
import { ElMessage } from "element-plus";

import { importScreenPackage } from "@/api/version";
import { useNotify } from "@/hooks/useNotify";
import { useUserStore } from "@/store/modules/user";
import to from "@/utils/await-to-js";
import { roleEquitiesMessage } from "@/utils/utils";

import { useTemplateData } from "./useTemplateData";

const UPLOAD_PROGRESS_PERCENT_ID = "sw-upload-progress-percent";

const disabled = ref(false);
const accept = ref(".zip");
const title = ref("导入应用");
const { notify } = useNotify();
const { total } = useTemplateData();
const { roleEquitiesInfo } = useUserStore();

let progressNotify: ReturnType<typeof notify> | null = null;
let progressPercentEl: HTMLElement | null = null;

const buildProgressMessage = (fileName: string, percent: number) => {
  return `<div>
            <div style="color: #555c75; font-size: 16px; font-weight: 600">上传进度</div>
            ${fileName} 正在上传 <span id="${UPLOAD_PROGRESS_PERCENT_ID}" style="color: #555c75; font-weight: 600">${percent}%</span>，请稍等!
          </div>`;
};

const closeProgressNotify = () => {
  progressNotify?.close();
  progressNotify = null;
  progressPercentEl = null;
};

const openProgressNotify = async (fileName: string, percent: number) => {
  progressNotify = notify({
    message: buildProgressMessage(fileName, percent),
    duration: 0
  });
  await nextTick();
  progressPercentEl = document.getElementById(UPLOAD_PROGRESS_PERCENT_ID);
};

const updateProgressPercent = (percent: number) => {
  if (!progressPercentEl) {
    progressPercentEl = document.getElementById(UPLOAD_PROGRESS_PERCENT_ID);
  }
  if (progressPercentEl) {
    progressPercentEl.textContent = `${percent}%`;
  }
};

const showUploadProgressNotify = async (fileName: string, percent: number) => {
  if (!progressNotify) {
    await openProgressNotify(fileName, percent);
    return;
  }
  updateProgressPercent(percent);
};

const handleChange = async (file: UploadFile) => {
  if (disabled.value) {
    return;
  }
  if (total.value >= (roleEquitiesInfo?.largeScreenNum || 9)) {
    roleEquitiesMessage();
    return;
  }

  const { raw, name } = file;
  if (!raw) {
    console.error("上传文件为空");
    return;
  }

  const formData = new FormData();
  formData.append("multipartFile", raw);
  disabled.value = true;
  await showUploadProgressNotify(name, 0);

  const [error, res] = await to(
    importScreenPackage(formData, (event) => {
      if (event.total) {
        const percent = Math.min(100, Math.floor((event.loaded / event.total) * 100));
        updateProgressPercent(percent);
      }
    })
  );

  closeProgressNotify();
  disabled.value = false;

  if (error) {
    handleError(error);
    return;
  }
  handleResponse(res as ImportResponse, name);
};

type ImportResponse = {
  code: number;
  message: string;
  success: boolean;
};
const handleResponse = (res: ImportResponse, name: string) => {
  const { code, message, success } = res;
  if (success) {
    notify({
      message: `<div>
                <div style="color: #555c75; font-size: 16px; font-weight: 600">上传完成</div>
                ${name} 后台正在处理中。可离开当前页面 <br> 并在用户中心的导入记录中查看处理结果!
              </div>`
    });
  } else {
    handleErrorResponse(code, message);
  }
};

const handleError = (error: unknown) => {
  console.error("onError", error);
  ElMessage.error("上传失败，请重试");
};

const handleErrorResponse = (code: number, message: string) => {
  switch (code) {
    case 985:
      roleEquitiesMessage();
      break;
    case 901:
      ElMessage.warning(message);
      break;
    default:
      ElMessage.error(message);
      break;
  }
};
</script>

<style lang="scss" scoped>
@import "../style/uploadButton.scss";
</style>
