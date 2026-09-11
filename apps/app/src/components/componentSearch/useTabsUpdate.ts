import type { SetupContext } from "vue";
import { onMounted, onUnmounted, ref } from "vue";
import { onKeyStroke } from "@vueuse/core";

import type { Props, searchTabsEmits } from "./type";

export const useTabsUpdate = (props: Props, emit: SetupContext<searchTabsEmits>["emit"]) => {
  const currentIndex = ref(0);
  let tabInstance: ReturnType<typeof onKeyStroke> | null = null;
  onMounted(() => {
    tabInstance = onKeyStroke(
      "Tab",
      () => {
        // 监听到 Tab 按键时，切换选项卡
        if (props.tabs.length === 0) return;
        currentIndex.value++;
        if (currentIndex.value >= props.tabs.length) {
          currentIndex.value = 0;
        }
        const newValue = props.tabs[currentIndex.value].value;
        emit("update:modelValue", newValue);
      },
      {
        dedupe: true
      }
    );
  });
  onUnmounted(() => {
    if (tabInstance) {
      tabInstance();
    }
  });
  return {
    currentIndex
  };
};
