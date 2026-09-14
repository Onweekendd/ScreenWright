<template>
  <div :title="navInfo.name" class="build-nav-info flex flex-align-center" :style="{ width: `${sideWidthPx}px` }">
    <div class="info">
      <span>
        {{ navInfo.name }}
      </span>
      <div class="tips flex flex-justify-between">
        <span>版本:V{{ navInfo.versionCode }}</span>
        <span class="version" @click="openChangeVersion">切换版本</span>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { NavInfo } from "@/views/build/useLargeScreenInfo";
import { useNavAction } from "@/views/build/useNavAction";

import { useVersion } from "./buildVersion/useBuildVersion";

interface Props {
  navInfo: NavInfo;
}
defineProps<Props>();
const { sideWidthPx } = useNavAction();
const { setVersionDrawerShow } = useVersion();
const openChangeVersion = () => {
  setVersionDrawerShow(true);
};
</script>
<style lang="scss" scoped>
@import "../../style/buildNavInfo.scss";
</style>
