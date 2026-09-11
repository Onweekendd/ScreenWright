<template>
  <div>
    <el-form-item label="缩放原点" :label-width="85">
      <sw-grid-button v-model="action.scale.originGrid" @change="update" />
    </el-form-item>
    <el-form-item label="缩放比例" :label-width="85">
      <div class="flex flex-center-between">
        <sw-input-number v-model.number="action.scale.x" unit="%" bottomLabel="X" :controls="false" @change="update" />
        <sw-input-number v-model.number="action.scale.y" unit="%" bottomLabel="Y" :controls="false" @change="update" />
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
import SwGridButton from "@/components/SwGridButton/index.vue";
import SwInputNumber from "@/components/SwInputNumber/index.vue";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
</script>
