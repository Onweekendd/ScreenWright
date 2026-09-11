<template>
  <div v-if="isNotVoiceControl">
    <!-- <el-form-item label="消息内容" :label-width="85">
      <el-input
        type="textarea"
        :row="5"
        v-model="action.aiManMsgContent"
        placeholder="发送给数字人对应的消息内容"
        @change="update"
      />
    </el-form-item> -->
    <el-form-item label="延时(ms)" :label-width="85">
      <sw-input-number v-model="action.animation.delay" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";

import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();

// Check if it's not a voice control component
const isNotVoiceControl = computed(() => {
  // Check if action's component doesn't include voice control
  return !action.value?.component?.includes("sw-voice-control");
});
</script>
