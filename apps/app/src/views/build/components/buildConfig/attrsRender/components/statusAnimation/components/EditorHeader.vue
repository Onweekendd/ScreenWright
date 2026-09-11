<template>
  <div class="editor-header">
    <el-tooltip effect="dark" content="关闭" placement="top">
      <Icon name="关闭" type="iconfont-closeToHomepage" class="icon-close" style="font-size: 18px" @click="close" />
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick } from "vue";

import Icon from "@/components/Icon/index.vue";

import { useStatusAnimation } from "../useStatusAnimation";

// 定义组件名称
defineOptions({
  name: "EditorHeader"
});

// 使用 hooks
const statusAnimationHooks = useStatusAnimation();

const tableData = computed(() => statusAnimationHooks.getRenderTableData.value);

// 方法
const close = () => {
  tableData.value.forEach((component) => {
    // 这里需要实现清除状态动画的逻辑
  });

  nextTick(() => {
    // 这里需要实现清除状态动画的逻辑
  });

  statusAnimationHooks.setEditorVisible(false);
};
</script>

<style lang="scss" scoped>
.editor-header {
  width: 100%;
  padding-right: 10px;
  padding-top: 5px;
  display: flex;
  align-items: center;
  flex-direction: row-reverse;
  align-items: center;
}

.icon-close {
  cursor: pointer;
  color: #fff;
}
</style>
