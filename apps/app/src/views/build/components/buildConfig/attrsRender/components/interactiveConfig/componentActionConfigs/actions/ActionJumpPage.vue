<template>
  <div class="action-jump-page">
    <el-form-item label="页码" :label-width="85">
      <sw-input-number v-model="action.currentpage" @change="update" />
    </el-form-item>

    <el-form-item label="延时(ms)" :label-width="85">
      <sw-input-number v-model="action.animation.delay" @change="update" />
    </el-form-item>
  </div>
</template>
<script setup lang="ts">
import SwInputNumber from "@/components/SwInputNumber/index.vue";

import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
</script>
