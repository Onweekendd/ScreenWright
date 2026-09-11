<template>
  <div class="layout">
    <el-config-provider :locale="zhCn">
      <el-container class="layout-container layout-mainbox">
        <Siderbar v-if="isShowSide" />
        <AppMain />
      </el-container>
    </el-config-provider>
  </div>
</template>
<script setup lang="ts">
import { onMounted } from "vue";

import zhCn from "element-plus/es/locale/lang/zh-cn";

import { useSiderTreeData } from "@/layout/Siderbar/components/siderTree/useSiderTreeData";

import AppMain from "./AppMain/index.vue";
import Siderbar from "./Siderbar/index.vue";
const { isShowSide, getTreeData } = useSiderTreeData();
onMounted(() => {
  getTreeData();
});
</script>
<style lang="scss" scoped>
@import "./layout.scss";
</style>
