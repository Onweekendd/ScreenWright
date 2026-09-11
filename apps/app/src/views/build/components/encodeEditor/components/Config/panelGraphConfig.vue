<!-- 画布配置 -->
<template>
  <div class="graph-config">
    <configTab :tabs="tabs" v-model="active" />
    <pageConfig v-show="active === TabsEnum.PAGESETUP" />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import configTab from "@/views/build/components/buildConfig/components/configTab/index.vue";
import { TabsEnum } from "@/views/build/components/buildConfig/type";

import pageConfig from "./panelPageConfig.vue";

const active = ref(TabsEnum.PAGESETUP);
const tabs = ref([
  {
    title: "页面设置",
    en: "pagesetup",
    key: TabsEnum.PAGESETUP,
    icon: "iconfont-yemianshezhi"
  },
  {
    title: "动画",
    en: "animation",
    key: TabsEnum.ANIMATION,
    icon: "iconfont-donghua"
  }
]);
</script>
