<template>
  <sw-collapse-item title="文字" open>
    <template #content>
      <ItemFontFamily />
      <el-form-item label="字号" label-width="73">
        <sw-input-number v-model="selectTargetData[0].option.textFontSize" :controls="true" @change="update" />
      </el-form-item>
    </template>
  </sw-collapse-item>
</template>
<script setup lang="ts">
import { SwCollapseItem } from "@screenwright/ui/collapse-item";
import { SwInputNumber } from "@screenwright/ui/input-number";

import { useUpdateInstance } from "../../../../useUpdateInstance";
import ItemFontFamily from "../../ItemComponent/ItemFontFamily/index.vue";

const { update, selectTargetData } = useUpdateInstance();
</script>
