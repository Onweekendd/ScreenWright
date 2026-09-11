<!-- 画布配置 -->
<template>
  <div class="graph-config">
    <configTab :tabs="tabs" v-model="active" />
    <pageConfig v-show="active === TabsEnum.PAGESETUP" />
    <animationConfig v-if="active === TabsEnum.ANIMATION" />
  </div>
</template>
<script setup lang="ts">
import { ref } from "vue";

import configTab from "../components/configTab/index.vue";
import { TabsEnum } from "../type";
import animationConfig from "./animationConfig.vue";
import pageConfig from "./pageConfig.vue";

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
