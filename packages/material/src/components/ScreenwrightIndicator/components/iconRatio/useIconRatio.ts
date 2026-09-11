import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { cloneDeep, isArray } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, ref, watch } from "vue";

import type { IconItem } from "../types";

export function useIconRatio(props: { element: ComponentType }) {
  const {
    option,
    width,
    height,
    isBuild,
    events,
    encodes,
    dataChart: inputData,
  } = useBaseData(props.element);

  const listData = ref<any[]>([]);
  const iconList = ref<IconItem[]>([]);

  // 监听数据变化
  watch(
    () => inputData.value,
    (val) => {
      if (isArray(val)) {
        listData.value = cloneDeep(val);
      } else {
        listData.value = [];
      }
    },
    { deep: true, immediate: true },
  );

  // 初始化图标比例
  const init = () => {
    if (option.value?.iconList?.length) {
      iconList.value = cloneDeep(option.value.iconList);
    } else {
      iconList.value = [];
    }
  };

  // 获取图标项数据值
  const getIconItemDataValue = (iconItem: IconItem) => {
    if (iconItem.iconKeyValue) {
      const target = listData.value.find(
        (it) => it.name === iconItem.iconKeyValue,
      );
      return target?.value
        ? (target.value * 100).toFixed(option.value.globalConfig.decimalPlace)
        : 0;
    }
    return 0;
  };

  // 监听配置变化
  watch(
    () => option.value,
    () => {
      init();
    },
    { deep: true, immediate: true },
  );

  // 样式相关计算属性
  const containerStyle = computed<CSSProperties>(() => ({
    "pointer-events": isBuild.value ? "none" : "auto",
    width: `${width.value}px`,
    height: `${height.value}px`,
  }));

  const contentBoxClasses = computed(() => ({
    contentBox: true,
    "component-bind-events": true,
    "has-bind": events?.value?.length && isBuild.value,
    "has-encode": encodes?.value?.length && isBuild.value,
  }));

  const contentBoxStyle = computed<CSSProperties>(() => ({
    gridTemplateRows: `repeat(${option.value.globalConfig.rowNum}, ${
      height.value / option.value.globalConfig.rowNum
    }px)`,
    gridTemplateColumns: `repeat(${option.value.globalConfig.colNum}, ${
      width.value / option.value.globalConfig.colNum
    }px)`,
  }));

  const getIconImgStyle = (iconItem: IconItem) => ({
    width: `${iconItem.iconImgWidth}px`,
    height: `${iconItem.iconImgHeight}px`,
    transform: `translate(${iconItem.iconTranslateX}px, ${iconItem.iconTranslateY}px)`,
  });

  const getIconTextStyle = (iconItem: IconItem) => ({
    fontFamily: iconItem.iconFontFamily,
    fontSize: `${iconItem.iconFontSize}px`,
    lineHeight: `${iconItem.iconLineHeight}px`,
    letterSpacing: `${iconItem.iconLetterSpacing}px`,
    color: iconItem.iconColor,
    fontStyle: iconItem.iconFontStyle,
    fontWeight: iconItem.iconFontWeight,
    transform: `translate(${option.value.globalConfig.positionX}px, ${option.value.globalConfig.positionY}px)`,
  });

  return {
    iconList,
    containerStyle,
    contentBoxClasses,
    contentBoxStyle,
    getIconImgStyle,
    getIconTextStyle,
    getIconItemDataValue,
    setMinioUrl,
  };
}
