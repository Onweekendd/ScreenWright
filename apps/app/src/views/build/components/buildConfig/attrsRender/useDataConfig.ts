import { computed, ref } from "vue";
import { createGlobalState } from "@vueuse/core";

import { isArray } from "lodash-es";

import { useDataFilter } from "@/views/build/useDataFilter";

import { useUpdateInstance } from "../useUpdateInstance";

const useDataConfig = createGlobalState(() => {
  const { selectTargetData } = useUpdateInstance();
  const loading = ref(false);
  const { filterAllResultForCurrentComponent } = useDataFilter();
  //   数据源类型的options
  const preDataType = ref([
    { label: "静态数据", value: 0 },
    { label: "SQL数据库", value: 1 },
    { label: "API接口", value: 2 },
    { label: "CSV文件", value: 3 },
    { label: "WebSocket", value: 4 }
  ]);
  //  table列表的映射字段
  // 表格数据
  const dataRemark = computed<
    Array<{
      key: string;
      map: string;
      description?: string;
      decription?: string;
    }>
  >(() => {
    if (!selectTargetData.value || selectTargetData.value.length === 0) return [];
    return selectTargetData.value[0].dataRemark ?? [];
  });
  // 数据源类型
  const dataType = computed({
    get() {
      return selectTargetData.value[0].dataType;
    },
    set(value) {
      selectTargetData.value[0].dataType = value;
    }
  });

  // 从数据中提取字段键
  const getKeysFromData = (data: any): string[] => {
    if (!data) return [];
    if (isArray(data) && data.length > 0) return Object.keys(data[0]);
    return [];
  };

  // 映射字段选项
  const mapOptions = computed<string[]>(() => {
    if (!selectTargetData.value?.[0] || !("dataSource" in selectTargetData.value[0])) {
      return [];
    }

    try {
      const filterResult =
        filterAllResultForCurrentComponent.value[filterAllResultForCurrentComponent.value.length - 1];

      if (!filterResult.success) {
        throw new Error("Filter failed");
      }

      return getKeysFromData(filterResult.outputData);
    } catch (error) {
      return [];
    }
  });

  return {
    loading,
    dataRemark,
    dataType,
    preDataType,
    mapOptions
  };
});

export { useDataConfig };
