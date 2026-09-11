<template>
  <el-form-item label="动画类型" :label-width="85">
    <configSelect field="actionType" v-model="action.animation.type" @change="update" />
  </el-form-item>
  <el-form-item label="速率" :label-width="85">
    <configSelect field="timingFunction" v-model="action.animation.timingFunction" @change="update" />
  </el-form-item>
  <el-form-item label="动画时长" :label-width="85">
    <sw-input-number v-model="action.animation.duration" @change="update" />
  </el-form-item>

  <el-form-item label="延时(ms)" :label-width="85">
    <sw-input-number v-model="action.animation.delay" @change="update" />
  </el-form-item>
</template>

<script setup lang="ts">
import SwInputNumber from "@/components/SwInputNumber/index.vue";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
</script>
