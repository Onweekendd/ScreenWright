<template>
  <el-aside class="layout-aside aside-container" :class="{ 'is-narrow': hideSecondary }">
    <!-- 一级菜单列 -->
    <div class="aside-primary">
      <nav class="aside-nav">
        <div
          v-for="ele in asyncRoute"
          :key="ele.name"
          class="menu_item"
          :class="{ 'is-active': activeName === ele.name }"
          @click="handleNavClick(ele)"
        >
          <Icon :type="iconFor(ele.path)" :size="20" />
          <span class="menu_item-label">{{ ele.name }}</span>
        </div>

        <div class="menu_item" :class="{ 'is-active': route.path === '/settings' }" @click="goSettings">
          <Icon type="Setting" :size="20" />
          <span class="menu_item-label">设置</span>
        </div>
      </nav>

      <userInfo class="aside-user" />
    </div>

    <!-- 二级菜单列（设置页不需要，收起） -->
    <el-scrollbar v-if="!hideSecondary" class="aside-secondary">
      <div class="aside-tree">
        <siderTree />
      </div>
    </el-scrollbar>
  </el-aside>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import Icon from "@/components/Icon/index.vue";
import userInfo from "@/layout/LayoutHeader/userInfo.vue";
import { type MenuToRouteProps, useUserStore } from "@/store/modules/user";

import siderTree from "./components/siderTree/index.vue";

const route = useRoute();
const router = useRouter();
const { asyncRoute } = useUserStore();

const activeName = computed(() => route.name);

// 设置页：只保留一级列，二级树收起
const hideSecondary = computed(() => route.name === "settings");

// 后端菜单没有 icon 字段，按路由前缀映射到 element-plus 图标
const ICON_MAP: Record<string, string> = {
  display: "Monitor",
  assets: "FolderOpened",
  source: "Coin",
  map: "MapLocation",
  interfaceDebugger: "SetUp"
};
const iconFor = (path: string) => ICON_MAP[path.replace(/^\//, "").split("/")[0]] ?? "Menu";

const handleNavClick = (ele: MenuToRouteProps) => {
  if (route.path !== ele.path) {
    router.push(ele.path);
  }
};

const goSettings = () => {
  if (route.path !== "/settings") {
    router.push("/settings");
  }
};
</script>
<style lang="scss">
@import "./aside.scss";
</style>
