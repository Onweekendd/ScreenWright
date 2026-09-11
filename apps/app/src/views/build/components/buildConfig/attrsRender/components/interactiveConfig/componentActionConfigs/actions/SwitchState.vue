<template>
  <el-form-item label="状态" :label-width="85">
    <configSelect :option="componentStatus" v-model="action.stateId" @change="update" />
  </el-form-item>

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
import { computed } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { extractComponentId } from "@/utils/utils";
import type { DynamicPanelProps } from "@/views/build/components/buildRender/core/SystemComponent/panel/DynamicPanel";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import configSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
const { allComponentMap } = useGlobalComponentData();

const componentStatus = computed<any[]>(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const dynamicPanel = allComponentMap.value.get(`${extractComponentId(ids[0])}`) as DynamicPanelProps & {
    parentDynamicPanelId: number[];
  };
  if (!dynamicPanel || !dynamicPanel.panelData) return [];

  return dynamicPanel.panelData.map((item) => {
    let label = "";
    if (item.name) label = item.name;
    else if ((item as any).detail) {
      const detail = (item as any).detail;
      label = typeof detail === "object" ? detail.name : JSON.parse(detail).name;
    }
    return {
      label,
      value: item.id
    };
  });
});
</script>
