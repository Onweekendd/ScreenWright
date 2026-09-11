<template>
  <div class="sw-build">
    <buildNav />
    <div class="sw-build-content flex">
      <buildSidebar />
      <div class="sw-build-manager" id="go-chart-edit-layout" :style="containerStyle">
        <buildTabs />
        <div class="sw-build-wrapper" id="renderContainer">
          <panelRender :editConfig="panelConfig" />
          <CustomAnimation
            v-if="showCustomAnimation"
            :panel-id="panelInfo.config.id"
            :active-status-id="activeStatusId"
          />
          <StatusAnimation v-if="editorVisible" :panel-id="panelInfo.config.id" :active-status-id="activeStatusId" />
        </div>
      </div>
      <!-- TODO: 复用并调整为动态面板配置 -->
      <buildConfig />
    </div>
    <!-- 右键菜单 -->
    <buildMenu />
  </div>
</template>
<script setup lang="ts">
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";

import CustomAnimation from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/index.vue";
import { useCustomAnimationData } from "@/views/build/components/buildConfig/attrsRender/components/customAnimation/useCustomAnimationData";
import StatusAnimation from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/index.vue";
import { useStatusAnimation } from "@/views/build/components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import buildMenu from "@/views/build/components/buildMenu/index.vue";
import { useNavAction } from "@/views/build/useNavAction";

import buildConfig from "./components/Config/index.vue";
import buildNav from "./components/Nav/index.vue";
import panelRender from "./components/Renderer/index.vue";
import buildSidebar from "./components/Siderbar/index.vue";
import buildTabs from "./components/Tabs/index.vue";
import { usePanelInfo } from "./usePanelInfo";

const { showCustomAnimation, resetCustomAnimationOnPanelChange } = useCustomAnimationData();
const { editorVisible, resetStatusAnimationOnPanelChange } = useStatusAnimation();
const route = useRoute();
const { containerStyle } = useNavAction();
const { panelConfig, initialize, initPanelData, activeStatusId, handleActiveStatusChange, panelInfo } = usePanelInfo();

// 监听activeStatusId变化
watch(() => activeStatusId.value, handleActiveStatusChange, { immediate: true });

// 监听路由参数变化
watch(
  () => route.params.cid,
  (newCid) => {
    if (newCid) {
      resetCustomAnimationOnPanelChange();
      resetStatusAnimationOnPanelChange();

      initPanelData(Number(newCid));
    }
  }
);

onMounted(async () => {
  await initialize();

  resetCustomAnimationOnPanelChange();
  resetStatusAnimationOnPanelChange();
});
</script>
<style lang="scss" scoped>
@import "../../style/build.scss";
</style>
