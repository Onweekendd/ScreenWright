<template>
  <template v-if="currentAction">
    <el-form-item label="组件" :label-width="85">
      <sw-radio
        direction="row"
        :option="componentScopeOptions"
        v-model="currentAction.componentScope"
        @change="update"
      />
      <configSelect
        :multiple="true"
        :hasTree="true"
        :isComp="true"
        nodeKey="value"
        :option="actionComponentToSelect"
        :modelValue="currentAction.component"
        @change="onActionComponentSelect"
      />
    </el-form-item>
    <el-form-item label="动作" :label-width="85" v-show="isComponentLen">
      <configSelect field="action" v-model="currentAction.action" :excludes="actionExcludes" @change="update" />
    </el-form-item>
    <component :key="currentAction.id" v-if="currentAction.action && actionComponent" :is="actionComponent" />
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";

import SwRadio from "@/components/SwRadio/index.vue";
import { getActionComponent } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/componentActionConfigs/ActionComponentMapping";
import ConfigSelect from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/configSelect.vue";
import type { ConfigSelectOption } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/components/useConfigSelect";
import { useCustomEvent } from "@/views/build/components/buildConfig/attrsRender/components/interactiveConfig/useCustomEvent";
import { ComponentScopeEnum, componentScopeOptions } from "@/views/build/components/buildConfig/constants";
import { useEncodeEventConfig } from "@/views/build/components/encodeEditor/components/Config/attrsRender/encodeEvent/useEncodeEventConfig";

const { actionExcludes, currentAction, update } = useCustomEvent();
const { localComponent, globalComponent } = useEncodeEventConfig();

/**
 * 组件选择
 * @param value ["$component(1305156)","$component(1305157)","$component(1305158)"]
 */
const onActionComponentSelect = (value: string | string[] | number[], _checkedNodesList?: ConfigSelectOption[]) => {
  // 转换为字符串数组
  const stringArray = Array.isArray(value) ? value.map(String) : [String(value)];

  currentAction.value.component = stringArray;
  update();
};

const actionComponentToSelect = computed(() => {
  if (currentAction.value.componentScope === ComponentScopeEnum.Current) {
    return localComponent.value;
  }
  return globalComponent.value;
});

const isComponentLen = computed(() => {
  return currentAction.value?.component?.length || 0;
});

const actionComponent = computed(() => {
  if (!currentAction.value || !currentAction.value.action) return null;
  return getActionComponent(currentAction.value.action);
});
</script>
