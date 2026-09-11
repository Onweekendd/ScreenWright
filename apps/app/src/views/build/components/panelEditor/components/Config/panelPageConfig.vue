<template>
  <div class="page-config">
    <el-form
      class="main-screen-config"
      label-width="90px"
      label-position="left"
      style="height: calc(100vh - 116px); overflow: auto; padding-right: 5px"
      v-if="activeStatus"
    >
      <el-form-item label="背景色">
        <SwSingleColorPicker @change="update" v-model="activeStatus.backgroundColor" />
      </el-form-item>
      <el-form-item label="启用背景图">
        <el-checkbox v-model="activeStatus.showBackgroundImage" @change="update" />
      </el-form-item>
      <el-form-item label="背景图" v-if="activeStatus.showBackgroundImage">
        <SwUpload v-model="activeStatus.backgroundImage" @delete="handleDelete" @change="handleBackgroundImage" />
      </el-form-item>
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { ElMessage } from "element-plus";

import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import SwUpload from "@/components/SwUpload/index.vue";

import type { DynamicPanelProps } from "../../../buildRender/core/SystemComponent/panel/DynamicPanel";
import { useAction } from "../../../buildRender/hooks/useAction";
import { usePanelInfo } from "../../usePanelInfo";

const { updateComponentLayers } = useAction();
const { panelData, activeStatusId, panelInfo } = usePanelInfo();

const activeStatus = computed(() => {
  return panelData.value.find((v: any) => v.id === activeStatusId.value);
});

// 背景图发生变化
const handleBackgroundImage = async (file: any) => {
  if (!activeStatus.value) {
    return;
  }

  const targetMinioIds: Array<number | null> = [...(activeStatus.value.minioIds || [])];
  targetMinioIds[0] = file.id;
  activeStatus.value.minioIds = targetMinioIds;
  update();
};
// 背景图发生删除
const handleDelete = () => {
  if (!activeStatus.value) {
    return;
  }

  const targetMinioIds: Array<number | null> = [...(activeStatus.value.minioIds || [])];
  targetMinioIds[0] = null;
  activeStatus.value.minioIds = targetMinioIds;
  update();
};

const update = async () => {
  const res: any = await updateComponentLayers(panelInfo.value.config as DynamicPanelProps, {
    fullUpdateDynamicPanel: false
  });

  if (!res.success) {
    ElMessage.error(res.message || "更新失败");
  }
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
}
</style>
