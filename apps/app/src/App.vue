<template>
  <div class="app-shell" :class="{ 'app-shell--desktop': isDesktopShell }">
    <DesktopTitleBar v-if="isDesktopShell" />
    <div class="app-shell__body">
      <router-view v-slot="{ Component }">
        <transition name="fade">
          <component :is="Component" v-loading="loading" :element-loading-text="loadingText" :style="contentStyle" />
        </transition>
        <template v-if="showLoading">
          <LoadingComponent />
        </template>
      </router-view>
      <AgentBI v-if="isBuildRoute" ref="agentBIRef" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { defineAsyncComponent, onMounted, watchEffect } from "vue";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { isDesktop } from "@/utils/platform";
import { parseUrl } from "@/utils/utils";
import AgentBI from "@/views/build/components/agentBI/index.vue";

import DesktopTitleBar from "./layout/DesktopTitleBar/index.vue";
import { useMountGlobalHooks } from "./views/build/useMountGlobalHooks";

const LoadingComponent = defineAsyncComponent(
  () => import("@/components/ScreenwrightSceneComponent/loading/index.vue")
);
const { loading, loadingText } = useGlobalLoading();
const { mountGlobalHooks } = useMountGlobalHooks();
const showLoading = ref(true);
const agentBIRef = ref<InstanceType<typeof AgentBI> | null>(null);

const route = useRoute();
const isBuildRoute = computed(() => route.path.startsWith("/build"));

// 桌面端（Tauri）外壳：隐藏系统标题栏，改用自定义标题栏。
// /view 预览是独立裸渲染窗口（保留系统标题栏），不套外壳。
const isDesktopShell = computed(() => isDesktop() && !route.path.startsWith("/view"));

watchEffect(() => {
  document.documentElement.classList.toggle("is-desktop", isDesktopShell.value);
});

const contentStyle = computed(() => {
  const base: Record<string, string> = { height: "100%" };
  if (agentBIRef.value?.visible && agentBIRef.value.drawerWidth) {
    base.width = `calc(100% - ${agentBIRef.value.drawerWidth})`;
  }
  return base;
});

watchEffect(() => {
  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.style.backgroundColor = isBuildRoute.value ? "#181a24" : "";
  }
});

onMounted(async () => {
  const searchParam = parseUrl(location.href);
  mountGlobalHooks();
  if (searchParam.notPlan && searchParam.notPlan === "true") {
    showLoading.value = false;
  }
});
</script>
<style lang="scss" scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  &__body {
    position: relative;
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
  }
}
</style>
