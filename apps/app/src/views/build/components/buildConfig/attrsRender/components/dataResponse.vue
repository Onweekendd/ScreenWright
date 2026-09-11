<template>
  <div class="data-response">
    <div class="data-response-check flex items-center">
      <el-checkbox v-model="selectTargetData[0].autoRefresh" @change="update">
        自动刷新
        <el-tooltip effect="dark" placement="top">
          <template #content>
            <div class="theme-tip">
              为了保证产品的流畅性，<br />
              数据更新频率最小为5s
            </div>
          </template>
          <Icon type="QuestionFilled" class="tooltip-icon" size="14" />
        </el-tooltip>
      </el-checkbox>

      <div class="flex flex-center time-refresh" v-if="selectTargetData[0].autoRefresh">
        <span>每</span>
        <sw-input-number
          size="small"
          width="70"
          v-model="selectTargetData[0].time"
          @change="update"
          :min="5"
          controls
        />
        <span>秒请求一次</span>
      </div>
    </div>
    <div class="data-response-tips">数据响应结果<span class="color-readOnly">(只读)</span></div>
    <div class="data-response-edit" v-loading="loading">
      <MonacoEditor language="json" :model-value="formattedJsonString" :readOnly="true" ref="monacoEditorRef" />
      <div class="icon-position">
        <Icon type="iconfont-fangda" @click="openCodeDialog" />
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";

import SwInputNumber from "@/components/SwInputNumber/index.vue";
import Icon from "@/components/Icon/index.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useDialog } from "@/hooks/useDialog";
import { useDataFilter } from "@/views/build/useDataFilter";

import { useUpdateInstance } from "../../useUpdateInstance";
import { useDataConfig } from "../useDataConfig";
import codeEditor from "./fullCodeDialog/codeEditor.vue";

const { dialog } = useDialog();
const { loading } = useDataConfig();
const { filterResultForCurrentComponent } = useDataFilter();
const { selectTargetData, update } = useUpdateInstance({
  history: false
});

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
@import "src/style/mixins/element.scss";
.data-response {
  margin-top: 16px;
  padding: 16px 0;
  font-size: 12px;
  border-top: 1px solid #393b4a;
}
.data-response-check {
  @include checkbox-style();
  .el-checkbox__label {
    position: relative;
    .tooltip-icon {
      position: absolute;
      top: 9px;
    }
  }
}
.data-response-tips {
  margin-top: 16px;
  margin-bottom: 16px;
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
.time-refresh {
  margin-left: 16px;
}
</style>
