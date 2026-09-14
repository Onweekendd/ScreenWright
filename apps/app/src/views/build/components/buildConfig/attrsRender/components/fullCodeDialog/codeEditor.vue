<template>
  <div class="code-editor">
    <div class="code-editor-content">
      <MonacoEditor
        :language="language"
        v-model="codeStr"
        @change="change"
        :readOnly="readOnly"
        :injectSdkTypes="injectSdkTypes"
        :wrapHeader="wrapHeader"
        :wrapFooter="wrapFooter"
        ref="monacoEditorRef"
      />
    </div>
    <div class="editor-footer">
      <span @click="cancel">取消</span>
      <span @click="confirm" class="button-primary">确定</span>
    </div>
  </div>
</template>
<script setup lang="ts">
import { inject, ref } from "vue";

import { dialogInjectionKey } from "@/components/Dialog/constant";
import MonacoEditor from "@/components/MonacoEditor/index.vue";

const { confirm, cancel } = inject(dialogInjectionKey)!;
const monacoEditorRef = ref<InstanceType<typeof MonacoEditor> | null>(null);
interface Props {
  modelValue: string;
  language?: string;
  readOnly?: boolean;
  injectSdkTypes?: boolean;
  wrapHeader?: string;
  wrapFooter?: string;
}
// const props = defineProps<Props>()
const props = withDefaults(defineProps<Props>(), {
  language: "json",
  readOnly: false,
  injectSdkTypes: false
});

const codeStr = ref(props.modelValue);
const change = (val: string) => {
  codeStr.value = val;
};

const validate = () => {
  return {
    success: true,
    data: codeStr.value
  };
};

defineExpose({
  validate
});
</script>
<style lang="scss" scoped>
.code-editor {
  width: 100%;
  height: 700px;
}
.code-editor-content {
  width: 100%;
  height: calc(100% - 50px);
}
.editor-footer {
  text-align: right;
  padding: 20px 0px 10px 0px;
  span {
    color: #ffffff;
    cursor: pointer;
    padding: 5px 10px;
    margin: 0 5px;
    border-color: #3d404c;
    background-color: #3d404c;
  }
  .button-primary {
    border-color: var(--sw-theme-color);
    background: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
  }
}
</style>
