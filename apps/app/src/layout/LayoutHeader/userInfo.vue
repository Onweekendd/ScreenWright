<template>
  <div class="header-user">
    <el-popover placement="right-end" trigger="click" :width="180" :show-arrow="false" :popper-style="popperStyle">
      <template #reference>
        <el-avatar class="user-image" :icon="UserFilled" />
      </template>
      <div class="user-panel">
        <div class="user-panel__name">{{ displayName }}</div>
        <div v-if="roleName" class="user-panel__role">{{ roleName }}</div>
        <el-button class="user-panel__logout" text :icon="SwitchButton" @click="handleLogout">退出登录</el-button>
      </div>
    </el-popover>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { storeToRefs } from "pinia";

import { SwitchButton, UserFilled } from "@element-plus/icons-vue";

import { useUserStore } from "@/store/modules/user";

const userStore = useUserStore();
const { userInfo } = storeToRefs(userStore);

// 弹层挂在 body 下，吃不到页面的深色主题，这里显式给深色底
const popperStyle = {
  background: "#1a1b22",
  border: "1px solid rgba(200, 205, 230, 0.08)",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)"
};

const displayName = computed(() => userInfo.value?.userName ?? "");
const roleName = computed(
  () => userInfo.value?.roleAuthorizationList?.find((item) => item.applicationCode === "BI")?.roleName ?? ""
);

const handleLogout = () => {
  userStore.logout();
};
</script>

<style lang="scss" scoped>
@import "./userInfo.scss";
</style>
