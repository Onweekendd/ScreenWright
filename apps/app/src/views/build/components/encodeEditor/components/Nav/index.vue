<template>
  <div class="build-nav flex flex-align-center">
    <buildNavInfo :name="panelInfo.config.name ?? ''" />
    <div class="build-nav-bar flex flex-justify-between flex-align-center">
      <buildNavList />
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
