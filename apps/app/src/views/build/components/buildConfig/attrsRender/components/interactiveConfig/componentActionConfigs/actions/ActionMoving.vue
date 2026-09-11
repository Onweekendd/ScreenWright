<template>
  <div>
    <el-form-item label="移动后位置" :label-width="85">
      <div class="flex flex-center-between">
        <sw-input-number
          v-model.number="action.translate.toX"
          unit="px"
          bottomLabel="X"
          :controls="false"
          @change="update"
        />
        <sw-input-number
          v-model.number="action.translate.toY"
          unit="px"
          bottomLabel="Y"
          :controls="false"
          @change="update"
        />
      </div>
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
  </div>
</template>

<script setup lang="ts">
import SwInputNumber from "@/components/SwInputNumber/index.vue";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
</script>
