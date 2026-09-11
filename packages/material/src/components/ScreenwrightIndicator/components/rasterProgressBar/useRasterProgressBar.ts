import { setMinioUrl } from "@screenwright/composables";
import { uuid } from "@screenwright/core";
import { cloneDeep, isArray } from "lodash-es";
import type { Ref } from "vue";
import { computed, ref, watch } from "vue";

export function useRasterProgressBar(props: {
  option: any;
  dataChart: any;
  width: Ref<number>;
  height: Ref<number>;
}) {
  const { option, dataChart, width, height } = props;

  const uid = ref(uuid());
  const listData = ref<any[]>([]);
  const sectionRectList = ref<any[]>([]);

  // 获取极值最小值
  const getExtremeValueMin = computed(() => {
    return (
      listData.value?.[0]?.min || option.value.globalConfig.extremeValueMin
    );
  });

  // 获取极值最大值
  const getExtremeValueMax = computed(() => {
    return (
      listData.value?.[0]?.max || option.value.globalConfig.extremeValueMax
    );
  });

  // 值在整个进度条中占比百分比
  const valueProportion = computed(() => {
    let percent = 0;
    const val = Number(listData.value?.[0]?.value || 0);
    if (val) {
      switch (option.value.globalConfig.numType) {
        case "percent":
          percent = Number(
            val.toFixed(option.value.seriesConfig.decimalPlace + 2),
          );
          break;
        case "value":
          percent = Number(
            (
              val /
              (getExtremeValueMax.value - getExtremeValueMin.value)
            )?.toFixed(option.value.seriesConfig.decimalPlace + 2),
          );
          break;
      }
    }
    return percent;
  });

  // 前景色配置
  const getForegroundColor = computed(() => {
    const returnForegroundColor = [
      {
        color: option.value.gridConfig.foregroundColor.colors[0].color,
        opacity: option.value.gridConfig.foregroundOpacity / 100,
      },
      {
        color: option.value.gridConfig.foregroundColor.colors[1].color,
        opacity: option.value.gridConfig.foregroundOpacity / 100,
      },
    ];

    const targetValue = Number(listData.value?.[0]?.value || 0);
    if (option.value.sectionList.length) {
      option.value.sectionList.forEach((slItem: any) => {
        if (slItem) {
          if (
            slItem.sectionMin <= targetValue &&
            targetValue <= slItem.sectionMax
          ) {
            returnForegroundColor[0].color =
              slItem.sectionBgColor.colors[0].color;
            returnForegroundColor[0].opacity = slItem.sectionOpacity / 100;
            returnForegroundColor[1].color =
              slItem.sectionBgColor.colors[1].color;
            returnForegroundColor[1].opacity = slItem.sectionOpacity / 100;
          }
        }
      });
    }
    return returnForegroundColor;
  });

  // 指标背景样式
  const getSeriesBgStyle = computed(() => {
    const style = {
      left: `${valueProportion.value * width.value + option.value.seriesConfig.bgImgTranslateX}px`,
      top: `${option.value.seriesConfig.bgImgTranslateY}px`,
      width: `${option.value.seriesConfig.bgImgWidth}px`,
      height: `${option.value.seriesConfig.bgImgHeight}px`,
      src: setMinioUrl(option.value.seriesConfig.bgImgSrc),
    };

    const targetValue = Number(listData.value?.[0]?.value || 0);
    if (option.value.sectionList.length) {
      option.value.sectionList.forEach((slItem: any) => {
        if (
          slItem &&
          slItem.sectionMin <= targetValue &&
          targetValue <= slItem.sectionMax
        ) {
          Object.assign(style, {
            left: `${valueProportion.value * width.value + slItem.seriesBgImgTranslateX}px`,
            top: `${slItem.seriesBgImgTranslateY}px`,
            width: `${slItem.seriesBgImgWidth}px`,
            height: `${slItem.seriesBgImgHeight}px`,
            src: setMinioUrl(slItem.seriesBgImgSrc),
          });
        }
      });
    }
    return style;
  });

  // 指标文本样式
  const getSeriesTextStyle = computed(() => {
    const style = {
      left: `${valueProportion.value * width.value + option.value.seriesConfig.seriesTranslateX}px`,
      top: `${option.value.seriesConfig.seriesTranslateY}px`,
      fontFamily: option.value.seriesConfig.seriesFontFamily,
      fontSize: `${option.value.seriesConfig.seriesFontSize}px`,
      lineHeight: `${option.value.seriesConfig.seriesLineHeight}px`,
      letterSpacing: `${option.value.seriesConfig.seriesLetterSpacing}px`,
      color: option.value.seriesConfig.seriesColor,
      fontStyle: option.value.seriesConfig.seriesFontStyle,
      fontWeight: option.value.seriesConfig.seriesFontWeight,
    };

    const targetValue = Number(listData.value?.[0]?.value || 0);
    if (option.value.sectionList.length) {
      option.value.sectionList.forEach((slItem: any) => {
        if (
          slItem &&
          slItem.sectionMin <= targetValue &&
          targetValue <= slItem.sectionMax
        ) {
          Object.assign(style, {
            fontFamily: slItem.seriesFontFamily,
            fontSize: `${slItem.seriesFontSize}px`,
            lineHeight: `${slItem.seriesLineHeight}px`,
            letterSpacing: `${slItem.seriesLetterSpacing}px`,
            color: slItem.seriesColor,
            fontStyle: slItem.seriesFontStyle,
            fontWeight: slItem.seriesFontWeight,
          });
        }
      });
    }
    return style;
  });

  // 指标文本
  const getSeriesText = computed(() => {
    let text = "";
    switch (option.value.globalConfig.numType) {
      case "percent":
        text = `${(valueProportion.value * 100).toFixed(option.value.seriesConfig.decimalPlace)}%`;
        break;
      case "value":
        text = Number(listData.value?.[0]?.value || 0)?.toFixed(
          option.value.seriesConfig.decimalPlace,
        );
        break;
    }
    return text;
  });

  // 指标单位样式
  const getSeriesUnitStyle = computed(() => ({
    fontFamily: option.value.seriesConfig.unitFontFamily,
    fontSize: `${option.value.seriesConfig.unitFontSize}px`,
    lineHeight: `${option.value.seriesConfig.unitLineHeight}px`,
    letterSpacing: `${option.value.seriesConfig.unitLetterSpacing}px`,
    color: option.value.seriesConfig.unitColor,
    fontStyle: option.value.seriesConfig.unitFontStyle,
    fontWeight: option.value.seriesConfig.unitFontWeight,
  }));

  // 区间样式
  const getSectionStyle = computed(() => ({
    fontFamily: option.value.seriesConfig.tagFontFamily,
    fontSize: `${option.value.seriesConfig.tagFontSize}px`,
    lineHeight: `${option.value.seriesConfig.tagLineHeight}px`,
    letterSpacing: `${option.value.seriesConfig.tagLetterSpacing}px`,
    color: option.value.seriesConfig.tagColor,
    fontStyle: option.value.seriesConfig.tagFontStyle,
    fontWeight: option.value.seriesConfig.tagFontWeight,
  }));

  // 区间单位样式
  const getSectionUnitStyle = computed(() => ({
    fontFamily: option.value.seriesConfig.tagUnitFontFamily,
    fontSize: `${option.value.seriesConfig.tagUnitFontSize}px`,
    lineHeight: `${option.value.seriesConfig.tagUnitLineHeight}px`,
    letterSpacing: `${option.value.seriesConfig.tagUnitLetterSpacing}px`,
    color: option.value.seriesConfig.tagUnitColor,
    fontStyle: option.value.seriesConfig.tagUnitFontStyle,
    fontWeight: option.value.seriesConfig.tagUnitFontWeight,
  }));

  // 区间最小值
  const getSectionMin = computed(() => {
    switch (option.value.globalConfig.numType) {
      case "percent":
        return "0%";
      case "value":
        return getExtremeValueMin.value;
      default:
        return "";
    }
  });

  // 区间最大值
  const getSectionMax = computed(() => {
    switch (option.value.globalConfig.numType) {
      case "percent":
        return "100%";
      case "value":
        return getExtremeValueMax.value;
      default:
        return "";
    }
  });

  // 初始化栅格进度条
  const initRasterProgressBar = () => {
    sectionRectList.value = [];
    const defaultWidth: any = (
      width.value / option.value.gridConfig.sectionNums
    ).toFixed(2);
    for (let i = 0; i < option.value.gridConfig.sectionNums; i++) {
      sectionRectList.value.push({
        x:
          defaultWidth * i +
          ((option.value.gridConfig.interval * defaultWidth) /
            option.value.gridConfig.sectionNums) *
            i,
        width: defaultWidth * (1 - option.value.gridConfig.interval),
      });
    }
  };

  // 监听数据变化
  watch(
    () => dataChart.value,
    (val) => {
      if (isArray(val)) {
        listData.value = cloneDeep(val);
      } else {
        listData.value = [];
      }
    },
    { deep: true, immediate: true },
  );

  // 监听配置变化
  watch(
    [() => option.value, () => width.value, () => height.value],
    () => {
      initRasterProgressBar();
    },
    { deep: true, immediate: true },
  );

  return {
    uid,
    sectionRectList,
    valueProportion,
    getForegroundColor,
    getSeriesBgStyle,
    getSeriesTextStyle,
    getSeriesText,
    getSeriesUnitStyle,
    getSectionStyle,
    getSectionUnitStyle,
    getSectionMin,
    getSectionMax,
  };
}
