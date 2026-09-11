<template>
  <div class="build-action flex flex-align-center">
    <actionItem :disabled="!canUndo" type="ArrowLeft" content="撤销" @click="undo" />
    <actionItem :disabled="!canRedo" type="ArrowRight" content="返回撤销" @click="redo" />
    <actionItem type="iconfont-data_btn" :isActive="visible" content="agentBI" @click="visible = !visible" />
    <actionItem :isActive="sideShow" type="iconfont-zuoce" content="左侧栏" @click="handleSideShow" />
    <actionItem :isActive="configShow" type="iconfont-youce" content="右侧栏" @click="handleConfigShow" />
    <actionItem type="iconfont-picture" content="导出图片" @click="handleExportImage" />
    <controlItem @click="handlePreview" name="预览" enName="preview" type="iconfont-preview" style="margin-top: 8px" />
    <buildClose @close="close" />
  </div>
</template>
<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

import { getVersionCode } from "@/utils/version";
import actionItem from "@/views/build/components/actionItem/index.vue";
import { useAgentBISessions } from "@/views/build/components/agentBI/useAgentBISessions";
import controlItem from "@/views/build/components/controlItem/index.vue";
import { useNavAction } from "@/views/build/useNavAction";

import { usePanelInfo } from "../../usePanelInfo";
import buildClose from "./buildClose.vue";
const { visible } = useAgentBISessions();

const router = useRouter();
const route = useRoute();
const { setIsLoad, activeStatusId } = usePanelInfo();
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
    path: `/view/${route.params.id}/panel_${route.params.cid}/`,
    query: {
      version: getVersionCode(),
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
