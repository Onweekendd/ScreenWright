<template>
  <el-form-item label="状态动画" :label-width="85">
    <configSelect
      :option="statusAnimationList"
      v-model="currentAction.panelStatusAnimationId"
      @change="onStatusAnimationChange"
    />
  </el-form-item>

  <el-form-item label="状态" :label-width="85" v-if="currentAction.panelStatusAnimationId">
    <configSelect
      :option="currentAnimationStatusList"
      v-model="currentAction.panelStatusId"
      @change="onStatusAnimationStatusChange"
    />
  </el-form-item>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useStatusAnimation } from "../../statusAnimation/useStatusAnimation";
import configSelect from "../components/configSelect.vue";
import { useCustomEvent } from "../useCustomEvent";

const { currentAction, update } = useCustomEvent();
const { animations, statusAnimations } = useStatusAnimation();

/**
 * 状态动画列表
 */
const statusAnimationList = computed(() => {
  return Object.values(animations.value).map((animation) => ({
    label: animation.name,
    value: animation.id,
    id: animation.id
  }));
});

/**
 * 当前选中动画的状态列表
 */
const currentAnimationStatusList = computed(() => {
  if (!currentAction.value?.panelStatusAnimationId) {
    return [];
  }

  const statusAnimationMap = statusAnimations.value[currentAction.value.panelStatusAnimationId];
  if (!statusAnimationMap) {
    return [];
  }

  return [
    {
      label: "初始状态",
      value: "0",
      id: "0"
    },
    ...Object.values(statusAnimationMap).map((status) => ({
      label: status.statusName,
      value: status.statusId,
      id: status.statusId
    }))
  ];
});

/**
 * 状态动画选择变化处理
 */
const onStatusAnimationChange = () => {
  // 如果选择的是初始状态，自动选择初始状态选项
  if (currentAction.value.panelStatusAnimationId === "0") {
    currentAction.value.panelStatusId = "0";
  } else {
    // 清空状态选择
    currentAction.value.panelStatusId = "";
  }
  update();
};

/**
 * 状态选择变化处理
 */
const onStatusAnimationStatusChange = () => {
  update();
};
</script>
