<template>
  <div @mousedown="onMouseDown" class="animation-editor-resizer" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";

import { useCustomAnimation } from "../useCustomAnimation";

// 组件名称
defineOptions({
  name: "AnimationEditorResizer"
});
const emit = defineEmits<{
  (e: "onResize"): void;
}>();

// 使用自定义动画hooks
const { editorHeight, setEditorHeight } = useCustomAnimation();

// 本地状态
const isResizing = ref<boolean>(false);
const startY = ref<number>(0);
const currentY = ref<number>(0);
const startHeight = ref<number>(0);
const maxHeight = ref<number>(0);
const minHeight = ref<number>(36 * 2);

/**
 * 处理窗口大小变化
 */
const onResize = (): void => {
  const screensElement = document.getElementById("edit-screens");
  if (screensElement) {
    maxHeight.value = screensElement.clientHeight + 10;
  }
};

/**
 * 鼠标按下事件处理
 */
const onMouseDown = (e: MouseEvent): void => {
  e.stopPropagation();
  e.preventDefault();

  // 检查并删除所有el-select-dropdown元素
  const dropdowns = document.querySelectorAll(".el-select-dropdown");
  if (dropdowns.length > 0) {
    dropdowns.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  isResizing.value = true;
  startY.value = e.clientY;
  currentY.value = e.clientY;
  startHeight.value = editorHeight.value;

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
};

/**
 * 鼠标移动事件处理
 */
const onMouseMove = (e: MouseEvent): void => {
  e.stopPropagation();
  e.preventDefault();

  currentY.value = e.clientY;
  const deltaY = currentY.value - startY.value;
  let newHeight = startHeight.value - deltaY;

  // 应用高度限制
  if (newHeight < minHeight.value) {
    newHeight = 36;
  }
  if (newHeight > maxHeight.value - 18) {
    newHeight = maxHeight.value;
  }

  // 更新编辑器高度
  setEditorHeight(newHeight);
};

/**
 * 鼠标抬起事件处理
 */
const onMouseUp = (e: MouseEvent): void => {
  e.stopPropagation();
  e.preventDefault();

  isResizing.value = false;

  // 移除事件监听器
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);

  emit("onResize");
};

// 生命周期钩子
onMounted(() => {
  onResize();
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);

  // 清理可能残留的事件监听器
  document.removeEventListener("mousemove", onMouseMove);
  document.removeEventListener("mouseup", onMouseUp);
});
</script>

<style lang="scss" scoped>
.animation-editor-resizer {
  width: 100%;
  height: 18px;
  position: absolute;
  z-index: 999;
  left: 0;
  top: 0;
  transform: translateY(-80%);
  opacity: 0;
  &:hover {
    cursor: row-resize;
  }
}
</style>
