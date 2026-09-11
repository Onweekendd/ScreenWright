<template>
  <el-form-item label="颜色" :label-width="labelWidth">
    <SwSingleColorPicker v-model="axisTickColor" @change="update" />
  </el-form-item>
  <el-form-item label="粗细" :label-width="labelWidth">
    <SwInputNumber v-model="axisTickWidth" :min="0" @change="update" />
  </el-form-item>
  <el-form-item label="长度" :label-width="labelWidth">
    <SwInputNumber v-model="axisTickLength" unit="px" :min="0" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";

import { useUpdateInstance } from "../../../useUpdateInstance";
import { useAttrsByReverse } from "../useAttrsByReverse";

const { axisTickColor, axisTickWidth, axisTickLength } = useAttrsByReverse();
const { update } = useUpdateInstance();
const labelWidth = ref("73");
</script>
