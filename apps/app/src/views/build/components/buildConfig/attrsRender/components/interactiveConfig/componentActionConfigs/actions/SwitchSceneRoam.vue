<template>
  <div>
    <el-form-item label="场景视角" :label-width="85">
      <configSelect :option="sceneRoams" v-model="action.sceneStatusName" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();

// TODO: 添加类型
const sceneRoams = computed<any[]>(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  return (
    actionObj?.option?.simplifySceneRoams?.map((item: any, index: number) => ({
      label: `视角${index + 1}`,
      value: `视角${index + 1}`
    })) ?? []
  );
});
</script>
