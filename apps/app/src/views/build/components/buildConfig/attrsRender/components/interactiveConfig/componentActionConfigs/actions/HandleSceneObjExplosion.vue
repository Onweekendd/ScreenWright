<template>
  <div>
    <el-form-item label="场景对象" :label-width="85">
      <configSelect
        :multiple="false"
        :hasTree="false"
        nodeKey="label"
        :option="sceneObjList"
        v-model="action.sceneObjectExplosion.index"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="机盖" :label-width="85">
      <configSelect
        :multiple="false"
        :hasTree="false"
        nodeKey="label"
        :option="nodeList"
        v-model="action.sceneObjectExplosion.lidName"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="机底" :label-width="85">
      <configSelect
        :multiple="false"
        :hasTree="false"
        nodeKey="label"
        :option="nodeList"
        v-model="action.sceneObjectExplosion.baseName"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="爆炸类型" :label-width="85">
      <configSelect field="sceneObjectExplosionType" v-model="action.sceneObjectExplosion.type" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";

import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();

const actionObj = computed(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return undefined;
  return globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
});

const sceneObjList = computed<any>(() => {
  const obj = actionObj.value;
  if (!obj) return [];

  const models = obj.option?.sceneModelNodeList ?? [];
  return models.map((item: any) => {
    return {
      label: item.label,
      value: item.label,
      children: item.children?.map((child: any) => ({
        label: child.label,
        value: child.label
      }))
    };
  });
  // const modelNodeList = obj.option?.sceneModelNodeList
});

const nodeList = computed(() => {
  return sceneObjList.value.find((item: any) => item.value === action.value.sceneObjectExplosion.index)?.children || [];
});

watch(
  () => action.value.sceneObjectExplosion.index,
  (newValue) => {
    // 重置机盖和机底
    if (newValue) {
      action.value.sceneObjectExplosion.lidName = "";
      action.value.sceneObjectExplosion.baseName = "";
    }
  }
);
</script>
