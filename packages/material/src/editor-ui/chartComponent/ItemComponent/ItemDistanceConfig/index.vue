<!-- 主项间隔边框 -->
<template>
  <SwCollapseItem :title="title">
    <template #content>
      <el-form-item label="颜色" :label-width="73">
        <SwSingleColorPicker v-model="color" @change="update" />
      </el-form-item>

      <el-form-item label="宽度" :label-width="73">
        <SwInputNumber unit="px" v-model="width" @change="update" />
      </el-form-item>
    </template>
  </SwCollapseItem>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";
import { SwSingleColorPicker } from "@screenwright/ui/single-color-picker";

import { useUpdateInstance } from "../../../useUpdateInstance";
import type { Props } from "../../useDistanceConfig";
import { useDistanceConfig } from "../../useDistanceConfig";

const { update } = useUpdateInstance();
const props = defineProps<Props>();
const { color, width } = useDistanceConfig(props);
</script>
