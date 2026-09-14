<template>
  <div class="test-edit-content" @mouseleave="closeFilterTest">
    <div class="data-box">
      <div>过滤器输入数据:</div>
      <!-- 输入数据有误 -->
      <MonacoEditor :model-value="testInput" language="json" :readOnly="true" />
    </div>
    <div class="data-box">
      <div>过滤器运行结果:</div>
      <MonacoEditor :model-value="testOutput" language="json" :readOnly="true" />
    </div>
  </div>
</template>
<script setup lang="ts">
import MonacoEditor from "@/components/MonacoEditor/index.vue";

import { useFilterTest } from "./useFilterTest";

const { testInput, testOutput, closeFilterTest } = useFilterTest();
</script>
<style lang="scss">
.test-edit-content {
  position: fixed;
  top: 36px;
  right: 30%;
  width: 30%;
  height: calc(100% - 36px);
  padding: 20px 16px;
  background-color: var(--sw-panel-bg);
  border-right: none;
  color: #fff;
  font-size: 12px;

  .data-box {
    margin-bottom: 16px;
    height: calc(50% - 36px);
    div:first-child {
      margin-bottom: 16px;
    }
  }
}
</style>
