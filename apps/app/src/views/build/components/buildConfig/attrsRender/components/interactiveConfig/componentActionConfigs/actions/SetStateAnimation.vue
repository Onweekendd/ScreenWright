<template>
  <div>
    <el-form-item label="状态动画列表" title="状态动画列表" :label-width="85">
      <configSelect :option="sceneStateAnimationList" v-model="action.stateAnimationName" />
    </el-form-item>
    <el-form-item label="动画状态" title="动画状态" :label-width="85">
      <configSelect :option="animationStateList" v-model="action.animationState" @change="update" />
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

const sceneStateAnimationList = computed<any[]>(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  return actionObj?.option?.statusAnimationData ?? [];
});

const animationStateList = computed<any[]>(() => {
  const current = sceneStateAnimationList.value.find((item: any) => item.value === action.value?.stateAnimationName);
  return current?.status?.map((i: any, index: number) => ({ ...i, value: Number(index) })) ?? [];
});
</script>
