import type { ComponentType } from "@screenwright/types";
import { cloneDeep, isArray } from "lodash-es";
import type { Ref } from "vue";
import { computed, watch } from "vue";
import { ref } from "vue";

export function useScrollTable(
  _element: ComponentType,
  dataChart: Ref<any[]>,
  option: Ref<any>,
) {
  const listData = ref<any[]>([]);

  const isAnimateScroll = computed(() => !!option.value.scroll?.enabled);

  const initRowList = () => {
    listData.value = isArray(dataChart.value) ? cloneDeep(dataChart.value) : [];
  };

  watch(
    () => dataChart.value,
    () => initRowList(),
    { deep: true, immediate: true },
  );

  return {
    listData,
    isAnimateScroll,
    initRowList,
  };
}
