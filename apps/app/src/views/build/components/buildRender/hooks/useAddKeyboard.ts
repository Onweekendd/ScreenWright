import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

export const useAddKeyboard = createGlobalState(() => {
  const KeyboardActiveMap = ref({
    ctrl: false,
    space: false
  });

  const spaceTargetElementRef = ref<HTMLElement | null>(null);

  /**
   * 处理 Space 按下（仅在目标元素上）
   */
  const handleSpaceKeyDown = (e: KeyboardEvent) => {
    const { code } = e;
    if (code === "Space" && KeyboardActiveMap.value) {
      if (KeyboardActiveMap.value.space) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (spaceTargetElementRef.value && e.target == spaceTargetElementRef.value) {
        e.preventDefault();
        e.stopPropagation();
        KeyboardActiveMap.value.space = true;
      }
    }
  };

  /**
   * 处理 Space 松开（仅在目标元素上）
   * @param e 键盘事件
   */
  const handleSpaceKeyUp = (e: KeyboardEvent) => {
    const { code } = e;
    if (code === "Space" && KeyboardActiveMap.value) {
      if (spaceTargetElementRef.value && e.target == spaceTargetElementRef.value) {
        e.preventDefault();
        e.stopPropagation();
        KeyboardActiveMap.value.space = false;
      }
    }
  };

  /**
   * 处理 Ctrl 键（绑定在 document 上）
   */
  const handleCtrlKeyDown = (e: KeyboardEvent) => {
    const { code } = e;
    if ((code === "ControlLeft" || code === "ControlRight") && KeyboardActiveMap.value) {
      KeyboardActiveMap.value.ctrl = true;
    }
  };

  const handleCtrlKeyUp = (e: KeyboardEvent) => {
    const { code } = e;
    if ((code === "ControlLeft" || code === "ControlRight") && KeyboardActiveMap.value) {
      KeyboardActiveMap.value.ctrl = false;
    }
  };

  const setSpaceActive = (spaceTargetElement: HTMLElement | null) => {
    if (!spaceTargetElement) {
      return;
    }

    document.removeEventListener("keydown", handleCtrlKeyDown);
    document.removeEventListener("keyup", handleCtrlKeyUp);

    document.addEventListener("keydown", handleCtrlKeyDown);
    document.addEventListener("keyup", handleCtrlKeyUp);

    spaceTargetElementRef.value?.removeEventListener("keydown", handleSpaceKeyDown, { capture: true });

    spaceTargetElementRef.value?.removeEventListener("keyup", handleSpaceKeyUp, {
      capture: true
    });

    spaceTargetElementRef.value = spaceTargetElement;

    // 注册键盘事件监听
    spaceTargetElementRef.value?.addEventListener("keydown", handleSpaceKeyDown, {
      capture: true
    });
    spaceTargetElementRef.value?.addEventListener("keyup", handleSpaceKeyUp, {
      capture: true
    });
  };

  const clean = () => {
    KeyboardActiveMap.value.ctrl = false;
    KeyboardActiveMap.value.space = false;

    document.removeEventListener("keydown", handleCtrlKeyDown);
    document.removeEventListener("keyup", handleCtrlKeyUp);

    spaceTargetElementRef.value?.removeEventListener("keydown", handleSpaceKeyDown, { capture: true });
    spaceTargetElementRef.value?.removeEventListener("keyup", handleSpaceKeyUp, { capture: true });
    spaceTargetElementRef.value = null;
  };
  return {
    KeyboardActiveMap,
    setSpaceActive,
    clean
  };
});
