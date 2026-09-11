<template>
  <div class="interactive-config">
    <el-form label-position="left">
      <loadAnimation v-if="!isThreeSceneChild && !hasUEChild" />
      <callbackOptions v-if="isInteraction" />
      <customEvent v-if="isInteraction && isCustomEvents" />
      <encodeEvent v-if="isInteraction" />
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";

import callbackOptions from "@/views/build/components/buildConfig/attrsRender/components/callbackArgument/callbackOptions.vue";
import loadAnimation from "@/views/build/components/buildConfig/attrsRender/components/loadAnimation.vue";
import { eventList } from "@/views/build/components/buildConfig/constants/index";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";

import customEvent from "./customEvent/index.vue";
import encodeEvent from "./encodeEvent/index.vue";

const { selectTargetData } = useUpdateInstance();
const isThreeSceneChild = computed(() => {
  return selectTargetData.value.length === 1 && selectTargetData.value[0].component.name === "threeScene-iconList";
});
const hasUEChild = ref(false);
const isInteraction = computed(() => {
  const propVal = selectTargetData.value[0].component.prop || "not Interaction";
  return eventList.includes(propVal);
});
const filterCustomEvents = (prop = "") => {
  return [
    "fullScreenSwitch", // 全屏切换
    "pageReload", // 页面刷新
    "simpleStar" // 闪点
  ].includes(prop);
};

const isCustomEvents = computed(() => {
  // 默认的组件都展示自定义事件，如果不需要展示，可以添加进filterCustomEvents
  return !filterCustomEvents(selectTargetData.value[0].component.prop);
});
</script>

<style scoped lang="scss">
.interactive-config {
  height: calc(100% - 68px - 56px);
  overflow-y: auto;
  padding: 0 16px;
}
</style>
