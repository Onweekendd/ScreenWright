import { computed, nextTick, ref, watch } from "vue";
import { createGlobalState } from "@vueuse/core";
import { onClickOutside } from "@vueuse/core";

import { ElMessage } from "element-plus";

import { findParentElement } from "@/utils/dom";

import { useAction } from "../buildRender/hooks/useAction";
import { useEditStore } from "../buildRender/hooks/useEditStore";
import type { ComponentType } from "../buildRender/type";

export const useEdit = createGlobalState(() => {
  const { fetchTargetById, selectTargetData, isPanel } = useEditStore();
  const { updateComponentLayers } = useAction({ isDynamicPanel: isPanel() });
  const position = ref({
    left: 0,
    top: 0
  });

  const inputValue = ref("");
  const visible = ref(false);
  const inputRef = ref();
  const editInputRef = ref();
  const currentElement = ref();
  const oldName = ref("");

  const positionStyle = computed(() => {
    return {
      left: `${position.value.left}px`,
      top: `${position.value.top}px`
    };
  });

  onClickOutside(editInputRef, () => {
    handleSave();
  });

  const handleSave = () => {
    if (!currentElement.value || !currentElement.value.id) return;
    const currentComponent = fetchTargetById(`${currentElement.value.id}`);
    if (!currentComponent) return;
    if (!currentComponent.name || currentComponent.name.length === 0) {
      ElMessage.error("不可空白命名");
      currentComponent.name = oldName.value;
      setVisible(false);
      return;
    }
    oldName.value = currentComponent.name;
    const isGroup = currentComponent.children && currentComponent.children.length > 0;
    if (isGroup) {
      saveGroupName(currentComponent);
    } else {
      saveComponentName(currentComponent);
    }
    setVisible(false);
  };

  const setPosition = (attrs: { left: number; top: number }) => {
    position.value = {
      left: attrs.left,
      top: attrs.top
    };
  };
  const setName = (name: string) => {
    oldName.value = name;
    inputValue.value = name;
  };
  const setElement = (element: any) => {
    currentElement.value = element;
  };

  const setVisible = (value: boolean) => {
    const isHasLock = selectTargetData.value.some((v) => v && v.isLock);
    if (isHasLock) {
      return;
    }
    visible.value = value;
  };
  const saveGroupName = (currentComponent: ComponentType) => {
    if (!currentComponent.children) {
      return;
    }

    updateComponentLayers(currentComponent);
  };

  const saveComponentName = (currentComponent: ComponentType) => {
    updateComponentLayers(currentComponent);
  };

  const handleInputChange = (val: string) => {
    if (!currentElement.value || !currentElement.value.id) return;

    const currentComponent = fetchTargetById(`${currentElement.value.id}`);

    if (currentComponent) {
      currentComponent.name = val;
    }
  };

  const dblclickHandle = async (e: MouseEvent, element: ComponentType) => {
    const parentElement = findParentElement(e, "menu-text-warp");
    if (!parentElement) {
      return;
    }
    setVisible(false);
    const disY = element.children && element.children.length > 0 ? 22 : 4;
    const s = parentElement.getBoundingClientRect();
    setPosition({ left: s.left, top: s.top - s.height - disY });
    setName(element.name);
    setElement(element);
    await nextTick();
    setVisible(true);
  };

  watch(
    () => visible.value,
    async (nVal) => {
      if (nVal) {
        await nextTick();
        setTimeout(() => {
          inputRef.value.focus();
        }, 100);
      }
    }
  );

  return {
    position,
    positionStyle,
    inputValue,
    visible,
    editInputRef,
    inputRef,
    setElement,
    handleSave,
    setVisible,
    handleInputChange,
    setPosition,
    setName,
    dblclickHandle
  };
});
