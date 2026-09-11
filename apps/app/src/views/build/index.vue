<template>
  <div class="sw-build">
    <buildNav />
    <div class="sw-build-content flex">
      <buildSidebar />
      <div class="sw-build-manager" id="go-chart-edit-layout" :style="containerStyle">
        <buildTabs />
        <div class="sw-build-wrapper" id="renderContainer">
          <buildRender ref="buildRenderRef" />
          <CustomAnimation v-if="showCustomAnimation" />
          <StatusAnimation v-if="editorVisible" />
        </div>
      </div>
      <buildConfig />
    </div>
    <!-- 右键菜单 -->
    <buildMenu />
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import { getLocationSearch } from "@/utils/utils";

import { getVersionCode, setVersionCode } from "../../utils/version";
import CustomAnimation from "./components/buildConfig/attrsRender/components/customAnimation/index.vue";
import { useCustomAnimation } from "./components/buildConfig/attrsRender/components/customAnimation/useCustomAnimation";
import StatusAnimation from "./components/buildConfig/attrsRender/components/statusAnimation/index.vue";
import { useStatusAnimation } from "./components/buildConfig/attrsRender/components/statusAnimation/useStatusAnimation";
import buildConfig from "./components/buildConfig/index.vue";
import buildMenu from "./components/buildMenu/index.vue";
import buildNav from "./components/buildNav/index.vue";
import buildRender from "./components/buildRender/buildRender.vue";
import buildSidebar from "./components/buildSiderbar/index.vue";
import buildTabs from "./components/buildTabs/index.vue";
import { useInitBuildRender } from "./useInitBuildRender";
import { useNavAction } from "./useNavAction";

const { containerStyle } = useNavAction();
const { buildRenderRef } = useInitBuildRender({
  direct: true
});
const { showCustomAnimation, resetCustomAnimationOnPanelChange } = useCustomAnimation();
const { editorVisible, resetStatusAnimationOnPanelChange } = useStatusAnimation();

onMounted(() => {
  resetCustomAnimationOnPanelChange();
  resetStatusAnimationOnPanelChange();
  setVersionCode(getLocationSearch() || getVersionCode() || "1");
});
</script>
<style lang="scss" scoped>
@import "./style/build.scss";
</style>
