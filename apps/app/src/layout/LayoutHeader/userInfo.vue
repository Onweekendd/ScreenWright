<template>
  <div class="header-user">
    <el-tooltip :content="tipText" placement="right" :disabled="!tipText">
      <el-avatar class="user-image" :icon="UserFilled" />
    </el-tooltip>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import { storeToRefs } from "pinia";

import { UserFilled } from "@element-plus/icons-vue";

import { useUserStore } from "@/store/modules/user";

const { userInfo } = storeToRefs(useUserStore());

// 开源单机版无登录：头像只作展示，hover 显示用户名 / 角色
const tipText = computed(() => {
  const name = userInfo.value?.userName ?? "";
  const role =
    userInfo.value?.roleAuthorizationList?.find((item) => item.applicationCode === "BI")?.roleName ?? "";
  return [name, role].filter(Boolean).join(" · ");
});
</script>

<style lang="scss" scoped>
@import "./userInfo.scss";
</style>
