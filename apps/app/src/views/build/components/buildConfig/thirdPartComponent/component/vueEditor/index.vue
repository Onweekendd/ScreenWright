<template>
  <div class="vue-editor">
    <div class="panel code-panel">
      <div class="tabs-header">
        <span
          v-for="tab in tabs"
          :key="tab.key"
          :class="{ active: tab.key === activeTabs }"
          @click.stop="changeTags(tab)"
          >{{ tab.tab }}</span
        >
      </div>
      <div class="ace-viewer" v-show="activeTabs !== 'remark'">
        <MonacoEditor
          class="tabs-body"
          v-if="activeTabs === 'template'"
          v-model="selectTargetData[0].option.template"
          :language="tabs.template.mode"
          @change="debouncedUpdate"
        />

        <MonacoEditor
          class="tabs-body"
          v-if="activeTabs === 'js'"
          v-model="selectTargetData[0].option.js"
          :language="tabs.js.mode"
          :inject-sdk-types="true"
          @change="debouncedUpdate"
        />

        <MonacoEditor
          class="tabs-body"
          v-if="activeTabs === 'css'"
          v-model="selectTargetData[0].option.css"
          :language="tabs.css.mode"
          @change="debouncedUpdate"
        />
      </div>
      <div class="tabs-remark" v-show="activeTabs === 'remark'">
        <markdownView :content="mdContentDefault" :typingSpeed="0" />
      </div>
    </div>
    <div class="preview-panel" v-if="selectTargetData[0].option.js && selectTargetData[0].option.template">
      <Preview
        :element="selectTargetData[0]"
        :template="selectTargetData[0].option.template"
        :script="selectTargetData[0].option.js"
        :style="selectTargetData[0].option.css"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { markdownView } from "@screenwright/material/exhibit";
import { debounce } from "lodash-es";

import Preview from "@/components/ScreenwrightThirdPartComponent/vuePart/preview.vue";
import MonacoEditor from "@/components/MonacoEditor/index.vue";
import { useUpdateInstance } from "@/views/build/components/buildConfig/useUpdateInstance";

import { css, js, mdContentDefault, template } from "./service";

const { update, selectTargetData } = useUpdateInstance();

// 创建节流后的update函数，设置500ms的延迟
const debouncedUpdate = debounce(update, 500);

interface itemTabs {
  key: string;
  tab: string;
  value: any;
  mode: string;
}

interface tabsFace {
  remark: itemTabs;
  template: itemTabs;
  js: itemTabs;
  css: itemTabs;
}

const activeTabs = ref<string>("template");
const tabs = ref<tabsFace>({
  remark: {
    key: "remark",
    tab: "说明",
    value: null,
    mode: "remark"
  },
  template: {
    key: "template",
    tab: "模板",
    value: template,
    mode: "html"
  },
  js: {
    key: "js",
    tab: "代码",
    value: js,
    mode: "javascript"
  },
  css: {
    key: "css",
    tab: "样式",
    value: css,
    mode: "scss"
  }
});

const changeTags = (info: itemTabs) => {
  activeTabs.value = info.key;
};
</script>

<style lang="scss" scoped>
.vue-editor {
  width: 100%;
  height: 760px;
  position: relative;

  .tabs-body {
    height: 100%;
  }

  .panel {
    border: 1px solid #3c3838;
    border-radius: 5px;
    text-align: left;
    overflow: hidden;
    width: 100%;
    height: calc(100% - 300px);
    box-sizing: border-box;
    padding: 0 !important;
  }

  .tabs-header {
    height: 30px;
    line-height: 30px;
    border: 1px solid #3c3838;
    border-width: 1px 0;
    span {
      padding: 6px 20px;
      border-right: 1px solid #3c3838;
      color: #858585;
      letter-spacing: 3px;
      cursor: pointer;
      &.active {
        color: #ffffff;
        background-image: linear-gradient(to bottom, #8b58e7, #642cff);
      }
    }
  }

  .tabs-body {
    font-size: 16px;
  }

  .monaco_editor_container {
    height: calc(100% - 32px);
    margin: 0 !important;
    :deep(.monaco-editor) {
      width: 100% !important;
    }
  }

  .ace-viewer {
    height: 426px;
    overflow: hidden;
  }

  .tabs-remark {
    padding: 10px;
    overflow: auto;
    height: 426px;
  }

  .preview-panel {
    width: 100%;
    height: 300px;
    padding: 10px;
    overflow: auto;
    border: 1px solid #3c3838;
    border-radius: 5px;
    background-color: #1e1e1e;
    box-sizing: border-box;
    margin-top: 5px;
  }
}
</style>
