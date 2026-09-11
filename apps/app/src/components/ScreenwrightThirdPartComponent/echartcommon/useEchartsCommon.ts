import { shallowRef, watch } from "vue";

import { echartsCore as echarts } from "@screenwright/material/chart";

import { useBaseData } from "@/hooks/useBaseData";
import { getFunction } from "@/utils/utils";
import type { ComponentType } from "@/views/build/components/buildRender/type";

export const useEchartsCommon = (options: ComponentType) => {
  const { dataChart, option, styleSizeName } = useBaseData(options);
  const echartsOptions = shallowRef<Record<string, unknown>>({});
  (window as Window & { echarts?: unknown }).echarts = echarts;

  const showFormatterError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || "未知错误");

    console.error(`[useEchartsCommon] echartFormatter 执行失败: ${message}`, error);
  };

  const getEchartsOptions = () => {
    try {
      const echartFormatter = getFunction(option.value.echartFormatter, true);

      if (typeof echartFormatter !== "function") {
        return echartsOptions.value;
      }

      const nextOptions = echartFormatter(dataChart.value);

      // 仅在返回有效配置时更新，避免把已有配置覆盖成异常值
      if (nextOptions && typeof nextOptions === "object") {
        echartsOptions.value = nextOptions;
      }

      return echartsOptions.value;
    } catch (error) {
      showFormatterError(error);
      // 出错时保持旧配置，不影响后续逻辑
      return echartsOptions.value;
    }
  };
  watch(
    () => dataChart.value,
    (nv) => {
      if (nv) {
        getEchartsOptions();
      }
    },
    {
      deep: true
    }
  );

  return {
    option,
    echartsOptions,
    getEchartsOptions,
    styleSizeName
  };
};
