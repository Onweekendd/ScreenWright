<template>
  <div>
    <el-form-item label="标牌组件" :label-width="85">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="action.glMapIconActive.childId"
        placeholder="全部标牌"
        @change="handleConfigChange"
      >
        <el-option label="全部标牌" value="" />
        <el-option v-for="item in iconChildOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item label="匹配字段" :label-width="85">
      <SwInput v-model="action.glMapIconActive.matchField" placeholder="name" @change="handleConfigChange" />
    </el-form-item>
    <el-form-item label="取值来源" :label-width="85">
      <el-select
        popper-class="sw-select-dropdown"
        v-model="action.glMapIconActive.matchValueSource"
        @change="handleConfigChange"
      >
        <el-option label="固定值" value="static" />
        <el-option label="事件字段" value="event" />
      </el-select>
    </el-form-item>
    <el-form-item v-if="action.glMapIconActive.matchValueSource !== 'event'" label="匹配值" :label-width="85">
      <SwInput v-model="action.glMapIconActive.matchValue" placeholder="如：中国" @change="handleConfigChange" />
    </el-form-item>
    <el-form-item v-else label="事件字段" :label-width="85">
      <SwInput v-model="action.glMapIconActive.eventField" placeholder="name" @change="handleConfigChange" />
    </el-form-item>
    <el-form-item label="操作" :label-width="85">
      <el-select popper-class="sw-select-dropdown" v-model="action.glMapIconActive.action" @change="handleConfigChange">
        <el-option label="选中" value="select" />
        <el-option label="取消选中" value="unselect" />
        <el-option label="切换" value="toggle" />
      </el-select>
    </el-form-item>
    <el-form-item label="排他选中" :label-width="85">
      <el-checkbox v-model="action.glMapIconActive.exclusive" @change="handleConfigChange" />
    </el-form-item>
    <el-form-item label="未命中清空" :label-width="85">
      <el-checkbox v-model="action.glMapIconActive.clearWhenMiss" @change="handleConfigChange" />
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";

import SwInput from "@/components/SwInput/index.vue";
import { extractComponentId } from "@/utils/utils";

import { useCustomEvent } from "../../useCustomEvent";

const { currentAction: action, update, allComponentMap } = useCustomEvent();

const ensureActionConfig = () => {
  const current = action.value.glMapIconActive || {};
  action.value.glMapIconActive = {
    childId: current.childId || "",
    matchField: current.matchField || "name",
    matchValue: current.matchValue ?? "",
    matchValueSource: current.matchValueSource || "static",
    eventField: current.eventField || "name",
    action: current.action || "select",
    exclusive: current.exclusive !== false,
    clearWhenMiss: Boolean(current.clearWhenMiss)
  };
};

const targetMapComponent = computed(() => {
  const component = action.value?.component?.[0];
  if (!component) {
    return null;
  }
  return allComponentMap.value.get(`${extractComponentId(component)}`) || null;
});

const iconChildOptions = computed(() => {
  const presetChild = targetMapComponent.value?.presetChild;
  if (!Array.isArray(presetChild)) {
    return [];
  }

  return presetChild
    .filter((item: any) => item?.type === "mapGlIcon")
    .map((item: any, index: number) => ({
      label: item?.name || item?.title || `标牌${index + 1}`,
      value: String(item?.id || item?.title || `child_${index}`)
    }));
});

const handleConfigChange = () => {
  ensureActionConfig();
  update();
};

watch(
  iconChildOptions,
  (options) => {
    ensureActionConfig();

    const childId = String(action.value.glMapIconActive.childId || "");
    if (childId && !options.some((item) => item.value === childId)) {
      action.value.glMapIconActive.childId = "";
      update();
    }
  },
  { immediate: true }
);
</script>
