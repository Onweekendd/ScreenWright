<template>
  <div class="build-config" :style="configStyle">
    <template v-if="selectTargetData.length > 0">
      <template v-if="isHasGroup">
        <groupConfig />
      </template>
      <template v-if="selectTargetData.length > 1">
        <pageSetUpConfig />
      </template>
      <attrsRender v-else />
    </template>
    <template v-else>
      <graphConfig />
    </template>
    <configLock v-if="selectTargetData[0] && selectTargetData[0].isLock" />
    <!-- 项目过滤器 -->
    <globalProjectFilter v-if="projectFilterShow" />
    <!-- 全局回调管理 -->
    <globalCallbackManager />
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import configLock from "@/views/build/components/buildConfig/components/configLock/index.vue";
import globalCallbackManager from "@/views/build/components/buildConfig/globalCallbackManager/index.vue";
import globalProjectFilter from "@/views/build/components/buildConfig/globalProjectFliter/index.vue";
import groupConfig from "@/views/build/components/buildConfig/groupConfig/index.vue";
import pageSetUpConfig from "@/views/build/components/buildConfig/pageSetUpConfig/index.vue";
import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";
import { useNavAction } from "@/views/build/useNavAction";

import attrsRender from "./attrsRender/index.vue";
import graphConfig from "./panelGraphConfig.vue";

const { configStyle, projectFilterShow } = useNavAction();
const { selectTargetData } = useEditStore();
const isHasGroup = computed(() => selectTargetData.value.some((v) => v && v.children && v.children.length > 0));
</script>
<style lang="scss" scoped>
.build-config {
  width: 340px;
  height: 100%;
  overflow: hidden;
  color: #b4b7c1;
  background: var(--sw-panel-bg);
  border-left: 1px solid #000000;
  transition: width 0.3s;
  position: relative;
}
</style>
