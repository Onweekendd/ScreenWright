<template>
  <div class="build-action flex flex-align-center">
    <actionItem :disabled="!canUndo" type="ArrowLeft" content="撤销" @click="undo" />
    <actionItem :disabled="!canRedo" type="ArrowRight" content="返回撤销" @click="redo" />
    <actionItem :isActive="sideShow" type="iconfont-zuoce" content="左侧栏" @click="handleSideShow" />
    <actionItem :isActive="configShow" type="iconfont-youce" content="右侧栏" @click="handleConfigShow" />
    <actionItem type="iconfont-picture" content="导出图片" @click="handleExportImage" />
    <controlItem @click="handlePreview" name="预览" enName="preview" type="iconfont-preview" style="margin-top: 8px" />
    <buildClose @close="close" />
  </div>
</template>
<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

import actionItem from "@/views/build/components/actionItem/index.vue";
import controlItem from "@/views/build/components/controlItem/index.vue";
import { useNavAction } from "@/views/build/useNavAction";

import { useEncodePanelInfo } from "../../useEncodePanelInfo";
import buildClose from "./buildClose.vue";

const router = useRouter();
const route = useRoute();
const { activeStatusId, panelInfo, setIsLoad } = useEncodePanelInfo();
const {
  sideShow,
  configShow,
  canUndo,
  canRedo,
  redo,
  handleSideShow,
  handleConfigShow,
  handleExportImage,
  undo,
  clearHistory
} = useNavAction();

const handlePreview = () => {
  const { href } = router.resolve({
    path: `/view/${route.params.id}`,
    query: {
      type: panelInfo.value.config.id,
      status: activeStatusId.value
    }
  });

  window.open(href, "_blank");
};
const close = () => {
  clearHistory();

  router.back();

  setIsLoad(false);
  activeStatusId.value = "";
};</script>
<style lang="scss" scoped>
.build-action {
  height: 100%;
}
</style>
