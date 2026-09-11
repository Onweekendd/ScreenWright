<template>
  <el-form-item label="颜色" :label-width="labelWidth">
    <SwSingleColorPicker @change="update" v-model="axisTickColor" />
  </el-form-item>
  <el-form-item label="粗细" :label-width="labelWidth">
    <SwInputNumber @change="update" v-model.number="axisTickWidth" unit="px" :min="0" />
  </el-form-item>
  <el-form-item label="长度" :label-width="labelWidth">
    <SwInputNumber @change="update" v-model.number="axisTickLength" unit="px" :min="0" />
  </el-form-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { useUpdateInstance } from "../../../useUpdateInstance";
import { useAttrsByReverse } from "../useAttrsByReverse";

const { axisTickColor, axisTickWidth, axisTickLength } = useAttrsByReverse();
const { update } = useUpdateInstance();
const labelWidth = ref("73");
</script>
