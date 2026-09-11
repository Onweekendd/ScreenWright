<template>
  <div>
    <el-form-item label="场景子组件" :label-width="85">
      <configSelect
        :multiple="true"
        :hasTree="true"
        nodeKey="label"
        :option="sceneChildComponentList"
        v-model="action.sceneChildComponent.nameList"
        @change="
          (value: string | string[] | number[], checkedNodesList?: ConfigSelectOption[] | undefined) => {
            update();
            handleChangeSceneChildComponentList(value as string[], checkedNodesList);
          }
        "
      />
    </el-form-item>
    <el-form-item label="显隐状态" :label-width="85">
      <configSelect field="visibleType" v-model="action.sceneChildComponent.visible" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ConfigSelect from "../../components/configSelect.vue";
import { type ConfigSelectOption } from "../../components/useConfigSelect";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();

const sceneChildComponentList = computed<any[]>(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  return (
    actionObj?.presetChild?.map((item: any, index: number) => ({
      label: item.name,
      value: item.type + "Group" + index,
      id: item.id
    })) ?? []
  );
});

/**
 * 切换选择场景子组件
 * @param idList 场景子组件id列表
 * @param infoList 场景子组件信息列表
 */
const handleChangeSceneChildComponentList = (idList: string[], infoList: any) => {
  action.value.sceneChildComponent.nameList = idList;
  if (infoList) action.value.sceneChildComponent.childComponentInfoList = infoList;
  else {
    action.value.sceneChildComponent.childComponentInfoList =
      action.value.sceneChildComponent.childComponentInfoList.filter((item: any) => idList.includes(item.value));
  }
};
</script>
