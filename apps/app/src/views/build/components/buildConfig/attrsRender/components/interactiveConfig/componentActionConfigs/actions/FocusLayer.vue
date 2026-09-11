<template>
  <div>
    <el-form-item label="场景对象" :label-width="85">
      <configSelect
        :multiple="false"
        :hasTree="false"
        nodeKey="label"
        :option="sceneObjList.BIMFilter"
        v-model="action.layerInfo.name"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="高光颜色" :label-width="85">
      <sw-single-color-picker
        field="highLightColor"
        v-model="action.layerInfo.color"
        :opacityShow="false"
        @change="update"
      />
    </el-form-item>
    <el-form-item label="回调字段" :label-width="85">
      <sw-input v-model="action.layerInfo.callBackField" @change="update" />
    </el-form-item>
    <el-form-item label="子节点字段" :label-width="85">
      <sw-input v-model="action.layerInfo.childNodeField" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { threeComponentEnum } from "@/components/componentEntry/type";
import SwInput from "@/components/SwInput/index.vue";
import SwSingleColorPicker from "@/components/SwSingleColorPicker/index.vue";
import { extractComponentId } from "@/utils/utils";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import ConfigSelect from "../../components/configSelect.vue";
import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();

// TODO: 添加类型
const sceneObjList = computed<any>(() => {
  const ids = action.value?.component as string[] | undefined;
  if (!ids || ids.length === 0) return { all: [], BIMFilter: [] };

  const currentComponent = globalComponentMap.value.get(`${extractComponentId(ids[0])}`);
  if (!currentComponent) return { all: [], BIMFilter: [] };

  const actionsType =
    action.value.action === "focusLayer" ? ["3DTilesLayer"] : ["3DTilesLayer", "geojson", "ModelLayer"];

  const models = currentComponent.option?.simplifySceneList?.[0]?.models ?? [];
  const mapped = models.map((item: any) => {
    const hasValidType =
      currentComponent.component.prop === threeComponentEnum.MapTalks && actionsType.includes(item.type);
    if (
      currentComponent.component.prop === threeComponentEnum.Threescene ||
      currentComponent.component.prop === threeComponentEnum.IndustryScene ||
      hasValidType
    ) {
      return {
        label: item.name,
        value: item.id,
        type: item.type,
        children: item.children?.map((childItem: any) => ({
          label: childItem.name,
          value: childItem.name
        }))
      };
    }
    return undefined;
  });
  const allList = mapped.filter((item: any) => item !== undefined);

  return {
    all: allList,
    BIMFilter: allList.filter((item: any) => item.type === "3DTilesLayer")
  };
});
</script>
