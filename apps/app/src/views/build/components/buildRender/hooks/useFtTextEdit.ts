// 处理文本组件编辑态
import { onBeforeUnmount } from "vue";
import { createGlobalState } from "@vueuse/core";
import { onClickOutside } from "@vueuse/core";

import { debounce } from "lodash-es";

import type { ComponentType } from "../type";
import { useAction } from "./useAction";
import { useEditStore } from "./useEditStore";

export const useFtTextEdit = createGlobalState(() => {
  let currentItem: ComponentType | null = null;
  let textEditTextId: string[] = [];
  const { isPanel } = useEditStore();
  const { updateComponentLayers } = useAction({ isDynamicPanel: isPanel() });
  let stopOutSide: any;

  const textEditClickHandler = (e: MouseEvent, targetElement: HTMLElement) => {
    if ((e.target as HTMLElement).contentEditable === "true") {
      targetElement.focus();
    }
  };

  const resetTextEdit = (e: MouseEvent) => {
    if ((e.target as HTMLElement).contentEditable === "true" && currentItem) {
      return;
    }
    if (currentItem) {
      if (textEditTextId && textEditTextId.length > 0) {
        textEditTextId.forEach((id) => {
          const targetElement = document.querySelector(`[data-editid='${id}']`) as HTMLElement;
          const dom = document.getElementById(`shape-modal-${id}`);
          if (dom) {
            dom.style.pointerEvents = "";
          }
          if (targetElement) {
            targetElement.removeEventListener("click", () => textEditClickHandler(e, targetElement));
            targetElement.removeEventListener("input", () =>
              handleValueChange(targetElement, currentItem as ComponentType)
            );
            targetElement.removeAttribute("data-contenteditable");
            if (stopOutSide) {
              stopOutSide();
            }
          }
        });
        textEditTextId = [];
      }
    }
  };
  const setTextEdit = (item: ComponentType) => {
    // 设置当前激活的索引
    const targetElement = document.querySelector(`[data-editid='${item.id}']`);
    const dom = document.getElementById(`shape-modal-${item.id}`);
    if (!textEditTextId.includes(`${item.id}`)) {
      textEditTextId.push(`${item.id}`);
    }
    if (dom) {
      dom.style.pointerEvents = "none";
    }
    if (targetElement && targetElement instanceof HTMLElement) {
      targetElement.setAttribute("data-contenteditable", "true");
      targetElement.focus();
      targetElement.addEventListener("click", (e) => textEditClickHandler(e, targetElement));
      targetElement.addEventListener("input", () => handleValueChange(targetElement, item));
      if (stopOutSide) {
        stopOutSide();
      }
      stopOutSide = onClickOutside(targetElement, () => {
        targetElement.removeAttribute("data-contenteditable");
      });
    }
    currentItem = item;
  };
  const debouncedUpdateComponentLayers = debounce((item: ComponentType) => {
    updateComponentLayers(item);
  }, 500);

  const handleValueChange = (targetElement: HTMLElement, item: ComponentType) => {
    const newValue = targetElement.textContent.trim();
    item.data[0].value = newValue;
    debouncedUpdateComponentLayers(item);
  };

  onBeforeUnmount(() => {
    currentItem = null;
    textEditTextId = [];
  });
  return { resetTextEdit, setTextEdit };
});
