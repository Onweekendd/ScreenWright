import { cloneDeep } from "lodash-es";
import { shallowRef, watch } from "vue";

import { echartsCore as echarts } from "@screenwright/material/chart";

import { useBaseData } from "@/hooks/useBaseData";
import { getFunction } from "@/utils/utils";
import type { ComponentType } from "@/views/build/components/buildRender/type";

/** echartcommon 组件既有的 {categories, series}[] 数据形状 */
type CategorySeriesDataItem = {
  categories: string[];
  series: { name: string; data: unknown[] }[];
};

const isCategorySeriesShape = (data: unknown): data is CategorySeriesDataItem[] =>
  Array.isArray(data) &&
  data.length > 0 &&
  data.every((item) => item && typeof item === "object" && "categories" in item && "series" in item);

/**
 * 把 dataChart 转换为可作为 echarts dataset.source 使用的行记录表
 * - 已是扁平记录数组（非 {categories, series} 形状）：直接原样使用
 * - {categories, series}[] 形状：取第一项，转换为按 category 行展开的表
 */
const buildDatasetSource = (data: unknown): Record<string, unknown>[] => {
  if (!isCategorySeriesShape(data)) {
    return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  }

  const [first] = data;

  if (!first) {
    return [];
  }

  const { categories, series } = first;

  return categories.map((name, i) => ({
    name,
    ...Object.fromEntries(series.map((s) => [s.name, s.data[i]]))
  }));
};

export const useEchartsCommon = (options: ComponentType) => {
  const { dataChart, option, styleSizeName } = useBaseData(options);
  const echartsOptions = shallowRef<Record<string, unknown>>({});
  (window as Window & { echarts?: unknown }).echarts = echarts;

  const showFormatterError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || "未知错误");

    console.error(`[useEchartsCommon] echartFormatter 执行失败: ${message}`, error);
  };

  /** 新链路：存在 echartsOption 时，注入 dataset 并（可选）交给 echartFormatter 做二次处理 */
  const getEchartsOptionsFromEchartsOption = (echartsOption: Record<string, unknown>) => {
    try {
      const nextOption = cloneDeep(echartsOption);

      nextOption.dataset = { source: buildDatasetSource(dataChart.value) };

      const echartFormatter = getFunction(option.value.echartFormatter, false);

      if (typeof echartFormatter !== "function") {
        echartsOptions.value = nextOption;
        return echartsOptions.value;
      }

      const formatted = echartFormatter(dataChart.value, nextOption);

      // 仅在返回有效配置时更新，避免把已有配置覆盖成异常值
      if (formatted && typeof formatted === "object") {
        echartsOptions.value = formatted;
      }

      return echartsOptions.value;
    } catch (error) {
      showFormatterError(error);
      // 出错时保持旧配置，不影响后续逻辑
      return echartsOptions.value;
    }
  };

  /** 旧链路：无 echartsOption 时，保持与迁移前完全一致的行为 */
  const getEchartsOptionsLegacy = () => {
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

  const getEchartsOptions = () => {
    const echartsOption = option.value.echartsOption as Record<string, unknown> | undefined;

    if (echartsOption) {
      return getEchartsOptionsFromEchartsOption(echartsOption);
    }

    return getEchartsOptionsLegacy();
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
