import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import { getAlign, lineargradientHandle } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { isArray } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, ref, watch } from "vue";

export function useDynamicRatio(element: ComponentType) {
  const { option, styleSizeName, dataChart: inputData } = useBaseData(element);
  const box = ref();
  const text = ref();
  const left = ref(0);
  const dataChartItem = ref<any>({});

  // 监听数据变化
  watch(
    inputData,
    (nv) => {
      if (isArray(nv) && nv.length) {
        dataChartItem.value = nv[0];
      } else {
        dataChartItem.value = nv;
      }
    },
    { immediate: true, deep: true },
  );

  const isUp = computed(() => {
    return Number(dataChartItem.value.value) >= option.value.thresholdValue;
  });

  const index = computed(() => {
    return isUp.value ? 0 : 1;
  });

  const curText = computed(() => {
    return dataChartItem.value.value + option.value.textUnit[index.value];
  });

  const textAlignVertical = computed(() => {
    return getAlign(option.value.textAlignVertical);
  });

  const styleName = computed(() => {
    let resultColor;
    if (option.value.selectedTextType[index.value] === "normal") {
      resultColor = {
        color: option.value.textColor[index.value] || "rgba(255, 255, 255, 1)",
        backgroundColor: option.value.backgroundColor,
      };
    } else {
      resultColor = {
        "background-clip": "text",
        "-webkit-background-clip": "text",
        "-webkit-text-fill-color": "transparent",
        backgroundImage: lineargradientHandle(
          option.value.selectedTextColor[index.value],
        ),
      };
    }

    return {
      ...resultColor,
      width: "fit-content",
      transform: `translateX(${left.value}px)`,
      letterSpacing: `${option.value.split[index.value]}px`,
      textIndent: `${option.value.split[index.value]}px`,
      fontFamily:
        option.value.fontFamily[index.value] ||
        "Source Han Sans CN-Normal, Source Han Sans CN",
      fontSize: `${option.value.fontSize[index.value]}px`,
      fontWeight: option.value.fontWeight[index.value] || "normal",
      fontStyle: option.value.fontStyle[index.value] || "normal",
      lineHeight: `${option.value.lineHeight}px`,
      filter: option.value.shadowShow[index.value]
        ? `drop-shadow(${option.value.shadowColor[index.value]} ${
            option.value.shadowX[index.value]
              ? option.value.shadowX[index.value] + "px"
              : 0
          } ${option.value.shadowY[index.value] ? option.value.shadowY[index.value] + "px" : 0} ${
            option.value.shadowFuzzy[index.value]
              ? option.value.shadowFuzzy[index.value] + "px"
              : 0
          })`
        : "",
      whiteSpace: "pre-wrap",
    };
  });

  const styleBox = computed(() => {
    return {
      width: "100%",
      height: "100%",
      justifyContent: option.value.textAlign || "center",
      alignItems: textAlignVertical.value,
    };
  });

  const iconStyle = computed<CSSProperties>(() => {
    return {
      color: option.value.iconColor[index.value] || "rgba(255, 255, 255, 1)",
      fontSize: `${option.value.iconSize[index.value]}px`,
    };
  });

  const iconType = computed(() => {
    return isUp.value
      ? "iconfont-xiangshangjiantou"
      : "iconfont-xiangxiajiantou";
  });

  // iconStyleMode / iconList 是「自定义图标」这条后加的配置，**组件模板（Module.javaScript）
  // 里至今没有这两个字段**——本组件读的另外 16 个按系列平铺的数组模板里都有，只有这两个缺。
  // 所以不能像其它字段那样直接下标：`undefined[index]` 会在 render 期抛
  // `Cannot read properties of undefined`，整块画布挂掉。从组件菜单手工拖一个出来就能复现。
  // 缺省即「不用自定义图标」，走上面的 iconfont 箭头。
  const isCustomType = computed(() => {
    return option.value.iconStyleMode?.[index.value] === "custom";
  });

  const customUrl = computed(() => {
    if (!isCustomType.value) {
      return "";
    }
    const imageUrl = option.value.iconList?.[index.value];
    return imageUrl ? setMinioUrl(imageUrl) : "";
  });

  const customStyle = computed(() => {
    return {
      width: option.value.iconSize[index.value] + "px",
      height: option.value.iconSize[index.value] + "px",
    };
  });

  return {
    box,
    text,
    curText,
    styleName,
    styleBox,
    iconType,
    iconStyle,
    styleSizeName,
    isCustomType,
    customUrl,
    customStyle,
  };
}
