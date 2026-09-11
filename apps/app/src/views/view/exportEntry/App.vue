<template>
  <router-view v-slot="{ Component }">
    <transition name="fade">
      <component :is="Component" v-loading="loading" />
    </transition>
    <template v-if="showLoading">
      <LoadingComponent />
    </template>
  </router-view>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { ref } from "vue";

import LoadingComponent from "@/components/ScreenwrightSceneComponent/loading/index.vue";
import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { parseUrl } from "@/utils/utils";

defineOptions({
  name: "ScreenwrightApp"
});
const { loading } = useGlobalLoading();
const showLoading = ref(true);
onMounted(() => {
  const searchParam = parseUrl(location.href);
  if (searchParam.notPlan && searchParam.notPlan === "true") {
    showLoading.value = false;
  }
});
</script>

<style lang="scss" scoped>
/* 主入口组件样式 */
</style>
