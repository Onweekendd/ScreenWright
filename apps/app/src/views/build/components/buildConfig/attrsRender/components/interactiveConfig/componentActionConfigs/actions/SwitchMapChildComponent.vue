<template>
  <div>
    <el-form-item label="地图子组件" :label-width="85">
      <configSelect
        :multiple="true"
        :hasTree="true"
        nodeKey="label"
        :option="mapChildComponentList"
        v-model="action.mapChildComponent.nameList"
        @change="
          (value: string | string[] | number[], checkedNodesList?: ConfigSelectOption[] | undefined) => {
            update();
            handleChangeMapChildComponentList(value as string[], checkedNodesList);
          }
        "
      />
    </el-form-item>
    <el-form-item label="显隐状态" :label-width="85">
      <configSelect field="visibleType" v-model="action.mapChildComponent.visible" @change="update" />
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

const mapChildComponentList = computed<any[]>(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return [];
  const actionObj = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  return (
    actionObj?.presetChild?.map((item: any) => ({
      label: item.name,
      value: item.id,
      id: item.id
    })) ?? []
  );
});

/**
 * 切换选择地图子组件
 * @param idList 地图子组件id列表
 * @param infoList 地图子组件信息列表
 */
const handleChangeMapChildComponentList = (idList: string[], infoList: any) => {
  action.value.mapChildComponent.nameList = idList;
  if (infoList) action.value.mapChildComponent.childComponentInfoList = infoList;
  else {
    action.value.mapChildComponent.childComponentInfoList =
      action.value.mapChildComponent.childComponentInfoList.filter((item: any) => idList.includes(item.value));
  }
};
</script>
