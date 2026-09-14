<template>
  <div class="local-upload">
    <el-upload
      :class="{ 'item-upload': true, 'not-allowed': disabled }"
      ref="uploadRef"
      drag
      accept=".csv,.xlsx,.xls,.geojson,.json"
      :headers="headers"
      action="#"
      :auto-upload="false"
      :data="uploadParams"
      :disabled="disabled"
      :show-file-list="false"
      :on-change="onChange"
      :on-error="onError"
      :on-progress="onProgress"
      :before-upload="onBeforeUpload"
    >
      <div v-if="fileName">
        <img class="el-icon-upload-x" :src="getTypeIcons(dataType)" alt="" />
        <div class="el-upload__text">
          <span class="text-name">{{ fileName }}</span> 点击更换文件
        </div>
        <!-- <el-progress class="text-progress"
                  :text-inside="true" 
                  :show-text="false"
                  :stroke-width="12" 
                  :percentage="uploadPercent"
                  :indeterminate="true">
              </el-progress> -->
      </div>
      <div v-else>
        <i class="el-icon-upload-x el-icon-folder-opened" />
        <div class="el-upload__text">
          <span class="text-tip">单击或拖放文件至此处进行上传</span>
        </div>
      </div>
    </el-upload>
    <!-- <a v-if="option.url" class="el-icon-download download" href="#" @click="onDownloadFile" /> -->
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref, watch } from "vue";

import type { UploadFile, UploadFiles, UploadProgressEvent, UploadRawFile } from "element-plus";
import { ElMessage } from "element-plus";
import type { Awaitable } from "element-plus/es/utils/typescript";

import csv from "@/assets/image/table/csv.png";
import json from "@/assets/image/table/json.png";
import geojson from "@/assets/image/table/json.png";
import shp from "@/assets/image/table/shp.png";
import xls from "@/assets/image/table/xls.png";
import xlsx from "@/assets/image/table/xls.png";
import { getToken } from "@/utils/auth";
export interface Option {
  fileName?: string;
  type?: string;
  url?: string;
  name?: string;
}

// 接收组件的props属性
const props = defineProps<{
  disabled?: boolean;
  uploadName?: string;
  option: Option;
  modelValue: object | string;
}>();

// 响应式数据声明
const fileName = ref("");
const fileFlag = ref(false);
const uploadFile = ref<File | null>(null); // 明确上传文件的类型为File或null
const uploadType = ref("");
const uploadParams = ref({} as Record<string, string>); // 定义上传附带参数的类型，这里简单示例为字符串键值对对象
const uploadPercent = ref(0);
const headers = {
  "X-Access-Token": getToken()
};
const reg = /(.xlsx)|(.xls)|(.csv)|(.json)|(.zip)|(.geojson)/;
const iconList: Record<string, string> = {
  csv,
  xls,
  xlsx,
  shp,
  json,
  geojson
};
const dataType = ref("");
// 定义向外发射的事件
const emit = defineEmits(["onSuccess", "onError", "onProgress", "update:modelValue", "change"]);
// 方法定义
const setFile = (val: Option) => {
  if (val?.fileName) {
    const { type, fileName: fileNm } = val;
    fileFlag.value = true;
    fileName.value = fileNm;
    dataType.value = type || fileNm.slice(fileNm.lastIndexOf(".") + 1);
  } else {
    fileFlag.value = false;
    fileName.value = "";
    dataType.value = "";
    emit("update:modelValue", {});
    emit("change", {});
  }
  // emit("update:modelValue", file)
  // emit("change", file)
};

