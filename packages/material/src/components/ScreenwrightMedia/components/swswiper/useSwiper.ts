import type { CSSProperties } from "vue";
import { ref } from "vue";
import { computed } from "vue";

import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";

import type { ImageItem } from "./swiperType";

export const useSwiper = (options: ComponentType) => {
  const isHover = ref(false);

  const { option, styleSizeName, height, width, dataChart, clickFormatter } = useBaseData(options);

  // 计算属性
  const arrowTopStyle = computed(
    (): CSSProperties => ({
      position: "absolute",
      top: "16px",
      left: `${width.value * 0.5 - 12}px`,
      zIndex: 999
    })
  );

  const arrowBottomStyle = computed(
    (): CSSProperties => ({
      position: "absolute",
      top: `${height.value - 37}px`,
      left: `${width.value * 0.5 - 12}px`,
      zIndex: 999
    })
  );

  const arrowDisplay = computed(
    () =>
      option.value.direction === "vertical" &&
      (option.value.arrow === "always" || (isHover.value && option.value.arrow === "hover"))
  );

  const imagesList = computed((): ImageItem[] => {
    if (dataChart.value?.length) {
      return dataChart.value.map((item: any, index: number) => ({
        ...option.value.imagesList[index],
        ...item
      }));
    }
    return option.value.imagesList || [];
  });

  const getBorderImageStyle = (item: ImageItem): CSSProperties => ({
    width: `${item.borderImageWidth || 100}%`,
    height: `${item.borderImageHeight || 100}%`,
    objectFit: (item.borderImageSize || "contain") as "contain"
  });

  const getImageStyle = (item: ImageItem): CSSProperties => ({
    objectFit: (item.objectFit || option.value.objectFit || "contain") as "contain",
    transform: `translate(${item.imgTranslateX || 0}px, ${item.imgTranslateY || 0}px)`,
    width: `${option.value.imageWidth || 100}%`,
    height: `${option.value.imageHeight || 100}%`
  });
  const getTextStyle = (item: ImageItem): CSSProperties => ({
    color: item.fontColor,
    fontSize: `${item.fontSize || 12}px`,
    textAlign: (item.textAlign || "center") as "center",
    letterSpacing: `${item.letterSpacing || 0}px`,
    fontWeight: item.fontWeight,
    fontFamily: item.fontFamily,
    fontStyle: item.fontStyle,
    textShadow: item.isTextShadow
      ? `${item.textShadow?.color} ${item.textShadow?.x || 0}px ${item.textShadow?.y || 0}px ${
          item.textShadow?.blur || 0
        }px`
      : "none",
    transform: `translate(${item.textTranslateX || 0}px, ${item.textTranslateY || 0}px)`
  });

  const handleClick = (item: ImageItem, index: number) => {
    clickFormatter &&
      clickFormatter({
        type: index,
        value: item,
        data: dataChart.value
      });
  };

  // 方法
  const processIndex = (index: number, activeIndex: number, len: number): number => {
    let diff = index - activeIndex;
    if (diff > len / 2) {
      diff -= len;
    } else if (diff < -len / 2) {
      diff += len;
    }
    return diff;
  };

  return {
    isHover,
    styleSizeName,
    arrowTopStyle,
    arrowBottomStyle,
    arrowDisplay,
    dataChart,
    option,
    height,
    width,
    imagesList,
    getBorderImageStyle,
    getImageStyle,
    getTextStyle,
    handleClick,
    processIndex
  };
};
