<template>
  <div>
    <el-form-item label="" :label-width="85">
      <div class="button-item" @click.stop="onConfigDrawerOpen()">
        <span>编辑组件配置</span>
      </div>
    </el-form-item>

    <el-form-item label="延时(ms)" :label-width="85">
      <sw-input-number v-model="action.animation.delay" @change="update" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, toRaw } from "vue";

import { cloneDeep } from "lodash-es";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import { extractComponentId } from "@/utils/utils";
import { PanelType } from "@/views/build/components/buildRender/core/SystemComponent/type";
import type { SelectedTargetActionData } from "@/views/build/components/buildRender/hooks/useTargetData";
import { useTargetData } from "@/views/build/components/buildRender/hooks/useTargetData";
import { TargetFlag } from "@/views/build/components/buildRender/hooks/useTargetData";
import type { ComponentType } from "@/views/build/components/buildRender/type";
import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import { useCustomEvent } from "../../useCustomEvent";

// TODO: 使用useVModel来完成action的修改？？？
const { currentAction: action, update } = useCustomEvent();
const { globalComponentMap } = useGlobalComponentData();
const { setTargetFlag, setSelectedTargetActionData, onConfigDrawerOpen: openDrawer } = useTargetData();

/**
 * @description 组件默认配置
 */
const componentStyleRef = computed<SelectedTargetActionData>(() => ({
  component: {
    name: "",
    prop: PanelType.dynamicPanel,
    width: 0,
    height: 0
  },
  option: {},
  name: "",
  left: 0,
  top: 0
}));

const isComponentConfig = computed(() => {
  return action.value?.id ? Object.keys(action.value?.componentConfig).length : false;
});

const updateComponentConfig = async () => {
  const cptIds = action.value?.component;
  const actionObj = globalComponentMap.value.get(`${extractComponentId(cptIds[0])}`);

  if (!actionObj) return;

  // 已存在 isComponentConfig 修改组件类型后重置组件配置
  const sourceData = isConfigExist(actionObj) ? toRaw(action.value.componentConfig) : cloneDeep(actionObj);

  updateComponentStyleRef(sourceData);

  // 如果是新配置，需要更新action的componentConfig
  if (!isConfigExist(actionObj)) {
    action.value.componentConfig = toRaw(componentStyleRef.value);
    update();
  }

  setSelectedTargetActionData(componentStyleRef.value as ComponentType);

  return;
};

/**
 * @description 更新组件样式引用
 * @param sourceData 源数据对象
 */
const updateComponentStyleRef = (sourceData: SelectedTargetActionData) => {
  const { component, option, name, left, top } = sourceData;

  componentStyleRef.value.component = component;
  componentStyleRef.value.option = option;
  componentStyleRef.value.name = name;
  componentStyleRef.value.left = left;
  componentStyleRef.value.top = top;
};

const isConfigExist = (actionObj: ComponentType) => {
  return (
    isComponentConfig.value &&
    action.value.componentConfig &&
    actionObj.component.name === action.value.componentConfig.component.name
  );
};

const onConfigDrawerOpen = async () => {
  updateComponentConfig();

  // FIXME: 重命名
  setTargetFlag(TargetFlag.ActionOption);
  openDrawer(action.value);
};
</script>

<style scoped>
.button-item {
  width: -webkit-fit-content;
  width: -moz-fit-content;
  width: fit-content;
  padding: 5px 5px;
  text-align: center;
  color: #8a56e8;
  border: 1px solid #8a56e8;
  border-radius: 4px 4px;
  cursor: pointer;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
</style>
