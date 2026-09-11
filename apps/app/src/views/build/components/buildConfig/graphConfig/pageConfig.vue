<template>
  <div class="page-config">
    <el-form
      class="main-screen-config"
      label-width="90px"
      label-position="left"
      style="height: calc(100vh - 116px); overflow: auto; padding-right: 5px"
    >
      <el-form-item label="屏幕大小">
        <configSelectInput
          @change="changeScreenType"
          v-model:height="editConfig.height"
          v-model:width="editConfig.width"
        />
      </el-form-item>
      <el-form-item label="背景色">
        <SwSingleColorPicker @change="handleBgColorChange" v-model="editConfig.backgroundColor" />
      </el-form-item>
      <el-form-item label="启用背景图">
        <el-checkbox v-model="editConfig.showBackgroundImage" @change="update" />
      </el-form-item>
      <el-form-item label="背景图" v-if="editConfig.showBackgroundImage">
        <SwUpload v-model="editConfig.backgroundImage" @delete="handleDelete" @change="handleBackgroundImage" />
      </el-form-item>
      <el-form-item label="封面">
        <SwUpload v-model="navInfo.backgroundUrl" @change="handleOutSideGroundImage" @delete="handleOutSideDelete" />
        <el-button
          :loading="screenLoading"
          size="small"
          type="primary"
          class="screen-shot-btn"
          @click="handleScreenShot"
        >
          {{ screenText }}
        </el-button>
      </el-form-item>
      <SwCollapseItem title="预览配置">
        <template #content>
          <el-form-item label="显示比例">
            <SwRadio
              @change="update"
              class="config-padding"
              :option="adaptationType"
              v-model="editConfig.adaptationType"
            />
          </el-form-item>
          <el-form-item label="启用滤镜" :style="{ marginBottom: editConfig.showScreenFilter ? '0' : '18px' }">
            <div class="config-padding">
              <el-checkbox @change="update" v-model="editConfig.showScreenFilter" />
            </div>
          </el-form-item>
          <!-- 处理滤镜类型阈值组件 -->
          <configScreenFilter
            @change="update"
            v-model="editConfig.screenFilterInfo"
            v-if="editConfig.showScreenFilter"
          />
          <el-form-item label="启用水印" :style="{ marginBottom: editConfig.showWaterMark ? 0 : '18px' }">
            <div class="config-padding">
              <el-checkbox @change="update" v-model="editConfig.showWaterMark" />
            </div>
          </el-form-item>
          <!-- 水印文本配置 -->
          <configWater @change="update" v-model="editConfig.waterMark" v-if="editConfig.showWaterMark" />
        </template>
      </SwCollapseItem>
      <SwCollapseItem title="终端交互">
        <template #content>
          <el-form-item label="启用终端通信">
            <el-checkbox v-model="editConfig.isEncodedControl" @change="handleEncodedControlChange" />
          </el-form-item>
          <!-- 终端交互配置 -->
          <configEncodeControl
            v-model:controlWebsocketUrl="editConfig.controlWebsocketUrl"
            v-model:heartbeatInterval="editConfig.heartbeatInterval"
            @change="update"
            v-if="editConfig.isEncodedControl"
          />
        </template>
      </SwCollapseItem>
    </el-form>
  </div>
</template>
<script setup lang="ts">
/**
 * 对本文件进行直接修改时
 * 请检查
 * src\views\build\components\encodeEditor\components\Config\panelPageConfig.vue
 * src\views\build\components\encodeEditor\components\Config\panelPageConfig.vue
 * 这两个文件是否需要同步修改
 */
import { ref } from "vue";
import { useRoute } from "vue-router";

import { ElMessage } from "element-plus";

// import html2canvas from "html2canvas"
import { minioUploadFile } from "@/api/assets";
import { updateLargeScreen } from "@/api/library";
import SwCollapseItem from "@/components/SwCollapseItem/index.vue";
import SwRadio from "@/components/SwRadio/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import SwUpload from "@/components/SwUpload/index.vue";
import { getWebsocketUrl } from "@/utils/utils";

import { useLargeScreenInfo } from "../../../useLargeScreenInfo";
import { useAlignmentWasm } from "../../buildRender/hooks/useAlignmentWasm";
import { useEditStore } from "../../buildRender/hooks/useEditStore";
import configEncodeControl from "../components/configEncodeControl/index.vue";
import configScreenFilter from "../components/configScreenFilter/index.vue";
import configSelectInput from "../components/configSelectInput/configSelectInput.vue";
import configWater from "../components/configWater/index.vue";
import { adaptationType } from "./options";
import { captureEditorScreenShot, promptEditorScreenShotMode } from "./screenShot";
const { navInfo } = useLargeScreenInfo();
const { setEditConfig, editConfig, componentList } = useEditStore();
const { syncComponentData, resetAlignmentLines } = useAlignmentWasm();
const route = useRoute();
const screenText = ref("截图");
const screenLoading = ref(false);

// 启用终端通信
const handleEncodedControlChange = () => {
  if (editConfig.value.isEncodedControl) {
    const url = getWebsocketUrl(`${route.params.id}`);
    editConfig.value.controlWebsocketUrl = url;
    editConfig.value.isEncodedControl = true;
  } else {
    editConfig.value.controlWebsocketUrl = "";
    editConfig.value.isEncodedControl = false;
  }
  update();
};

