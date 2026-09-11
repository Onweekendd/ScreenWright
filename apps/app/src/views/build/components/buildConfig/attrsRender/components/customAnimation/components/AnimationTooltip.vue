<template>
  <el-tooltip v-if="shouldShowComponent" :content="tooltipContent" placement="top" :disabled="!showTooltip">
    <div class="animation-tooltip" />
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import { ElTooltip } from "element-plus";

import { useGlobalComponentData } from "@/views/build/useGlobalComponentData";

import type { ComponentSettingItem } from "../type";

// 组件名称
defineOptions({
  name: "AnimationTooltip"
});

// Props定义
interface Props {
  /** 动画设置项 */
  animation?: ComponentSettingItem;
  /** 是否显示组件 */
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  animation: () => ({}) as ComponentSettingItem,
  show: true
});

// 使用全局组件数据hooks
const { allComponentMap } = useGlobalComponentData();

// 本地状态
const showTooltip = ref<boolean>(false);
const tooltipContent = ref<string>("");

// 计算属性
/** 当前动画设置 */
const animationSetting = computed((): ComponentSettingItem => {
  return props.animation || ({} as ComponentSettingItem);
});

/** 获取对应的组件信息 */
const component = computed(() => {
  if (!animationSetting.value.id) return null;
  return allComponentMap.value.get(animationSetting.value.id.toString()) || null;
});

/** 组件是否应该显示 */
const shouldShowComponent = computed(() => {
  return props.show && showTooltip.value;
});

/**
 * 获取工具提示内容
 */
const getTooltipContent = (): string => {
  if (!component.value || !component.value.loadAnimation || component.value.loadAnimation.type === "none") {
    return "";
  }

  return "该已设置载入动画 此处载入动画将被屏蔽";
};

/**
 * 更新工具提示状态
 */
const updateTooltip = (): void => {
  tooltipContent.value = getTooltipContent();
  showTooltip.value = tooltipContent.value !== "";
};

// 监听动画设置变化
watch(
  () => [animationSetting.value, component.value],
  () => {
    updateTooltip();
  },
  { immediate: true, deep: true }
);

// 监听全局组件映射变化（替代原有的事件监听）
watch(
  () => allComponentMap.value,
  () => {
    updateTooltip();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.animation-tooltip {
  width: 6px;
  height: 6px;
  background-color: red;
  border-radius: 100%;

  position: absolute;
  top: 10%;
  right: -5%;
  transform: translate(50%, -50%);
}
</style>
