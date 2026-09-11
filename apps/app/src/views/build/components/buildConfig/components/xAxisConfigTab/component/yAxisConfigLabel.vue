<!-- y轴数值范围 -->
<template>
  <el-form-item label="数值范围" :label-width="labelWidth" v-if="showYAxisMinMax">
    <div class="flex flex-justify-between" style="width: 100%">
      <SwInputNumber v-model="axisMin" bottom-label="最小值" @change="update" width="96" />
      <SwInputNumber v-model="axisMax" bottom-label="最大值" @change="update" width="96" />
    </div>
  </el-form-item>
  <el-form-item label="距离" :label-width="labelWidth">
    <div class="flex flex-justify-between" style="width: 100%">
      <SwInputNumber v-model="axisMargin" unit="px" @change="update" />
    </div>
  </el-form-item>
  <el-form-item label="文本样式" :label-width="labelWidth">
    <configTextStyle v-model="input" @change="handleConfigTextChange" />
  </el-form-item>
  <el-form-item label="后缀" :label-width="labelWidth" v-if="showAxiosLabelUtil">
    <SwInput v-model="axisLabelUtil" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import SwInput from "@/components/SwInput/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";

import { useUpdateInstance } from "../../../useUpdateInstance";
import configTextStyle from "../../configTextStyle/index.vue";
import { useFontStyleAttrs } from "../../configTextStyle/useTextStyleAttrs";
import { useAttrsByReverse } from "../useAttrsByReverse";
import { textStyleLabelByType } from "../utils";

withDefaults(
  defineProps<{
    showAxiosLabelUtil?: boolean;
    showYAxisMinMax?: boolean;
  }>(),
  {
    showAxiosLabelUtil: false,
    showYAxisMinMax: true
  }
);
const { type, axisMin, axisMax, axisMargin, axisLabelUtil } = useAttrsByReverse();
const { update } = useUpdateInstance();
const labelWidth = ref("73");
const { input, handleConfigTextChange, setInput } = useFontStyleAttrs(textStyleLabelByType(type.value));
watch(
  () => type.value,
  () => {
    setInput(textStyleLabelByType(type.value));
  }
);
</script>
