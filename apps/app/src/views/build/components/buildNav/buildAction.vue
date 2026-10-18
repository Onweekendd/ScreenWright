<template>
  <div class="build-action flex flex-align-center">
    <actionItem :disabled="!canUndo" type="ArrowLeft" content="撤销" @click="undo" />
    <actionItem :disabled="!canRedo" type="ArrowRight" content="返回撤销" @click="redo" />
    <actionItem type="iconfont-data_btn" :isActive="visible" content="agentBI" @click="visible = !visible" />
    <actionItem :isActive="sideShow" type="iconfont-zuoce" content="左侧栏" @click="handleSideShow" />
    <actionItem :isActive="configShow" type="iconfont-youce" content="右侧栏" @click="handleConfigShow" />
    <actionItem type="iconfont-picture" content="导出图片" @click="handleExportImage" />
    <controlItem @click="handlePreview" name="预览" enName="preview" type="iconfont-preview" :compact="compact" />
    <buildClose @close="close" />
  </div>
</template>
<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });

import { removeSurroundingQuotes } from "@/utils/utils";
import { getVersionCode, setVersionCode } from "@/utils/version";

import { useRestore } from "../../hooks/useRestore";
import { useNavAction } from "../../useNavAction";
import actionItem from "../actionItem/index.vue";
import { useAgentBISessions } from "../agentBI/useAgentBISessions";
import controlItem from "../controlItem/index.vue";
import buildClose from "./buildClose.vue";

const router = useRouter();
const route = useRoute();
const { restore } = useRestore();
const {
  sideShow,
  configShow,

  canUndo,
  canRedo,
  redo,
  handleSideShow,
  handleConfigShow,
  handleExportImage,
  undo
} = useNavAction();
const { visible } = useAgentBISessions();

const handlePreview = () => {
  const versionCode = getVersionCode();
  if (!versionCode) {
    return;
  }
  const { href } = router.resolve({
    path: `/view/${route.params.id}/`,
    query: {
      version: removeSurroundingQuotes(versionCode),
      type: "0",
      status: "0"
    }
  });

  window.open(href, "_blank");
};

const close = () => {
  // 使用统一的恢复函数清除所有状态
  restore();
  let versionCodeList = JSON.parse(window.localStorage.getItem("versionCodeList") || "[]");
  if (versionCodeList.length > 0) {
    let last = versionCodeList.pop();
    setVersionCode(last.fromVersion || "1");
    window.location.href = `${last.fromPath}`;
    window.localStorage.setItem("versionCodeList", JSON.stringify(versionCodeList));
  } else {
    router.push({ path: "/display" });
  }
};
</script>

<style lang="scss" scoped>
.build-action {
  height: 100%;
}
</style>
