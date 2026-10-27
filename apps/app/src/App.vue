<template>
  <div class="app-shell">
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
import { parseUrl } from "@/utils/utils";
import AgentBI from "@/views/build/components/agentBI/index.vue";

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
    appEl.style.backgroundColor = isBuildRoute.value ? "var(--sw-editor-bg)" : "";
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
