<template>
  <el-form-item label="选择译文" :label-width="85">
    <configSelect :option="currentTranslationList" v-model="action.translation" @change="update" />
  </el-form-item>
  <el-form-item label="延时(ms)" :label-width="85">
    <sw-input-number v-model="action.animation.delay" @change="update" />
  </el-form-item>
</template>
<script setup lang="ts">
import { computed } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

interface dictListType {
  id: string;
  name: string;
  value: string;
  alias: string;
}

const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();

const currentTranslationList = computed(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  return (
    actionObj?.option.dictList.map((item: dictListType) => {
      return {
        label: item.alias,
        value: item.value
      };
    }) || []
  );
});
</script>
