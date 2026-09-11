<template>
  <div>
    <el-form-item label="快进时间" :label-width="85">
      <sw-input-number v-model="action.timeFastIn" @change="update" />
    </el-form-item>
    <el-form-item label="延时(ms)" :label-width="85">
      <sw-input-number v-model="action.animation.delay" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";

import { has } from "lodash-es";

import SwInputNumber from "@/components/SwInputNumber/index.vue";

import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();

onMounted(() => {
  if (!has(action.value, "timeFastIn")) {
    action.value.timeFastIn = 10;
  }
});
</script>
