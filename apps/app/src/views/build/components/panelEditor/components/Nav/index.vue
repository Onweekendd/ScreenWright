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
import { usePanelInfo } from "../../usePanelInfo";
import buildAction from "./buildAction.vue";
import buildNavInfo from "./buildNavInfo.vue";
import buildNavList from "./NavList.vue";

const { panelInfo } = usePanelInfo();
</script>
<style lang="scss" scoped>
@import "../../../../style/buildNav.scss";
</style>
