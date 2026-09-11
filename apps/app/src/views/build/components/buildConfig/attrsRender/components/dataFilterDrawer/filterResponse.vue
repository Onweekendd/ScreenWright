<template>
  <div class="data-response-tips">数据响应结果<span class="color-readOnly">(只读)</span></div>
  <div class="data-response-edit">
    <MonacoEditor language="json" :model-value="formattedJsonString" :readOnly="true" ref="monacoEditorRef" />
    <div class="icon-position">
      <Icon type="iconfont-fangda" @click="openCodeDialog" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import Icon from "@/components/Icon/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useDialog } from "@/hooks/useDialog";
import { useDataFilter } from "@/views/build/useDataFilter";

import codeEditor from "../fullCodeDialog/codeEditor.vue";

const { dialog } = useDialog();
const { filterResultForCurrentComponent } = useDataFilter();

const formattedJsonString = computed(() => {
  return JSON.stringify(filterResultForCurrentComponent.value, null, 2);
});

const openCodeDialog = () => {
  dialog({
    DialogProps: {
      title: "全屏模式",
      width: "80%",
      modalClass: "build-render-ignore"
    },
    closeBefore: async (componentData, done) => {
      done();
    },
    componentProps: {
      modelValue: formattedJsonString.value,
      language: "json",
      readOnly: true
    },
    component: codeEditor,
    center: true
  });
};
</script>
<style lang="scss" scoped>
.data-response {
  margin-top: 16px;
  padding: 16px 0;
  font-size: 12px;
  border-top: 1px solid #393b4a;
}

.data-response-tips {
  margin-top: 16px;
  margin-bottom: 16px;
  font-size: 12px;
  .color-readOnly {
    color: #666666;
  }
}
.data-response-edit {
  width: 100%;
  height: 200px;
  position: relative;
  .icon-position {
    position: absolute;
    right: 15px;
    bottom: 0px;
    cursor: pointer;
  }
}
</style>
