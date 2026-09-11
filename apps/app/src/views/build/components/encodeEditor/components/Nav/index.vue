<template>
  <div class="build-nav flex flex-justify-between flex-align-center">
    <div class="build-nav-left flex">
      <buildNavInfo :name="panelInfo.config.name ?? ''" />
      <buildNavList />
    </div>
    <div class="build-nav-right flex flex-justify-between flex-align-center">
      <buildAction />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useEncodePanelInfo } from "../../useEncodePanelInfo";
import buildAction from "./buildAction.vue";
import buildNavInfo from "./buildNavInfo.vue";
import buildNavList from "./NavList.vue";

const { panelInfo } = useEncodePanelInfo();
</script>
<style lang="scss" scoped>
@import "../../../../style/buildNav.scss";
</style>
