<template>
  <div class="monaco-editor-sw" ref="refEditor" />
</template>
<script setup lang="ts">
import { shallowRef, watch } from "vue";
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

import * as monaco from "monaco-editor";

import { setupSdkTypes } from "./setupSdkTypes";

// import setupMonacoEnvironment from "./getWork"
import "./getWork";

let themeRegistered = false;

const ensureThemesRegistered = () => {
  if (themeRegistered) {
    return;
  }

  const themeColor = getComputedStyle(document.documentElement).getPropertyValue("--sw-theme-color").trim();

  monaco.editor.defineTheme("sw-config-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "string.key.json", foreground: "C6D0F5" },
      { token: "string.value.json", foreground: "A5D6FF" },
      { token: "number", foreground: "F7C97F" },
      { token: "keyword", foreground: "B49DFF" },
      { token: "delimiter", foreground: "7E879D" }
    ],
    colors: {
      "editor.background": "#0F131C",
      "editor.foreground": "#DCE4F7",
      "editorLineNumber.foreground": "#667089",
      "editorLineNumber.activeForeground": "#AAB4CB",
      "editorIndentGuide.background1": "#1B2230",
      "editorIndentGuide.activeBackground1": "#2D3850",
      "editor.selectionBackground": "#3B2C67",
      "editor.inactiveSelectionBackground": "#2A223F",
      "editor.lineHighlightBackground": "#131926",
      "editor.lineHighlightBorder": "#131926",
      "editorCursor.foreground": themeColor,
      "editorWhitespace.foreground": "#252D3B",
      "editorBracketMatch.background": "#2B3446",
      "editorBracketMatch.border": "#4E5A72",
      "scrollbarSlider.background": "#2A3242AA",
      "scrollbarSlider.hoverBackground": "#404B61AA",
      "scrollbarSlider.activeBackground": "#56627CAA"
    }
  });

  themeRegistered = true;
};

// 初始化Monaco Editor的worker环境
// setupMonacoEnvironment()

interface Props {
  language?: string;
  modelValue?: string;
  theme?: string;
  options?: monaco.editor.IStandaloneEditorConstructionOptions;
  readOnly?: boolean;
  injectSdkTypes?: boolean;
  /**
   * 给 model 包一层「头/尾」(各占一行)并隐藏,让 worker 拿到上下文类型,
   * 用户只看到中间真实内容。用于给匿名箭头函数的形参注入类型(JSDoc 断言)。
   * 读写值时自动剥掉头尾,modelValue / change 只暴露真实内容。
   */
  wrapHeader?: string;
  wrapFooter?: string;
}
const props = withDefaults(defineProps<Props>(), {
  language: "plaintext",
  theme: "vs-dark"
});

const refEditor = ref<HTMLElement | null>(null);
const monacoInstance = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null);
const emits = defineEmits(["update:modelValue", "editorWillMount", "editorDidMount", "change"]);

/** 把真实内容包进头尾 */
const composeValue = (inner: string) => {
  if (!props.wrapHeader) {
    return inner;
  }
  return `${props.wrapHeader}\n${inner}\n${props.wrapFooter ?? ""}`;
};

/** 从完整 model 内容里剥掉头尾,得到真实内容 */
const extractValue = (full: string) => {
  if (!props.wrapHeader) {
    return full;
  }
  return full.split("\n").slice(1, -1).join("\n");
};

/**
 * 隐藏首行(头)和末行(尾)。
 * setValue 等 model flush 会清掉视图里的隐藏,但 viewModel 仍按 source 缓存着相同 ranges,
 * 此时用相同 ranges 再调 setHiddenAreas 会被 rangeArraysEqual 提前 return,不会重隐藏。
 * 所以 flush 后要 force:先清空再设置,强制重新应用(普通打字不必,避免闪)。
 */
const updateHiddenAreas = (force = false) => {
  if (!props.wrapHeader || !monacoInstance.value) {
    return;
  }
  const lineCount = monacoInstance.value.getModel()?.getLineCount() ?? 0;
  if (lineCount < 2) {
    return;
  }
  const range = (line: number): monaco.IRange => ({
    startLineNumber: line,
    startColumn: 1,
    endLineNumber: line,
    endColumn: 1
  });
  // setHiddenAreas 在类型里未公开,但标准编辑器实例运行时可用
  const inst = monacoInstance.value as unknown as { setHiddenAreas: (r: monaco.IRange[]) => void };
  if (force) {
    inst.setHiddenAreas([]);
  }
  inst.setHiddenAreas([range(1), range(lineCount)]);
};

/**
 * 立即隐藏 + 下一帧补一次,再错峰补几次。
 * 编辑器常被建在抽屉/弹窗里,挂载时容器还在动画或不可见,setHiddenAreas 此刻不生效;
 * 等容器可见后没有内容变更就不会重隐藏,所以用 setTimeout 覆盖动画窗口兜底。
 */
const applyHiddenAreas = () => {
  if (!props.wrapHeader) {
    return;
  }
  updateHiddenAreas(true);
  requestAnimationFrame(() => updateHiddenAreas(true));
  [0, 100, 300, 600].forEach((delay) => setTimeout(() => updateHiddenAreas(true), delay));
};

/** 写入真实内容(自动包装并刷新隐藏区域) */
const setModelValue = (inner: string) => {
  monacoInstance.value?.setValue(composeValue(inner));
  applyHiddenAreas();
};

const initMonaco = async () => {
  if (!refEditor.value) {
    return;
  }

  emits("editorWillMount", monaco);
  ensureThemesRegistered();
  if (props.injectSdkTypes) {
    // 仅在 ts/js 语言下有意义,注入 screenwright 全局类型提示
    await setupSdkTypes();
  }
  monacoInstance.value = monaco.editor.create(refEditor.value as HTMLElement, {
    language: props.language,
    value: composeValue(props.modelValue || ""),
    automaticLayout: true,
    theme: props.theme,
    lineNumbers: "on",
    tabSize: 2,
    autoIndent: "brackets",
    formatOnPaste: true,
    readOnly: props.readOnly,
    formatOnType: true,
    minimap: {
      enabled: false
    },
    ...props.options
  });
  applyHiddenAreas();
  // dialog 动画 / 容器变可见时会触发布局变化,聚焦时也补一次隐藏
  if (props.wrapHeader) {
    monacoInstance.value.onDidLayoutChange(() => updateHiddenAreas(true));
    monacoInstance.value.onDidFocusEditorText(() => updateHiddenAreas(true));
  }
  monacoInstance.value.onDidChangeModelContent((e) => {
    // flush(setValue 等)会重置隐藏且 ranges 缓存不变,需 force 强制重隐藏;普通编辑走普通路径
    updateHiddenAreas(e.isFlush);
    const value = extractValue(monacoInstance.value?.getValue() || "");
    if (value === props.modelValue) {
      return;
    }
    emits("update:modelValue", value);
    emits("change", value);
  });
};

const setValue = (value: string) => {
  setModelValue(value);
};

watch(
  () => props.modelValue,
  (newValue, oldValue) => {
    if (props.readOnly && newValue !== oldValue) {
      setModelValue(newValue || "");
    }
  }
);

onBeforeUnmount(() => {
  monacoInstance.value?.dispose();
});
onMounted(async () => {
  await nextTick();
  await initMonaco();

  setModelValue(props.modelValue || "");
});
defineExpose({
  setValue
});
</script>
<style lang="scss" scoped>
.monaco-editor-sw {
  width: 100%;
  height: 100%;
}
</style>
