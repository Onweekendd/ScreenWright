<template>
  <div>
    <el-form-item label="场景状态" :label-width="85">
      <configSelect :option="sceneStatus" v-model="action.sceneStatusName" @change="update" />
    </el-form-item>
    <el-form-item label="延时(ms)" :label-width="85">
      <sw-input-number v-model="action.animation.delay" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();

// TODO: 添加类型
const sceneStatus = computed<any[]>(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  return actionObj?.option?.simplifySceneList?.map((item: any) => ({ label: item.name, value: item.name })) ?? [];
});
</script>
