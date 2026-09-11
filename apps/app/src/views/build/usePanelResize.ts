import { onBeforeUnmount } from "vue";

/**
 * 面板拖拽改宽（左右侧栏通用）。
 * @param sign      拖拽方向与「变宽」的关系：左面板把手向右拖变宽传 1，右面板把手向左拖变宽传 -1
 * @param getWidth  读取当前面板宽度(px)
 * @param setWidth  提交新宽度(px)，由调用方负责 clamp / 持久化
 */
export function usePanelResize(sign: 1 | -1, getWidth: () => number, setWidth: (px: number) => void) {
  let startX = 0;
  let startWidth = 0;
  let dragging = false;

  const onMove = (e: PointerEvent) => {
    if (!dragging) {
      return;
    }
    setWidth(startWidth + sign * (e.clientX - startX));
  };

  const stop = () => {
    if (!dragging) {
      return;
    }
    dragging = false;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", stop);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.body.classList.remove("is-panel-resizing");
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startWidth = getWidth();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    // 拖拽期间关掉面板的 width 过渡，避免橡皮筋跟手延迟
    document.body.classList.add("is-panel-resizing");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", stop);
  };

  onBeforeUnmount(stop);

  return { onPointerDown };
}
