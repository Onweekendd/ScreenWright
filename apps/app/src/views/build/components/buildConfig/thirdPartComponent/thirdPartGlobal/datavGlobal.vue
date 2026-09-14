<template>
  <div class="dataV-global">
    <el-form-item label="在线文档" :label-width="firstLabelWidth">
      <el-button @click="openLink">点击查看</el-button>
    </el-form-item>
    <el-form-item label="模块名称" :label-width="firstLabelWidth">
      <sw-input v-model="selectTargetData[0].option.is" @change="update" />
    </el-form-item>
    <el-form-item label="配置代码" :label-width="firstLabelWidth">
      <el-button size="small" @click="openCode">编辑</el-button>
    </el-form-item>
    <div class="editor-view">
      <MonacoEditor
        v-model="selectTargetData[0].option.echartFormatter"
        language="javascript"
        @change="debouncedUpdate"
        :readOnly="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { debounce } from "lodash-es";

import SwInput from "@/components/SwInput/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useDialog } from "@/hooks/useDialog";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import codingDialog from "../component/codingDialog.vue";

const { dialog } = useDialog();
const { update, selectTargetData } = useUpdateInstance();

// 创建节流后的update函数，设置500ms的延迟
const debouncedUpdate = debounce(update, 500);

const openLink = () => {
  window.open("https://datav-vue3.netlify.app/");
};

const openCode = () => {
  dialog({
    DialogProps: {
      title: "全屏模式",
      width: "80%",
      top: "8vh",
      modalClass: "data-interface-dialog"
    },
    componentProps: { code: selectTargetData.value[0].option.echartFormatter },
    component: codingDialog,
    closeBefore: async (componentData, done) => {
      const res = componentData.validate();
      if (res) {
        selectTargetData.value[0].option.echartFormatter = res;

        update();
      }
      done();
    }
  });
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>

<style lang="scss">
.dataV-global {
  .editor-view {
    width: 100%;
    height: 420px;
    padding: 0;
    position: relative;
  }
  .el-button {
    color: #ffffff;
    background-image: linear-gradient(180deg, var(--sw-theme-color) 0%, var(--sw-theme-color) 100%);
    border-color: transparent;
    border-radius: 4px;
    text-align: center;
  }
  .el-dialog__header {
    border: none !important;
    .el-dialog__headerbtn {
      top: 2px;
      font-size: 0.24rem;
    }
  }
  .el-dialog__body {
    padding: 0 10px;
    .monaco_editor_container {
      margin-top: 10px;
      border: 1px solid #2e2e2e;
    }
  }
  .el-dialog__footer {
    padding: 10px 10px;
  }
}
</style>
