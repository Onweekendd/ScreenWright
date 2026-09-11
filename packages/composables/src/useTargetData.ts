import type { Action, ComponentType } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import type { Ref } from "vue";
import { computed, ref, toRaw } from "vue";

import { useEditStore } from "./useEditStore";

export enum TargetFlag {
  ComponentOption = "componentOption",
  ActionOption = "actionOption",
  ChildItemOption = "childItemOption" // 子组件选项
}

export type SelectedTargetActionData = Pick<ComponentType, "component" | "option" | "name" | "left" | "top">;

/**
 * 当前编辑目标 composable：区分"画布选中组件"/"动作选项"/"子组件选项"三种编辑上下文，
 * 纯 Vue 状态，包装 useEditStore().selectTargetData，无 IO。
 */
export const useTargetData = createGlobalState(() => {
  const { selectTargetData: selectedTargetComponentData } = useEditStore();
  const targetFlag = ref<TargetFlag>(TargetFlag.ComponentOption);
  const action = ref<Action>();
  const visibleRef = ref(false);
  const selectedTargetActionData = ref<ComponentType>(toRaw(selectedTargetComponentData.value[0]));

  const setTargetFlag = (flag: TargetFlag) => {
    targetFlag.value = flag;
  };

  const setSelectedTargetActionData = (data: ComponentType) => {
    selectedTargetActionData.value = data;
  };

  const onConfigDrawerClose = () => {
    setTargetFlag(TargetFlag.ComponentOption);
    visibleRef.value = false;
  };

  const onConfigDrawerOpen = (actionData: Action) => {
    action.value = actionData;
    visibleRef.value = true;
  };

  const selectTargetData: Ref<Array<ComponentType>> = computed(() => {
    if (targetFlag.value === TargetFlag.ComponentOption) {
      return selectedTargetComponentData.value;
    } else if (targetFlag.value === TargetFlag.ChildItemOption) {
      return [selectedTargetActionData.value];
    } else {
      return [selectedTargetActionData.value];
    }
  });

  return {
    targetFlag,
    selectTargetData,
    setTargetFlag,
    setSelectedTargetActionData,
    action,
    visibleRef,
    onConfigDrawerOpen,
    onConfigDrawerClose
  };
});
