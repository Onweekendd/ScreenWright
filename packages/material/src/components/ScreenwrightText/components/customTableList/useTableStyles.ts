import { setMinioUrl } from "@material/minioUrl";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, useAttrs } from "vue";

import type { Attrs, TableColumnConfig } from "../types";

export const useTableStyles = (options: ComponentType, isBuild: boolean) => {
  const attrs: Attrs = useAttrs();
  const { globalConfig, rowConfig } = options.option;
  // 根元素样式
  const getRootStyles = computed(() => {
    return {
      class: {
        "component-bind-events": true,
        "has-bind": attrs.events?.length && isBuild,
        "has-encode": attrs.encodes?.length && isBuild,
      },
      style: {
        "--globalBg": getGlobalBg.value,
        "--globalTranslateY": `${globalConfig.globalTranslateY}px`,
        "--globalTranslateX": `${globalConfig.globalTranslateX}px`,
      } as CSSProperties,
    };
  });

  const getGlobalBg = computed(() => {
    return options.globalConfig.globalBgType === "color"
      ? options.globalConfig.globalBgColor
      : `url(${setMinioUrl(globalConfig.globalBgImage)}) no-repeat center/100% 100%`;
  });

  const getRowStyle = computed(() => (index: number) => {
    const isLastRow = index === globalConfig.globalRowCount - 1;
    return {
      marginBottom: isLastRow ? 0 : `${rowConfig.listRowMarginBottom}px`,
    };
  });

  const getCellStyle = (
    type: "text" | "image" | "button" | "switch",
    column: TableColumnConfig,
  ) => {
    const baseStyle: CSSProperties = {
      width: `${column.width}px`,
      height: `${column.height}px`,
      position: "absolute",
      top: `${column.offsetY}px`,
      left: `${column.offsetX}px`,
      zIndex: column.zIndex,
    };

    switch (type) {
      case "text":
        return {
          ...baseStyle,
          fontSize: `${column.fontSize}px`,
          color: column.color,
          textAlign: column.align,
        };
      case "image":
        return {
          ...baseStyle,
          objectFit: column.imageFit,
        };
      case "button":
        return {
          ...baseStyle,
          backgroundColor: column.buttonColor,
          borderRadius: `${column.buttonRadius}px`,
        };
      default:
        return baseStyle;
    }
  };
  // 行配置基础样式
  const setRowBaseStyle = (listIndex: number, currentList: any[]) => {
    let background =
      options.option.rowConfig.listRowBgType === "color"
        ? options.option.rowConfig.listRowBgColor
        : `url(${setMinioUrl(options.option.rowConfig.listRowBgImage)}) no-repeat center/100% 100%`;
    if (options.option.rowConfig.listRowStatusShow && currentList[listIndex]) {
      // 数据中对应的状态值
      const targetValue =
        currentList[listIndex][options.option.rowConfig.listRowMappingKey];
      options.option.rowConfig.listRowStatusList.map(
        (listRowStatusItem: any) => {
          if (
            targetValue &&
            listRowStatusItem.seriesXBackgroundMappingStatus &&
            targetValue === listRowStatusItem.seriesXBackgroundMappingStatus
          ) {
            background =
              listRowStatusItem.seriesXBackgroundType === "color"
                ? listRowStatusItem.seriesXBackgroundColor
                : `url(${setMinioUrl(listRowStatusItem.seriesXBackgroundImage)}) no-repeat center/100% 100%`;
          }
        },
      );
    }
    return {
      background,
      width: `${options.option.rowConfig.listRowWidth}px`,
      height: `${options.option.rowConfig.listRowHeight}px`,
      lineHeight: `${options.option.rowConfig.listRowHeight}px`,
      marginBottom: `${
        listIndex === options.data.length - 1 &&
        !options.option.globalConfig.globalScroll
          ? 0
          : options.option.globalConfig.globalRowLineMarginBottom
      }px`, // 末项不需要margin
    };
  };
  return {
    getRootStyles,
    getRowStyle,
    getCellStyle,
    setRowBaseStyle,
  };
};
