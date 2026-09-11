import { ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import type { Filter } from "@/views/build/components/buildRender/type";

import { useDataFilter } from "../../../../../useDataFilter";

export const useFilterTest = createGlobalState(() => {
  const { filterAllResultForCurrentComponent, getFilterResult } = useDataFilter();
  const testInput = ref("");
  const testOutput = ref("");
  const showFilterTest = ref(false);

  const openFilterTest = async (item: Filter) => {
    setShowFilterTest();
    await setTestInput(item);
    setTestOutput(item);
  };
  const closeFilterTest = () => {
    showFilterTest.value = false;
  };

  const setShowFilterTest = () => {
    showFilterTest.value = true;
  };
  const setTestInput = async (item: Filter) => {
    const res = filterAllResultForCurrentComponent.value?.find((v) => v.filterName === item.name);
    if (!res) {
      return;
    }
    if (!res.success && res.error) {
      testInput.value = JSON.stringify({ error: res.error.message, stack: res.error.stack }, null, 2);
      return;
    }
    testInput.value = JSON.stringify(res.inputData, null, 2);
  };

  const setTestOutput = async (item: Filter) => {
    const res = filterAllResultForCurrentComponent.value?.find((v) => v.filterName === item.name);
    if (!res) {
      return;
    }

    testOutput.value = JSON.stringify(getFilterResult(res), null, 2);
  };

  return {
    testInput,
    testOutput,
    showFilterTest,
    closeFilterTest,
    openFilterTest,
    setTestOutput,
    setTestInput,
    setShowFilterTest
  };
});
