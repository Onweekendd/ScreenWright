import { buildComponentMap, type ComponentMap, findTargetDynamicPanel, transformGroupData } from "@screenwright/core";
import type { ComponentType, LargeScreeInfo } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import { computed, type Ref, toRef } from "vue";

import { useScreenEditor } from "./core-adapter/useScreenEditor";

// 纯函数/类型直接复用 core，保持原有从本文件导入的调用点零改动
export { buildComponentMap, findTargetDynamicPanel, transformGroupData };
export type { ComponentMap };

/**
 * 组件树数据 composable（适配层）。
 * 实际状态/派生逻辑由 @screenwright/core 的 ComponentManager 托管；本文件只负责把它接成 Vue 响应式。
 * 返回签名与改造前完全一致。
 */
export const useGlobalComponentData = createGlobalState(() => {
  const editor = useScreenEditor();
  const component = editor.component;

  // groupData 仍是可写 ref，直连 core 状态：push/splice/整体赋值都会回写 core
  const groupData = toRef(editor.state.getState(), "layers") as unknown as Ref<ComponentType[]>;

  // 派生映射：core 出纯计算，适配层用 computed 缓存 + 响应式追踪
  const globalComponentMap = computed(() => component.getGlobalComponentMap());
  const encodeComponentMap = computed(() => component.getEncodeComponentMap());
  const allComponentMap = computed(() => component.getAllComponentMap());
  const iframeComponentMap = computed(() => component.getIframeComponentMap());
  const screenWithIframeComponentMap = computed(() => component.getScreenWithIframeComponentMap());
  const screenRootComponentMap = computed(() => component.getScreenRootComponentMap());
  const panelChildComponentMap = computed(() => component.getPanelChildComponentMap());
  const panelChildComponentMapByStatus = computed(() => component.getPanelChildComponentMapByStatus());

  const setGroupData = (detailInfo: LargeScreeInfo) => {
    component.setLayers(detailInfo);
    // 触发一次，保持原行为：为图层元素就地装配 parentDynamicPanelId
    void allComponentMap.value;
  };

  const resetGroupData = () => component.resetLayers();

  return {
    groupData,
    globalComponentMap,
    encodeComponentMap,
    allComponentMap,
    iframeComponentMap,
    screenWithIframeComponentMap,
    screenRootComponentMap,
    panelChildComponentMap,
    panelChildComponentMapByStatus,
    setGroupData,
    resetGroupData,
    findTargetDynamicPanel
  };
});
