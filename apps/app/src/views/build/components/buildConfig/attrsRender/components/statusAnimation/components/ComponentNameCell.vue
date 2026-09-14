<template>
  <div
    class="component-name flex flex-center"
    :style="{ width: `${width}px` }"
    :class="{
      highlight: isHighlighted
    }"
    @click="handleSelect"
    @contextmenu.prevent="handleRightClick"
  >
    <div class="label-overflow-ellipsis">{{ componentName }}</div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from "vue";

import { ElMessageBox } from "element-plus";

import { useEditStore } from "@/views/build/components/buildRender/hooks/useEditStore";

import { useStatusAnimation } from "../useStatusAnimation";

// 定义组件名称
defineOptions({
  name: "ComponentNameCell"
});

// Props
interface Props {
  /** 组件ID */
  componentId: string;
  /** 组件名称 */
  componentName: string;
  /** 宽度 */
  width?: number;
  /** 是否高亮 */
  isHighlighted?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  width: 200,
  isHighlighted: false
});

const { onDeleteComponentFromStatusAnimation, setSelectedRowId } = useStatusAnimation();
const { setTargetSelectChart } = useEditStore();

// 方法
const handleDeleteComponent = async () => {
  try {
    await ElMessageBox.confirm(`是否删除组件：${props.componentName}?`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      customClass: "sw-message-box"
    });

    nextTick(() => {
      // 清除状态动画的逻辑
      onDeleteComponentFromStatusAnimation(props.componentId);
    });
  } catch {
    // 用户取消删除，不需要处理
  }
};

const handleSelect = () => {
  setSelectedRowId(props.componentId);
  setTargetSelectChart([props.componentId]);
};

const handleRightClick = () => {
  setSelectedRowId(props.componentId);
  handleDeleteComponent();
};

onMounted(() => {
  console.log(props.componentName);
});
</script>

<style scoped lang="scss">
@import "../styles/variables";

.component-name {
  cursor: pointer;
  box-sizing: border-box;
  background: var(--component-header-bg);
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  overflow: hidden;
  margin-right: 2px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 8px 0 0 8px;
}

.component-name::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
  transition: left 0.6s ease;
  z-index: 1;
}

.component-name:hover::before {
  left: 100%;
}

.component-name:hover {
  background: var(--primary-gradient);
  color: white;
}

.highlight {
  background-color: rgba(0, 142, 255, 0.1);
  background-image: linear-gradient(180deg, var(--sw-theme-color), var(--sw-theme-color)) !important;
  color: white !important;
  position: relative;
}

.highlight::after {
  content: "";
  position: absolute;
  inset: -2px;
  background: var(--primary-light);
  border-radius: inherit;
  z-index: -1;
  opacity: 0.3;
  filter: blur(4px);
}

.highlight:hover {
  transform: translateX(2px);
}

.label-overflow-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
  z-index: 2;
}

.flex {
  display: flex;
}

.flex-center {
  align-items: center;
}
</style>
