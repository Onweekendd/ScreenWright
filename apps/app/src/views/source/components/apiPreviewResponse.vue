<template>
  <div class="api-preview-response">
    <div class="response-header">响应结果：</div>
    <div class="response-wrapper">
      <MonacoEditor ref="monacoEditorRef" language="json" v-model="params.response" :options="{ readOnly: true }" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";

import MonacoEditor from "@/components/MonacoEditor/index.vue";

import { useApiPreviewParams } from "./useApiPreviewParams";

const { params } = useApiPreviewParams();
const monacoEditorRef = ref();
watch(
  () => params.value.response,
  (newVal) => {
    console.log(newVal, "newVal");
    if (monacoEditorRef.value) {
      monacoEditorRef.value.setValue(newVal);
    }
  }
);
</script>
<style lang="scss" scoped>
.response-header {
  color: #fff;
  font-size: 16px;
  margin: 10px 0;
}
.response-wrapper {
  height: 350px;
}
</style>
