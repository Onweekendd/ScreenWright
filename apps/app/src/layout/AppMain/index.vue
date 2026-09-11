<template>
  <el-main class="layout-main">
    <router-view v-slot="{ Component, route }">
      <transition name="el-fade-in" mode="out-in">
        <div style="height: 100%; width: 100%" class="layout-main-wrapper" v-if="isLoad">
          <component :is="Component" :key="route.path" />
        </div>
      </transition>
    </router-view>
  </el-main>
</template>
<script setup lang="ts">
import { useSiderTreeData } from "../Siderbar/components/siderTree/useSiderTreeData";

const { isLoad } = useSiderTreeData();
</script>
