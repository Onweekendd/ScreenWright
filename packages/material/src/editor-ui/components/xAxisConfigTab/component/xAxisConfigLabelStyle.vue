<template>
  <el-form-item label="颜色" :label-width="labelWidth">
    <SwSingleColorPicker v-model="axisLineColor" @change="update" />
  </el-form-item>
  <el-form-item label="粗细" :label-width="labelWidth">
    <SwInputNumber v-model="axisLineWidth" :min="0" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { ref } from "vue";

import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { useUpdateInstance } from "../../../useUpdateInstance";
// import { useGenericAttrs } from "../../../chartComponent/useGenericAttrs"
import { useAttrsByReverse } from "../useAttrsByReverse";

const { axisLineColor, axisLineWidth } = useAttrsByReverse();
const { update } = useUpdateInstance();
const labelWidth = ref("73");
</script>
