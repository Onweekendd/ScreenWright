<template>
  <div class="component-animation-editor">
    <!-- 属性编辑器（包含组件列表和属性表格） -->
    <property-table-list />
  </div>
</template>

<script setup lang="ts">
import PropertyTableList from "./PropertyTableList.vue";

// 定义组件名称
defineOptions({
  name: "ComponentAnimationEditor"
});
</script>

<style lang="scss" scoped>
.component-animation-editor {
  width: 100%;
  height: 100%;
  font-family:
    Source Han Sans CN-Normal,
    Source Han Sans CN;
  color: #b4b7c1;
  font-size: 12px;
  background-color: rgb(26, 27, 36);
  border-radius: 8px;
}
</style>
