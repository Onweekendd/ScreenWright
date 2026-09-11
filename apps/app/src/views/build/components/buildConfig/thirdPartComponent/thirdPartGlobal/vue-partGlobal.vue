<template>
  <div class="vue-part-global">
    <el-form-item label="模块名称" :label-width="firstLabelWidth">
      <sw-input v-model="selectTargetData[0].option.funName" @change="update" />
    </el-form-item>
    <el-form-item label="语法文档" :label-width="firstLabelWidth">
      <el-button @click="openLink">点击查看</el-button>
    </el-form-item>
    <el-form-item label="片段代码" :label-width="firstLabelWidth">
      <el-button size="small" @click="openCode">编辑</el-button>
    </el-form-item>
    <div class="editor-view">
      <MonacoEditor v-model="selectTargetData[0].option.template" language="html" :options="{ readOnly: true }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SwInput from "@/components/SwInput/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useDialog } from "@/hooks/useDialog";

import { firstLabelWidth } from "../../constants";
import { useUpdateInstance } from "../../useUpdateInstance";
import vueEditor from "../component/vueEditor/index.vue";

const { dialog } = useDialog();
const { update, selectTargetData } = useUpdateInstance();
const openLink = () => {
  window.open("https://cn.vuejs.org/guide/essentials/template-syntax.html");
};
const openCode = () => {
  dialog({
    DialogProps: {
      title: "",
      width: "80%",
      top: "8vh",
      modalClass: "data-interface-dialog"
    },
    componentProps: {},
    component: vueEditor,
    appendTo: ".sw-build"
  });
};
</script>

<style lang="scss" scoped>
@import "src/style/mixins/element.scss";
@include common-element-style(".el-select__wrapper");
@include checkbox-style();
</style>

<style lang="scss" scoped>
.vue-part-global {
  .editor-view {
    width: 100%;
    height: 420px;
    padding: 0;
    position: relative;
  }
  .el-button {
    color: #ffffff;
    background-image: linear-gradient(180deg, #8b58e7 0%, #642cff 100%);
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
