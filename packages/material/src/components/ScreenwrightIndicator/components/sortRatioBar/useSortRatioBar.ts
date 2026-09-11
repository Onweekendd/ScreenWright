import type { ComputedRef, CSSProperties, WritableComputedRef } from "vue";
import { computed, ref, watch } from "vue";

import { cloneDeep, isArray } from "lodash-es";

type ListDataItem = {
  name: string;
  value: number;
  [key: string]: any;
};

export function useSortRatioBar(dataChart: WritableComputedRef<any>, option: ComputedRef<any>) {
  // 数据列表
  const listData = ref<ListDataItem[]>([]);

  // 监听数据变化
  watch(
    () => dataChart.value,
    (val) => {
      if (isArray(val)) {
        listData.value = cloneDeep(val).map((it) => ({
          ...it,
          value: Number(it.value) || 0
        }));
      } else {
        listData.value = [];
      }
    },
    { deep: true, immediate: true }
  );

  // 序列映射表
  const seriesListMap = computed(() => {
    const map: Record<string, any> = {};
    option.value.seriesList.forEach((item: any) => {
      map[item.seriesKeyValue] = item;
    });
    return map;
  });

  // 获取序列项宽度
  const getSeriesItemBoxWidth = (listItem: ListDataItem) => {
    // 统计所有value总和
    let totalValue = 0;
    listData.value.map((ld) => {
      totalValue += ld.value || 0;
    });
    // 该系列所占宽比例
    const listItemScale = listItem.value / totalValue;
    return `calc((100% - ${option.value.globalConfig.interval}px*${listData.value.length - 1}) * ${listItemScale})`;
  };

  // 获取块样式
  const getBlockStyle = (listItem: ListDataItem) => {
    let returnStyle: CSSProperties = {};
    const target = seriesListMap.value[listItem.name];
    if (target) {
      returnStyle = {
        opacity: target.seriesOpacity / 100
      };
      if (typeof target.seriesBgColor === "string") {
        returnStyle.backgroundColor = target.seriesBgColor;
      } else {
        returnStyle.backgroundImage = `linear-gradient(${target.seriesBgColor?.angle || 0}deg, ${
          target.seriesBgColor?.colors?.[0]?.color
        }, ${target.seriesBgColor?.colors?.[1]?.color})`;
      }
    }
    return returnStyle;
  };

  // 获取标签位置
  const getTagTranslateXY = (listItem: ListDataItem) => {
    let returnStyle: CSSProperties = {};
    const target = seriesListMap.value[listItem.name];
    if (target) {
      returnStyle = {
        top: `${target.seriesTranslateY}px`,
        left: `${target.seriesTranslateX}px`
      };
    }
    return returnStyle;
  };

  // 获取标签值样式
  const getTagValueStyle = (listItem: ListDataItem) => {
    let returnStyle: CSSProperties = {};
    const target = seriesListMap.value[listItem.name];
    if (target) {
      returnStyle = {
        fontFamily: `${target.seriesFontFamily}`,
        fontSize: `${target.seriesFontSize}px`,
        lineHeight: `${target.seriesLineHeight}px`,
        letterSpacing: `${target.seriesLetterSpacing}px`,
        color: `${target.seriesColor}`,
        fontStyle: `${target.seriesFontStyle}`,
        fontWeight: `${target.seriesFontWeight}`
      };
    }
    return returnStyle;
  };

  // 获取单位文本
  const getTagUnitText = (listItem: ListDataItem) => {
    let returnText = "";
    const target = seriesListMap.value[listItem.name];
    if (target) {
      returnText = target.unitText || "";
    }
    return returnText;
  };

  // 获取单位样式
  const getTagUnitStyle = (listItem: ListDataItem) => {
    const target = seriesListMap.value[listItem.name];
    let returnStyle: CSSProperties = {
      top: `${target?.unitTranslateY || 0}px`,
      left: `${target?.unitTranslateX || 0}px`
    };

    if (target && target?.isUnitCustomStyle) {
      returnStyle = {
        ...returnStyle,
        fontFamily: `${target.unitFontFamily}`,
        fontSize: `${target.unitFontSize}px`,
        lineHeight: `${target.unitLineHeight}px`,
        letterSpacing: `${target.unitLetterSpacing}px`,
        color: `${target.unitColor}`,
        fontStyle: `${target.unitFontStyle}`,
        fontWeight: `${target.unitFontWeight}`
      };
    }
    return returnStyle;
  };

  // 判断列表项是否在序列中
  const listItemIsinSeriesList = (listItem: ListDataItem) => {
    return !!seriesListMap.value[listItem.name];
  };

  return {
    listData,
    seriesListMap,
    getSeriesItemBoxWidth,
    getBlockStyle,
    getTagTranslateXY,
    getTagValueStyle,
    getTagUnitText,
    getTagUnitStyle,
    listItemIsinSeriesList
  };
}
