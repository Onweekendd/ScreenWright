<template>
  <div class="interactive-config">
    <el-form label-position="left">
      <controlEncodes v-if="editConfig.isEncodedControl || hasUEChild" />
      <loadAnimation v-if="!isThreeSceneChild && !hasUEChild && !isThreeMapChild" />
      <callbackOptions v-if="isInteraction || hasUEChild || hanUnrealEngine" />
      <customEvent v-if="(isInteraction && isCustomEvents) || hasUEChild || hanUnrealEngine" />
      <integrationEncodeEvent v-if="isIntegrationEncode" />
    </el-form>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";

import { useEditStore } from "../../buildRender/hooks/useEditStore";
import { eventList } from "../constants/index";
import { useUpdateInstance } from "../useUpdateInstance";
import callbackOptions from "./components/callbackArgument/callbackOptions.vue";
import controlEncodes from "./components/controlEncodes/index.vue";
import integrationEncodeEvent from "./components/integrationEncodeEvent/index.vue";
import customEvent from "./components/interactiveConfig/customEvent.vue";
import loadAnimation from "./components/loadAnimation.vue";

const { editConfig } = useEditStore();
const { selectTargetData } = useUpdateInstance();
const isIntegrationEncode = computed(() => {
  return (
    selectTargetData.value.length === 1 && ["sw-integration-mutual"].includes(selectTargetData.value[0].component.prop)
  );
});
const isThreeMapChild = computed(() => {
  return (
    selectTargetData.value.length === 1 && ["threeMap-mapGlIcon"].includes(selectTargetData.value[0].component.name)
  );
});
const isThreeSceneChild = computed(() => {
  return (
    selectTargetData.value.length === 1 &&
    ["threeScene-iconList", "threeScene-twinIconList", "threeScene-twinPanelIconList"].includes(
      selectTargetData.value[0].component.name
    )
  );
});
const hasUEChild = ref(
  selectTargetData.value.length === 1 &&
    ["ue-peer-streaming-child", "ue-pixel-streaming-child", "ue-vessel-child"].includes(
      selectTargetData.value[0].component.name
    )
);

const hanUnrealEngine = ref(
  selectTargetData.value.length === 1 && ["sw-unreal-engine-child"].includes(selectTargetData.value[0].component.name)
);
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
