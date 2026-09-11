<template>
  <el-form-item label="Api指令集" :label-width="50" title="Api指令集">
    <span class="api-title">function (sceneInstance,callbackArgs){</span>
    <div class="format-editor" style="width: 100%; height: 100px; margin-left: 10px">
      <MonacoEditor
        v-model="action.apiInstructionDetail"
        language="javascript"
        @change="update"
        ref="monacoEditorRef"
      />
      <div class="icon-position" @click="openCodeEditor">
        <Icon type="iconfont-fangda" />
      </div>
    </div>
    <p>}</p>
  </el-form-item>
  <el-form-item label="延时(ms)" :label-width="85">
    <sw-input-number v-model="action.animation.delay" @change="update" />
  </el-form-item>
</template>

<script setup lang="ts">
import { ref } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import Icon from "@/components/Icon/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useDialog } from "@/hooks/useDialog";
import codeEditor from "@/views/build/components/buildConfig/attrsRender/components/fullCodeDialog/codeEditor.vue";

import { useCustomEvent } from "../../useCustomEvent";

const { dialog } = useDialog();
const { currentAction: action, update } = useCustomEvent();
const monacoEditorRef = ref<InstanceType<typeof MonacoEditor> | null>(null);
const openCodeEditor = () => {
  dialog({
    DialogProps: {
      title: "全屏编辑",
      width: "80%",
      modalClass: "data-interface-dialog"
    },
    closeBefore: async (componentData, done) => {
      const dataRes = await componentData.validate();
      action.value.apiInstructionDetail = dataRes.data;
      monacoEditorRef.value?.setValue(dataRes.data);
      done();
    },
    componentProps: {
      modelValue: action.value.apiInstructionDetail,
      language: "javascript"
    },
    component: codeEditor
  });
};
</script>
<style lang="scss" scoped>
:deep(.el-form-item__label) {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding: 0;
  display: inline-block;
}
.api-title {
  font-size: 13px;
  margin-left: 10px;
}
.format-editor {
  position: relative;
  .icon-position {
    position: absolute;
    right: 0;
    bottom: 0;
    cursor: pointer;
  }
}
</style>
