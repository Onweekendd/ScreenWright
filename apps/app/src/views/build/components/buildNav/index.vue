<template>
  <div ref="navRef" class="build-nav flex flex-justify-between flex-align-center">
    <div class="build-nav-left flex">
      <buildNavInfo :navInfo="navInfo" />
      <buildNavList ref="buildNavListRef" :compact="compact" />
    </div>
    <div class="build-nav-right flex flex-justify-between flex-align-center">
      <buildAction :compact="compact" />
    </div>
  </div>
  <buildVersion />
</template>
<script setup lang="ts">
import type { Ref } from "vue";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

import { useLargeScreenInfo } from "../../useLargeScreenInfo";
import buildAction from "./buildAction.vue";
import buildNavInfo from "./buildNavInfo.vue";
import buildNavList from "./buildNavList.vue";
import buildVersion from "./buildVersion/index.vue";

const { navInfo } = useLargeScreenInfo();
const buildNavListRef = ref<Ref<HTMLElement | null>>();

// 顶栏一行放不下时，把导航按钮切成紧凑模式（只留图标）以省出宽度；变宽后再切回来
const navRef = ref<HTMLElement | null>(null);
const compact = ref(false);
// 完整模式下测得的内容宽度（切紧凑的那一刻记录，与视口无关，可用于判断何时切回）
let fullContentWidth = 0;
let resizeObserver: ResizeObserver | null = null;

const updateCompact = () => {
  const el = navRef.value;
  if (!el) {
    return;
  }
  if (!compact.value) {
    // 完整模式：此刻 scrollWidth 就是完整模式所需宽度
    if (el.scrollWidth - el.clientWidth > 2) {
      fullContentWidth = el.scrollWidth;
      compact.value = true;
    }
  } else if (fullContentWidth && el.clientWidth >= fullContentWidth + 4) {
    // 紧凑模式：可用宽度已能容下完整模式 → 切回去
    compact.value = false;
  }
};

onMounted(() => {
  if (navRef.value) {
    resizeObserver = new ResizeObserver(() => updateCompact());
    resizeObserver.observe(navRef.value);
  }
  nextTick(updateCompact);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
});

defineExpose({
  buildNavListRef
});
</script>
<style lang="scss" scoped>
@import "../../style/buildNav.scss";
</style>
