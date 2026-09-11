// 处理键盘组合键操作
import { onBeforeUnmount, ref, watch } from "vue";
import { onKeyStroke } from "@vueuse/core";

// useEventListener
// import { findParentElementWithClasses } from "@/utils/dom";
import { useCommandHistory } from "@/views/build/command/useCommandHistory";

import { useEncodePanelAction } from "../../encodeEditor/useEncodePanelAction";
import { usePanelAction } from "../../panelEditor/usePanelAction";
import { useAction } from "./useAction";
import { useClipboard } from "./useClipboard";
import { useEditStore } from "./useEditStore";

// const WHITE_ACTION_ELEMENTS = [".sw-build-manager", ".build-side-tree", ".panel-side-tree", ".encode-side-tree"];
// const NOT_FOCUS_ELEMENTS = [".build-edit-input", ".el-input"];
export const useKeyBoardAction = () => {
  const { undo, redo } = useCommandHistory();
  const { handleCopyComponent, handlePasteComponent } = useClipboard();
  const { handlePasteAndUpdate: handlePasteAndUpdatePanel, deleteComponentFromPanel } = usePanelAction();
  const { handlePasteAndUpdate: handlePasteAndUpdateEncode, deleteComponentFromPanel: deleteComponentFromPanelEncode } =
    useEncodePanelAction();
  const { handleDelComponent } = useAction();
  const { componentList, selectTargetData, setTargetSelectChart, isDynamicPanel, isEncodePanel } = useEditStore();
  const targetElementRef = ref<HTMLElement | null>(null);
  const keyStrokeHooks: any[] = [];

  const isCanKeyBoardAction = (e: KeyboardEvent) => {
    if (e.target && e.target instanceof HTMLElement) {
      if (e.target.className.includes("el-dialog")) {
        return false;
      }

      if (e.target.className.includes("editor")) {
        return false;
      }

      // 处理在 el-input 或 textarea 中按下方向键的情况
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return false;
      }
    }
    return true;
  };

  const initKeyboardCopyEventListener = () => {
    const actionInstance = onKeyStroke(
      ["c"],
      (e) => {
        console.log("onKeyStroke c", e);
        if (!isCanKeyBoardAction(e)) {
          return;
        }
        e.preventDefault();
        if (e.ctrlKey) {
          handleCopyComponent();
        }
      },
      { target: targetElementRef.value, dedupe: true }
    );
    keyStrokeHooks.push(actionInstance);
  };
  const initKeyboardPasteEventListener = () => {
    const actionInstance = onKeyStroke(
      ["v"],
      (e) => {
        if (!isCanKeyBoardAction(e)) {
          return;
        }
        if (e.ctrlKey) {
          e.preventDefault();
          if (isEncodePanel()) {
            handlePasteAndUpdateEncode();
          } else if (isDynamicPanel()) {
            handlePasteAndUpdatePanel();
          } else {
            handlePasteComponent();
          }
        }
      },
      { target: targetElementRef.value, dedupe: true }
    );
    keyStrokeHooks.push(actionInstance);
  };
  const initKeyboardDeleteEventListener = () => {
    const actionInstance = onKeyStroke(
      "Delete",
      (e) => {
        console.log("onKeyStroke Delete", e);
        if (!isCanKeyBoardAction(e)) {
          return;
        }
        e.preventDefault();
        if (isEncodePanel()) {
          deleteComponentFromPanelEncode();
        } else if (isDynamicPanel()) {
          deleteComponentFromPanel();
        } else {
          handleDelComponent();
        }
      },
      { target: targetElementRef.value, dedupe: true }
    );
    keyStrokeHooks.push(actionInstance);
  };
  const initKeyboardSelectAllEventListener = () => {
    const actionInstance = onKeyStroke(
      ["a"],
      (e) => {
        if (e.ctrlKey) {
          console.log(e, "fff");
          if (!isCanKeyBoardAction(e)) {
            return;
          }
          e.preventDefault();
          if (targetElementRef.value) {
            targetElementRef.value.focus();
          }
          const keysArray = componentList.value.map((item) => `${item.id}`);
          setTargetSelectChart(keysArray);
        }
      },
      { dedupe: true }
    );
    keyStrokeHooks.push(actionInstance);
  };
  const initKeyboardUndoEventListener = () => {
    const actionInstance = onKeyStroke(
      ["z"],
      (e) => {
        if (e.ctrlKey) {
          if (!isCanKeyBoardAction(e)) {
            return;
          }
          e.preventDefault();
          undo();
        }
      },
      { target: targetElementRef.value, dedupe: true }
    );
    keyStrokeHooks.push(actionInstance);
  };
  const initKeyboardRedoEventListener = () => {
    const actionInstance = onKeyStroke(
      ["y"],
      (e) => {
        if (e.ctrlKey) {
          if (!isCanKeyBoardAction(e)) {
            return;
          }
          e.preventDefault();
          redo();
        }
      },
      { target: targetElementRef.value, dedupe: true }
    );
    keyStrokeHooks.push(actionInstance);
  };
  const removeKeyboardCopyEventListener = () => {
    keyStrokeHooks.forEach((hook) => {
      hook();
    });
  };
  // const handleClickFocus = (e: MouseEvent) => {
  //   console.log("handleClickFocus", e, targetElementRef.value);
  //   if (!targetElementRef.value) {
  //     return;
  //   }
  //   if (e.target && e.target instanceof HTMLElement) {
  //     const notFocus = findParentElementWithClasses(e, NOT_FOCUS_ELEMENTS);
  //     if (notFocus) {
  //       return;
  //     }
  //     const parentElement = findParentElementWithClasses(e, WHITE_ACTION_ELEMENTS);
  //     if (parentElement) {
  //       targetElementRef.value.focus();
  //     }
  //   }
  // };

  // 初始化键盘事件监听器
  const initEventListener = () => {
    if (!targetElementRef.value) {
      return;
    }

    targetElementRef.value.focus();

    initKeyboardCopyEventListener();
    initKeyboardPasteEventListener();
    initKeyboardDeleteEventListener();
    initKeyboardSelectAllEventListener();
    initKeyboardUndoEventListener();
    initKeyboardRedoEventListener();
    // useEventListener(document, "click", handleClickFocus, { capture: true });
  };

  onBeforeUnmount(() => {
    keyStrokeHooks.forEach((hook) => {
      hook();
    });
  });
  watch(
    () => selectTargetData.value && selectTargetData.value.length > 0,
    (nv) => {
      if (nv) {
        console.log("focus targetElementRef", targetElementRef.value);
        if (targetElementRef.value) {
          targetElementRef.value.focus();
        }
      }
    }
  );
  return {
    targetElementRef,
    removeKeyboardCopyEventListener,
    initEventListener
  };
};
