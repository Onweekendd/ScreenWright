<template>
  <div>
    <el-form-item label="场景对象" :label-width="85">
      <configSelect
        :multiple="true"
        :hasTree="true"
        nodeKey="value"
        :option="sceneObjList.all"
        v-model="action.sceneObject.nameList"
        @change="
          (value: string | string[] | number[], checkedNodesList: ConfigSelectOption[] | undefined) => {
            update();
            handleChangeSceneObjectList(value as (string | number)[], checkedNodesList);
          }
        "
      />
    </el-form-item>
    <el-form-item label="显隐状态" :label-width="85">
      <configSelect field="visibleType" v-model="action.sceneObject.visible" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from "vue";

import { threeComponentEnum } from "@/components/componentEntry/type";
import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ConfigSelect from "../../components/configSelect.vue";
import { type ConfigSelectOption } from "../../components/useConfigSelect";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update, handleChangeSceneObjectList } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();

const actionObj = computed(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return undefined;
  return globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
});

const sceneObjList = computed<any>(() => {
  const obj = actionObj.value;
  if (!obj) return { all: [], BIMFilter: [] };
  const isMapTalks = obj.component.prop === threeComponentEnum.MapTalks;
  // 默认显示的城市图层
  const actionsType =
    action.value.action === "focusLayer"
      ? ["3DTilesLayer"]
      : ["TileLayer", "earthLayer", "dotScan", "3DTilesLayer", "geojson", "ModelLayer", "geojsonLayer"];

  const models = obj.option?.simplifySceneList?.[0]?.models ?? [];

  const mapped = models.map((item: any) => {
    const hasValidType = obj.component.prop === threeComponentEnum.MapTalks && actionsType.includes(item.type);
    if (
      obj.component.prop === threeComponentEnum.Threescene ||
      obj.component.prop === threeComponentEnum.IndustryScene ||
      hasValidType
    ) {
      const key = isMapTalks ? (item.id ?? item.name) : item.name;
      const keyStr = String(key);
      return {
        label: item.name,
        value: keyStr,
        id: keyStr,
        type: item.type,
        children: item.children?.map((childItem: any) => ({
          label: childItem.name,
          value: String(isMapTalks ? (childItem.id ?? childItem.name) : childItem.name),
          id: String(isMapTalks ? (childItem.id ?? childItem.name) : childItem.name)
        }))
      };
    }
    return undefined;
  });
  const all = mapped.filter((item: any) => item !== undefined);
  return {
    all,
    BIMFilter: all.filter((item: any) => item.type === "3DTilesLayer")
  };
});

/**
 * 兼容旧数据：早期将选中值写进了 objInfoList，导致树形下拉无法根据 v-model 勾选。
 * 这里在渲染期把 objInfoList(节点数组) 的 value 提取到 nameList(选中key数组)。
 */
watchEffect(() => {
  const sceneObject = action.value?.sceneObject;
  if (!sceneObject) return;

  const hasNameList = Array.isArray(sceneObject.nameList) && sceneObject.nameList.length > 0;
  if (hasNameList) return;

  if (!Array.isArray(sceneObject.objInfoList) || sceneObject.objInfoList.length === 0) return;

  const derivedKeys = sceneObject.objInfoList
    .filter((item: any) => item && !item.children && item.value !== undefined && item.value !== null)
    .map((item: any) => String(item.value));

  if (derivedKeys.length > 0) {
    sceneObject.nameList = derivedKeys;
  }
});
</script>
