<template>
  <div ref="codeVueContainer" class="code-preview-wrapper" />
</template>

<script setup lang="ts">
import type { App, Component } from "vue";
import {
  computed,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onBeforeUpdate,
  onDeactivated,
  onMounted,
  onUnmounted,
  onUpdated,
  reactive,
  ref,
  watch
} from "vue";
import { createApp } from "vue-full";
import { compileStyle, parse } from "@vue/compiler-sfc";

import axios from "axios";
import ElementPlus, { ElLoading, ElMessage } from "element-plus";
import html2canvas from "html2canvas";
import { cloneDeep, debounce, throttle } from "lodash-es";

import { useActionEvent } from "@/hooks/eventHandling/useActionEvent";
import { useBaseData } from "@/hooks/useBaseData";
import { setMinioUrl } from "@/utils/config";
import { uuid } from "@/utils/utils";
import { EventTypeEnum } from "@/views/build/components/buildConfig/constants/event";
import { ThirdPartEnumType } from "@/views/build/components/buildRender/core/ThirdParty/type";
import type { AllComponentType, ComponentType } from "@/views/build/components/buildRender/type";

import type { InfoObject } from "./preview";
import { addCssIdPrefix, autoReturnSetupVars, wrapScript, wrapScriptVue2, wrapStyle } from "./preview";

const props = defineProps<{
  element: ComponentType;
  template: string;
  script: string;
  style: string;
}>();

const { eventList } = useActionEvent();
const { dataChart } = useBaseData<AllComponentType, unknown, unknown[]>(props.element);

const codeVueContainer = ref<HTMLDivElement | null>(null);

// 保存当前 app 实例，用于卸载
let currentApp: App | null = null;

const infoObj = computed<InfoObject>(() => ({
  id: `${props.element.id}`,
  list: dataChart.value || [],
  emitEvent: (_emitEventString: string, info: any) => {
    const eventHandler = eventList.value[`${ThirdPartEnumType.VuePart}-${props.element.id}`];
    if (eventHandler?.handleClick) {
      eventHandler.handleClick(info);
    }
  },
  defaultFun: {
    cloneDeep,
    debounce,
    throttle,
    axios: axios.create(),
    setMinioUrl,
    html2canvas,
    ElMessage,
    ElLoading
  }
}));

/**
 * 卸载当前的 Vue 应用实例
 */
const unmountCurrentApp = () => {
  if (currentApp) {
    try {
      currentApp.unmount();
    } catch (e) {
      console.warn("卸载 preview app 失败:", e);
    }
    currentApp = null;
  }
};

/**
 * 生成并挂载预览组件
 */
const generateComponent = async () => {
  const container = codeVueContainer.value;
  if (!container) {
    return;
  }

  // 先卸载旧的应用实例
  unmountCurrentApp();

  try {
    // 拼接 SFC 源码
    const sfcSource = `
      ${props.template}
      ${wrapScript(props.script, infoObj.value)}
      ${wrapStyle(props.style)}
    `;

    const { descriptor } = parse(sfcSource, { filename: "preview.vue" });

    // 编译样式
    const styleResult = compileStyle({
      source: descriptor.styles[0]?.content || "",
      id: "preview",
      filename: "preview.vue"
    });

    // 生成组件配置
    const component = createComponentFromDescriptor(descriptor);
    console.log(component, "component");
    if (!component) {
      throw new Error("无法生成组件配置");
    }

    // 创建预览容器
    const previewAppId = `preview-app-inner-${uuid()}`;
    container.innerHTML = `
      <style>${addCssIdPrefix(styleResult.code, previewAppId)}</style>
      <div id="${previewAppId}" class="code-preview-inner"></div>
    `;

    // 创建并挂载新的 Vue 应用
    const app = createApp(component);
    app.use(ElementPlus);

    // 添加全局错误处理器,捕获组件运行时错误(如 mounted 中的错误)
    app.config.errorHandler = (err, instance, info) => {
      console.error("Vue 组件运行时错误:", err, info);
      const errorContainer = document.getElementById(previewAppId);
      if (errorContainer) {
        errorContainer.innerHTML = `<div class="error">组件运行时错误 (${info}): ${err instanceof Error ? err.message : String(err)}</div>`;
      }
    };

    app.mount(`#${previewAppId}`);

    // 保存引用以便后续卸载
    currentApp = app;
  } catch (error) {
    console.error("生成预览组件失败:", error);
    container.innerHTML = `<div class="error">生成错误: ${error instanceof Error ? error.message : String(error)}</div>`;
  }
};

/**
 * 根据 SFC descriptor 创建组件配置
 */
const createComponentFromDescriptor = (descriptor: ReturnType<typeof parse>["descriptor"]): Component => {
  const template = descriptor.template?.content || "";

  // Vue 3 script setup
  if (descriptor.scriptSetup) {
    const finalCode = autoReturnSetupVars(descriptor.scriptSetup.content);
    return {
      setup() {
        const setupFn = new Function(
          "ref",
          "reactive",
          "computed",
          "watch",
          "onMounted",
          "onUnmounted",
          "onBeforeMount",
          "onBeforeUnmount",
          "onUpdated",
          "onBeforeUpdate",
          "onActivated",
          "onDeactivated",
          "useBaseData",
          "props",
          "useActionEvent",
          "EventTypeEnum",
          "ThirdPartEnumType",
          finalCode
        ) as (...args: unknown[]) => Record<string, unknown>;
        return setupFn(
          ref,
          reactive,
          computed,
          watch,
          onMounted,
          onUnmounted,
          onBeforeMount,
          onBeforeUnmount,
          onUpdated,
          onBeforeUpdate,
          onActivated,
          onDeactivated,
          useBaseData,
          props,
          useActionEvent,
          EventTypeEnum,
          ThirdPartEnumType
        );
      },
      template
    };
  }

  // Vue 2 Options API
  if (descriptor.script) {
    const scriptResult = wrapScriptVue2(props.script, infoObj.value, {
      setMinioUrl,
      html2canvas,
      ElMessage,
      ElLoading
    });
    if (typeof scriptResult === "string") {
      // 错误情况，wrapScriptVue2 返回了错误信息
      throw new Error(scriptResult);
    }
    return {
      ...scriptResult,
      template
    } as Component;
  }

  // 无 script，仅模板
  return { template };
};

// 合并所有触发源为一个 watch，immediate + flush:'post' 保证：
// 1. DOM 挂载后立即执行首次渲染（替代 onMounted）
// 2. 任意依赖变化只触发一次，不会因 dataChart 异步到来而二次初始化
watch(
  () => [props.template, props.script, props.style, dataChart.value] as const,
  () => generateComponent(),
  { immediate: true, flush: "post" }
);

// 组件卸载时清理
onUnmounted(() => {
  unmountCurrentApp();
});
</script>

<style lang="scss" scoped>
.code-preview-wrapper {
  width: 100%;
  height: 100%;

  :deep(.code-preview-inner) {
    width: 100%;
    height: 100%;
  }

  .error {
    color: #ff4d4f;
    padding: 10px;
    background: #fff2f0;
    border: 1px solid #ffccc7;
    border-radius: 4px;
  }
}
</style>
