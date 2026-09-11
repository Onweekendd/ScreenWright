<template>
  <div>
    <el-form-item label="关键帧动画列表" title="关键帧动画列表" :label-width="85">
      <configSelect :option="keyframesName" v-model="action.keyframesName" @change="update" />
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

const keyframesName = computed(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  // TODO:标记类型
  return actionObj?.option?.keyframesAnimation;
});
</script>
