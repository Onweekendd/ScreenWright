import type { Ref } from "vue";
import { computed } from "vue";

import { cloneDeep, isObject } from "lodash-es";

import { useUpdateInstance } from "../../../useUpdateInstance";

interface SeriesItem {
  name: string;
  value: any;
  [key: string]: any; // 添加索引签名，允许使用字符串索引访问
}

interface Props {
  list: string[];
  activeTab: Ref<string>;
  seriesName: string;
  limitNum: number;
  sName: string;
  tabName?: string;
}

export const useSeries = ({
  list,
  activeTab,
  seriesName = "seriesTabsName",
  limitNum = 1,
  sName = "系列",
  tabName = "name"
}: Props) => {
  const { selectTargetData, update } = useUpdateInstance();

  // 获取系列索引
  const getSeriesIndex = (seriesName: string): number => {
    const series = selectTargetData.value[0].option[seriesName];
    const isObj = isObject(series[0]);
    return isObj
      ? series.findIndex((item: SeriesItem) => item[tabName] === activeTab.value)
      : series.findIndex((item: string) => item === activeTab.value);
  };

  // 判断是否为对象类型的系列
  const isObjectSeries = computed(() => {
    const series = selectTargetData.value[0].option[seriesName];
    return isObject(series[0]);
  });

  // 获取当前系列长度
  const getCurrentSeriesLength = computed(() => selectTargetData.value[0].option[seriesName].length);

  // 更新系列数据
  const updateSeriesData = (index: number, operation: "add" | "remove") => {
    list.forEach((key) => {
      if (selectTargetData.value[0].option[key]) {
        if (operation === "add") {
          const last = cloneDeep(selectTargetData.value[0].option[key]?.[index]);
          if (last) {
            selectTargetData.value[0].option[key].push(last);
          }
        } else {
          selectTargetData.value[0].option[key].splice(index, 1);
        }
      }
    });
  };

  const handleAddSeries = () => {
    const len = getCurrentSeriesLength.value;
    const index = getSeriesIndex(seriesName);

    updateSeriesData(index, "add");

    if (isObjectSeries.value) {
      const last = cloneDeep(selectTargetData.value[0].option[seriesName][index]);
      last[tabName] = `${sName}${len + 1}`;
      selectTargetData.value[0].option[seriesName].push(last);
    } else {
      selectTargetData.value[0].option[seriesName].push(`${sName}${len + 1}`);
    }

    activeTab.value = `${sName}${len + 1}`;
    update();
  };

  const handleDeleteSeries = () => {
    const len = getCurrentSeriesLength.value;
    if (limitNum < len) {
      const index = getSeriesIndex(seriesName);

      updateSeriesData(index, "remove");
      selectTargetData.value[0].option[seriesName].splice(index, 1);
      // activeTab.value = `${sName}${len - 1}`
      if (isObjectSeries.value) {
        selectTargetData.value[0].option[seriesName].forEach((item: SeriesItem, index: number) => {
          item[tabName] = `${sName}${index + 1}`;
        });
      } else {
        selectTargetData.value[0].option[seriesName].forEach((item: string, index: number) => {
          selectTargetData.value[0].option[seriesName][index] = `${sName}${index + 1}`;
        });
      }
      console.log(selectTargetData.value[0].option[seriesName], "selectTargetData.value[0].option[seriesName]");
      if (selectTargetData.value[0].option[seriesName].length === 1) {
        if (isObjectSeries.value) {
          activeTab.value = selectTargetData.value[0].option[seriesName][0][tabName];
        } else {
          activeTab.value =
            selectTargetData.value[0].option[seriesName][selectTargetData.value[0].option[seriesName].length - 1];
        }
      }
      if (index === selectTargetData.value[0].option[seriesName].length) {
        if (isObjectSeries.value) {
          activeTab.value = selectTargetData.value[0].option[seriesName][index - 1][tabName];
        } else {
          activeTab.value = selectTargetData.value[0].option[seriesName][index - 1];
        }
      }
      update();
    }
  };

  return {
    handleAddSeries,
    handleDeleteSeries
  };
};
