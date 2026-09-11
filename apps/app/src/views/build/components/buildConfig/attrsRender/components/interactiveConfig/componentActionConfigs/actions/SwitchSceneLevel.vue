<template>
  <div>
    <el-form-item label="场景关卡" :label-width="85">
      <configSelect :option="sceneLevelList" v-model="action.sceneLevelId" @change="update" />
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
const sceneLevelList = computed<any[]>(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  return actionObj?.option?.sceneLevel?.map((item: any) => ({ label: item.name, value: item.sceneId })) ?? [];
});
</script>
