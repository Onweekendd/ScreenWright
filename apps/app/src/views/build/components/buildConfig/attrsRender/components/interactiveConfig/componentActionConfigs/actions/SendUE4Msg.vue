<template>
  <div v-if="action.ue4Config">
    <el-form-item label="消息名称" :label-width="85">
      <el-input v-model="action.ue4Config.messageName" placeholder="发送给ue4对应的消息名称" @change="update" />
    </el-form-item>
    <el-form-item label="消息类型" :label-width="85">
      <configSelect field="messageType" v-model="action.ue4Config.messageType" @change="update" />
    </el-form-item>
    <el-form-item v-if="isSendUE4MsgStatic" label="消息内容" :label-width="85">
      <el-input
        type="textarea"
        :row="5"
        v-model="action.ue4Config.messageContent"
        placeholder="发送给ue4对应的消息内容"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="延时(ms)" :label-width="85">
      <sw-input-number v-model="action.animation.delay" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { ActionTypeEnum } from "@/views/build/components/buildConfig/constants/action";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();

// Computed property to check if it's a static message
const isSendUE4MsgStatic = computed(() => {
  return action.value?.action === ActionTypeEnum.SendUe4MsgStatic;
});
</script>
