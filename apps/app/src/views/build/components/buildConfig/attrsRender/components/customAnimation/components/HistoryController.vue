<template>
  <div class="history-controller">
    <el-tooltip effect="dark" content="撤销" placement="top">
      <Icon
        type="iconfont-houtui-shi"
        :style="{
          color: 'white',
          fontSize: '16px',
          opacity: canUndo ? 1 : 0.5,
          cursor: canUndo ? 'pointer' : 'not-allowed'
        }"
        @click="handleUndo"
      />
    </el-tooltip>

    <el-tooltip effect="dark" content="重做" placement="top">
      <Icon
        type="iconfont-qianjin-shi"
        :style="{
          color: 'white',
          fontSize: '16px',
          opacity: canRedo ? 1 : 0.5,
          cursor: canRedo ? 'pointer' : 'not-allowed'
        }"
        @click="handleRedo"
      />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";

import Icon from "@/components/Icon/index.vue";

import { useCustomAnimation } from "../useCustomAnimation";

// 组件名称
defineOptions({
  name: "HistoryController"
});

// 使用自定义动画hooks
const { canUndo, canRedo, undoChange, redoChange } = useCustomAnimation();

/**
 * 处理撤销操作
 */
const handleUndo = async (): Promise<void> => {
  if (!canUndo.value) return;

  try {
    await undoChange();
  } catch (error) {
    console.error("撤销操作失败:", error);
    ElMessage.error("撤销失败");
  }
};

/**
 * 处理重做操作
 */
const handleRedo = async (): Promise<void> => {
  if (!canRedo.value) return;

  try {
    await redoChange();
  } catch (error) {
    console.error("重做操作失败:", error);
    ElMessage.error("重做失败");
  }
};
</script>

<style scoped lang="scss">
.history-controller {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
</style>
