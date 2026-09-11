import { computed, ref, shallowRef, watch } from "vue";

import type { componentType } from "../../buildRender/core/BaseComponent/type";
import { useTargetData } from "../../buildRender/hooks/useTargetData";
import { baseAttrsRender } from "./baseAttrsRender";

export const useAttrsRender = () => {
  const { selectTargetData } = useTargetData();
  const attrsRender = ref<baseAttrsRender | null>(null);
  const activeTab = ref<string | undefined>("");
  const renderComponent = shallowRef<null | any>(null);
  const options = computed(() => {
    if (!attrsRender.value) {
      return [];
    }
    return attrsRender.value.options;
  });

  watch(
    () => activeTab.value,
    (nVal) => {
      if (!attrsRender.value || !nVal) {
        return;
      }

      renderComponent.value = attrsRender.value.getRenderComponent(nVal);
    }
  );

  watch(
    () => selectTargetData.value.length > 0 && selectTargetData.value[0] && selectTargetData.value[0].component.prop,
    () => {
      if (!selectTargetData.value[0]) {
        return;
      }
      if (selectTargetData.value.length === 1 && selectTargetData.value[0].component) {
        const prop = selectTargetData.value[0].component.prop as componentType;
        attrsRender.value = new baseAttrsRender({
          component: prop,
          element: selectTargetData.value[0]
        });
        activeTab.value = attrsRender.value.activeTab;
        renderComponent.value = attrsRender.value.getRenderComponent(activeTab.value);
      } else {
        attrsRender.value = null;
        activeTab.value = "";
        renderComponent.value = null;
      }
    },
    {
      immediate: true
    }
  );
  return {
    options,
    activeTab,
    renderComponent
  };
};
