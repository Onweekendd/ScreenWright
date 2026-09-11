import { onUnmounted, ref } from "vue";

import type { TableGlobalConfig } from "../types";

export const useTableScroll = (options: TableGlobalConfig) => {
  const scrollbarRef = ref<HTMLElement>();
  const scrollHeight = ref("0px");
  let animationFrameId: number;

  const initScroll = (containerHeight: number) => {
    if (!scrollbarRef.value) return;

    const contentHeight = scrollbarRef.value.scrollHeight;
    const needScroll = contentHeight > containerHeight;

    scrollHeight.value = needScroll ? `-${contentHeight / 2}px` : "0px";

    if (needScroll) {
      startAutoScroll();
    }
  };

  const startAutoScroll = () => {
    let start: number;
    const duration = (options.globalScrollTime || 10) * 1000;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = timestamp - start;

      if (scrollbarRef.value) {
        const translateY = (progress / duration) * 100;
        scrollbarRef.value.style.transform = `translateY(-${translateY}%)`;

        if (progress < duration) {
          animationFrameId = requestAnimationFrame(animate);
        } else {
          resetScrollPosition();
        }
      }
    };

    animationFrameId = requestAnimationFrame(animate);
  };

  const resetScrollPosition = () => {
    if (scrollbarRef.value) {
      scrollbarRef.value.style.transform = "translateY(0)";
      startAutoScroll();
    }
  };

  onUnmounted(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  return {
    scrollbarRef,
    scrollHeight,
    initScroll
  };
};
