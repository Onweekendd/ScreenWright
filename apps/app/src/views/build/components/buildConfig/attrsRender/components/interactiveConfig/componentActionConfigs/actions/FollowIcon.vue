<template>
  <div>
    <el-form-item label="横向偏移" :label-width="85">
      <sw-input-number v-model="action.mapBox.boxOffsetX" @change="update" :min="-1000" :controls="false" />
    </el-form-item>
    <el-form-item label="纵向偏移" :label-width="85">
      <sw-input-number v-model="action.mapBox.boxOffsetY" @change="update" :min="-1000" :controls="false" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import SwInputNumber from "@/components/SwInputNumber/index.vue";

import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
</script>
