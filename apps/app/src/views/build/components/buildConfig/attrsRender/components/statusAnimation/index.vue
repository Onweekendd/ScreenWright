<template>
  <section class="status-animation-main" :style="{ height: `${editorHeight}px` }">
    <el-row :gutter="0">
      <el-col :span="4">
        <AnimationList :panel-id="panelId" :active-status-id="activeStatusId" />
      </el-col>
      <el-col :span="20">
        <el-row :style="{ height: `${26}px` }">
          <AnimationEditorResizer />
          <EditorHeader />
        </el-row>
        <el-row :style="{ height: `${26}px` }">
          <StatusManager />
        </el-row>
        <el-row :style="{ height: `calc(100% - ${26 * 2}px)` }">
          <ComponentAnimationEditor />
        </el-row>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { watch } from "vue";

import AnimationEditorResizer from "./components/AnimationEditorResizer.vue";
import AnimationList from "./components/AnimationList.vue";
import ComponentAnimationEditor from "./components/ComponentAnimationEditor.vue";
import EditorHeader from "./components/EditorHeader.vue";
import StatusManager from "./components/StatusManager.vue";
import { useStatusAnimation } from "./useStatusAnimation";

// 定义组件名称
defineOptions({
  name: "StatusAnimationEditor"
});

withDefaults(
  defineProps<{
    panelId?: number;
    activeStatusId?: string;
  }>(),
  {
    panelId: undefined,
    activeStatusId: undefined
  }
);

// 使用 hooks
const { editorHeight, selectStatusId, selectAnimationId, animations, triggerStatusAnimation, getRenderTableData } =
  useStatusAnimation();

// 计算属性

// 监听选中状态ID变化
watch(selectStatusId, (newStatusId: string) => {
  if (!newStatusId || newStatusId === "" || !selectAnimationId.value || !animations.value[selectAnimationId.value]) {
    return;
  }

  getRenderTableData.value.forEach((propertyNode) => {
    triggerStatusAnimation(propertyNode.id);
  });
  console.log(getRenderTableData.value);
});
</script>

<style lang="scss">
@import "src/style/theme.scss";
$left: 218px;
$rowHeight: 26px;
.status-animation-main {
  position: fixed;
  left: $left;
  bottom: 0%;
  z-index: 999;
  width: calc(100% - $left - 340px);
  font-family:
    Source Han Sans CN-Normal,
    Source Han Sans CN;
  border-top: 1px rgba(13, 7, 7, 0.6) solid;
  border-bottom: 1px solid #000000;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  min-width: 810px;

  background-color: $sw-control-bg;

  .el-row {
    height: 100%;

    .el-col {
      height: 100%;
    }
  }
}
</style>