const getTypeIcons = (type: keyof typeof iconList) => {
  return iconList[type] ? iconList[type] : iconList["xlsx"];
};
// , fileList: UploadFiles
const onChange = async (file: UploadFile) => {
  if (!reg.test(file.name)) {
    ElMessage({
      showClose: true,
      message: "上传文件类型不支持",
      type: "error"
    });
    return;
    // return false
  }
  const fileType = file.name.substr(file.name.lastIndexOf(".") + 1).replace(/(xlsx)|(xls)/, "excel");
  if (fileType !== props.option.type) {
    ElMessage({
      showClose: true,
      message: "上传文件类型不匹配",
      type: "warning"
    });
    return;
    // return false
  }
  fileName.value = file.name;
  //   uploadFile.value = file
  await nextTick();
  uploadType.value = fileType;
  uploadParams.value = {
    type: uploadType.value
  };
  fileFlag.value = true;
  dataType.value = file.name.slice(file.name.lastIndexOf(".") + 1);
  emit("update:modelValue", file);
  emit("change", file);
  //   return true
};

const onError = (err: Error, file: UploadFile, fileList: UploadFiles) => {
  fileFlag.value = false;
  emit("onError", { err, file, fileList });
};

const onProgress = (event: UploadProgressEvent, file: UploadFile, fileList: UploadFiles) => {
  // 上传时  由于引用mock原因 不触发progress
  uploadPercent.value = event.percent;
  emit("onProgress", { event, file, fileList });
};

const onBeforeUpload = (file: UploadRawFile): Awaitable<void | undefined | null | boolean | File | Blob> => {
  if (!reg.test(file.name)) {
    ElMessage({
      showClose: true,
      message: "上传文件类型不支持",
      type: "error"
    });
    return false;
  }
  const fileType = file.name.substr(file.name.lastIndexOf(".") + 1).replace(/(xlsx)|(xls)/, "excel");
  if (fileType !== props.option.type) {
    ElMessage({
      showClose: true,
      message: "上传文件类型不匹配",
      type: "warning"
    });
    return false;
  }
  uploadFile.value = file;
  return new Promise((resolve) => {
    nextTick(() => {
      uploadType.value = fileType;
      uploadParams.value = {
        type: uploadType.value
      };
      resolve(file);
    });
  });
};

// const onDownloadFile = () => {
//   if (!props.option?.url) {
//     ElMessage.warning("暂无附件可下载！！！")
//     return
//   }
//   handleDownload()
// }

// const handleDownload = () => {
//   const url = `${props.option?.url}`
//   const link = document.createElement("a")
//   const filename = `${props.option?.name}.${props.option.type}`
//   link.style.display = "none"
//   link.href = url
//   link.id = "Adownload"
//   link.setAttribute("download", filename) // 命名可能会出现问题，格式一定和后端下载的格式一样

//   document.body.appendChild(link)
//   link.click()
//   const targetDom = document.getElementById("Adownload")
//   if (targetDom) {
//     targetDom.remove()
//   }
// }

// 监听option属性变化
watch(
  () => props.option,
  (val) => {
    if (!val) {
      return;
    }
    setFile(val);
  },
  {
    deep: true,
    immediate: true
  }
);

onMounted(() => {
  if (!props.option) {
    return;
  }
  setFile(props.option);
});
</script>

<style lang="scss">
.not-allowed {
  cursor: not-allowed !important;
  & > div {
    pointer-events: none;
  }
}
.local-upload,
.item-upload {
  width: 100%;
  height: 168px;
  font-size: 12px;
  .el-upload,
  .el-upload-dragger {
    height: 100%;
    width: 100%;
    background: #0f1014;
    border: none;
    border-radius: 4px;
  }
  .el-upload-dragger {
    display: flex;
    justify-content: center;
    flex-direction: column;
  }
  .el-icon-upload-x {
    font-size: 40px;
    width: 27px;
    height: 27px;
    margin: 0 auto;
  }
  .text-progress {
    width: 50%;
    margin: 1px auto;
  }
  .el-upload__text {
    color: #ffffff;
    line-height: 1;
    font-size: 12px;
    .text-name {
      max-width: calc(100% - 77px);
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      white-space: nowrap;
      color: var(--sw-theme-color);
    }
    .text-tip {
      color: #848484;
    }
  }
  .download {
    cursor: pointer;
    position: absolute;
    font-size: 20px;
    color: #ffffff;
    top: 5px;
    right: 30px;
    &:hover {
      color: var(--sw-theme-color);
    }
  }
}
</style>
