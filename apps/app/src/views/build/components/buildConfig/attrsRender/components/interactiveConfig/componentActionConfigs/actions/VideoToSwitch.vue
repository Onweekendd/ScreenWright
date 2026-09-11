<template>
  <div>
    <el-form-item label="播报视频" :label-width="85">
      <configSelect
        v-if="action.setBroadcastId"
        :option="broadcastVideoList"
        v-model="action.setBroadcastId"
        @change="update"
      />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onMounted } from "vue";

import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { globalComponentMap } = useGlobalComponentData();
const { currentAction: action, update } = useCustomEvent();
const broadcastVideoList = ref<any>([]);

onMounted(() => {
  setBroadcastVideoList(action.value.component);
});

/**
 * 数字人设置播报视频列表
 * @param ids 组件id列表
 */
const setBroadcastVideoList = (ids: string[]) => {
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  if (!actionObj) return;

  broadcastVideoList.value.splice(0, broadcastVideoList.value.length);
  broadcastVideoList.value = actionObj.option.compositeList.map((item: any) => {
    return {
      label: item.name,
      value: item.id
    };
  });
};
</script>
