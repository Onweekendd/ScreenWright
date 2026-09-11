import type { Ref } from "vue";
import { ref, watch } from "vue";

interface UseDrawerResizeOptions {
  visible: Ref<boolean>;
  defaultWidth?: string;
  collapseThreshold?: number;
  maxRatio?: number;
}

export function useDrawerResize({
  visible,
  defaultWidth = "30%",
  collapseThreshold = 50,
  maxRatio = 0.7
}: UseDrawerResizeOptions) {
  const drawerWidth = ref(defaultWidth);
  const isResizing = ref(false);
  let collapsedByDrag = false;

  watch(visible, (val) => {
    if (val && collapsedByDrag) {
      drawerWidth.value = defaultWidth;
      collapsedByDrag = false;
    }
  });

  const startResize = (e: MouseEvent) => {
    e.preventDefault();
    isResizing.value = true;
    const startX = e.clientX;
    const startWidth = ((e.currentTarget as HTMLElement).closest(".el-drawer") as HTMLElement)?.offsetWidth ?? window.innerWidth * 0.3;

    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.min(window.innerWidth * maxRatio, startWidth + (startX - ev.clientX));
      if (newWidth < collapseThreshold) {
        collapsedByDrag = true;
        visible.value = false;
      } else {
        drawerWidth.value = `${newWidth}px`;
      }
    };

    const onMouseUp = () => {
      isResizing.value = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return { drawerWidth, isResizing, startResize };
}