const handleScreenShot = async () => {
  const mode = await promptEditorScreenShotMode();
  if (!mode) {
    return;
  }

  screenText.value = "截图中...";
  screenLoading.value = true;

  try {
    const result = await captureEditorScreenShot({
      screenShotMode: mode,
      componentList: componentList.value,
      canvas: "#go-chart-edit-content",
      editor: ".es-editor",
      mimeType: "image/jpeg"
    });

    if (!result) {
      ElMessage.error("截图失败");
      return;
    }

    const { file, dataUrl } = result;
    console.log("dataUrl", dataUrl);
    const id = route.params.id as string;
    const formdata = new FormData();
    formdata.append("fileType", "1");
    formdata.append("resourceType", "1");
    formdata.append("largeId", `${id}`);
    formdata.append("groupId", "");
    formdata.append("file", file);
    formdata.append("name", file.name);

    const res = await minioUploadFile(formdata);
    if (!res.success) {
      ElMessage.error("截图失败");
      throw new Error("文件上传失败：" + (res.message || "未知错误"));
    }

    navInfo.value.backgroundUrl = res.result.url;
    await handleOutSideGroundImage(res.result);
    ElMessage.success("截图处理成功");
  } catch (error) {
    console.error("截图处理失败：", error);
    ElMessage.error("截图处理失败");
  } finally {
    screenLoading.value = false;
    screenText.value = "截图";
  }
};

const setBackGroundMinioIds = (index: number, data: any) => {
  const targetMinioIds = [...(editConfig.value.minioIds as number[])];
  targetMinioIds[index] = data.id;
  editConfig.value.minioIds = targetMinioIds;
};

// 清理minioIds，如果所有值都为null则设置为空数组
const cleanMinioIds = () => {
  const minioIds = editConfig.value.minioIds;
  if (minioIds && minioIds.every((id) => id === null)) {
    editConfig.value.minioIds = [];
  }
};

const changeScreenType = () => {
  setEditConfig("width", editConfig.value.width);
  setEditConfig("height", editConfig.value.height);

  resetAlignmentLines();
  syncComponentData({
    renderWidth: Number(editConfig.value.width),
    renderHeight: Number(editConfig.value.height)
  });
  update();
};

// 背景图发生变化
const handleBackgroundImage = async (data: any) => {
  setBackGroundMinioIds(0, data);
  update();
};
// 背景图发生删除
const handleDelete = () => {
  const targetMinioIds = [...(editConfig.value.minioIds ?? [])];
  targetMinioIds[0] = null;
  editConfig.value.minioIds = targetMinioIds;
  cleanMinioIds();
  update();
};

const handleUpdateLargeScreen = async (data: any) => {
  const res = await updateLargeScreen(data);
  console.log(res, "resresres");
  if (!res.success) {
    ElMessage.error(res.message || "更新失败");
  }
  return res;
};

const handleBgColorChange = (value: string) => {
  setEditConfig("backgroundColor", value);
  update();
};
// 封面图发生了变化
const handleOutSideGroundImage = async (data: any) => {
  setBackGroundMinioIds(1, data);
  await handleUpdateLargeScreen({
    backgroundUrl: data.url,
    detail: JSON.stringify(editConfig.value),
    id: Number(route.params.id),
    minioIds: JSON.stringify((editConfig.value.minioIds ?? []).filter((id) => id !== null && id !== undefined))
  });
};
// 封面图发生了删除
const handleOutSideDelete = () => {
  const targetMinioIds: Array<number | null> = [...(editConfig.value.minioIds ?? [])];
  targetMinioIds[1] = null;
  editConfig.value.minioIds = targetMinioIds;
  cleanMinioIds();
  handleUpdateLargeScreen({
    backgroundUrl: "",
    detail: JSON.stringify(editConfig.value),
    id: Number(route.params.id),
    minioIds: JSON.stringify((editConfig.value.minioIds ?? []).filter((id) => id !== null && id !== undefined))
  });
};

const update = () => {
  cleanMinioIds();
  handleUpdateLargeScreen({
    detail: JSON.stringify(editConfig.value),
    id: Number(route.params.id),
    minioIds: JSON.stringify((editConfig.value.minioIds ?? []).filter((id) => id !== null && id !== undefined))
  });
};
</script>
<style lang="scss">
.el-input__inner {
  --el-input-text-color: #859094;
}
</style>
<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
.page-config {
  padding: 0 0px 0 16px;
  @include checkbox-style();
  :deep(.el-form-item__label) {
    padding: 0 !important;
    color: #b4b7c1 !important;
    font-size: 12px;
    font-family:
      Source Han Sans CN-Normal,
      Source Han Sans CN;
    font-weight: 400;
  }
  .config-padding {
    position: relative;
    left: -26px;
  }
  .screen-shot-btn {
    margin-top: 10px;
    width: 70px;
    height: 25px;
    background-image: -webkit-gradient(linear, left top, left bottom, from(#8b58e7), to(#642cff));
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
    padding: 0 !important;
  }
}
</style>
