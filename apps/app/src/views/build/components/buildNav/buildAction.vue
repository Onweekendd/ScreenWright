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

import { ElMessage } from "element-plus";

import { isDesktop } from "@/utils/platform";
import { removeSurroundingQuotes } from "@/utils/utils";
import { getVersionCode, setVersionCode } from "@/utils/version";

import { useRestore } from "../../hooks/useRestore";
import { useLargeScreenInfo } from "../../useLargeScreenInfo";
import { useNavAction } from "../../useNavAction";
import actionItem from "../actionItem/index.vue";
import { useAgentBISessions } from "../agentBI/useAgentBISessions";
import controlItem from "../controlItem/index.vue";
import buildClose from "./buildClose.vue";

const router = useRouter();
const route = useRoute();
const { navInfo } = useLargeScreenInfo();
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

// 桌面端（Tauri）：弹出子窗口预览，避免 window.open 走系统浏览器 / 丢失应用上下文
const openPreviewInDesktopWindow = async (href: string) => {
  try {
    const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
    const label = `preview-${route.params.id}-${Date.now()}`;
    const previewWindow = new WebviewWindow(label, {
      url: href,
      title: `预览${navInfo.value.name ? ` - ${navInfo.value.name}` : ""}`,
      width: 1440,
      height: 900,
      // 关闭 Tauri 原生拖放拦截，否则 HTML5 拖拽（vuedraggable/SortableJS）在 webview 里失效
      dragDropEnabled: false
    });
    previewWindow.once("tauri://error", (error) => {
      console.error("创建预览子窗口失败：", error);
      ElMessage.error("预览窗口创建失败");
    });
  } catch (error) {
    console.error("加载 Tauri 预览窗口能力失败：", error);
    ElMessage.error("预览窗口创建失败");
  }
};

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

  if (isDesktop()) {
    openPreviewInDesktopWindow(href);
  } else {
    // Web 端：新开浏览器标签页
    window.open(href, "_blank");
  }
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
