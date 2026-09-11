import { iotApiService } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { WindowInfo } from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { ElMessage } from "element-plus";
import { isArray } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import { RelatedTrigger } from "../../../index";
import { useIot } from "../common/useIot";

/**
 * 选项卡项接口
 */
interface TabItem {
  label: string;
  value: string;
  disabled?: boolean;
  isChecked?: boolean;
  children?: TabItem[];
  [key: string]: any;
}
export const useSubTabs = (options: ComponentType) => {
  const rows = ref<number>(1);
  const currentActive = ref<string | null>(null);
  const isFirst = ref<boolean>(true);
  const eventStatus = ref<boolean>(false);
  const encodeStatus = ref<boolean>(false);
  const availableWindows = ref<WindowInfo[]>([]);

  const relatedTrigger = RelatedTrigger.getInstance();

  const {
    componentClasses,
    option,
    dataChart,
    isBuild,
    height,
    id,
    events,
    encodes,
    cbArgs,
    handleEventAndCallbackEvent,
    handleEncode,
  } = useBaseData(options);
  const { baseUrl, deviceId, sendIotMessage } = useIot(options);
  const liMinHeight = computed<CSSProperties>(() => {
    return {
      minHeight: option.value.setMinHeight
        ? `${height.value / option.value.rows}px`
        : "auto",
    };
  });

  const styleGrid = computed<CSSProperties>(() => {
    // 根据数据项数量动态计算网格布局
    const itemCount = dataChart.value?.length || 0;
    const columns = option.value.columns || 1;
    const calculatedRows = Math.ceil(itemCount / columns);

    return {
      gridTemplateRows: `repeat(${calculatedRows}, 1fr)`,
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      rowGap: `${option.value.rowGap || 0}px`,
      columnGap: `${option.value.columnGap || 0}px`,
    };
  });

  const styleFlex = computed<CSSProperties>(() => {
    return {
      padding: `${option.value.paddingTop}px ${option.value.paddingRight}px ${option.value.paddingBottom}px ${option.value.paddingLeft}px`,
      writingMode: option.value.writingMode, // tb-rl 文字方向
      alignItems: option.value.alignItems, //flex-start, flex-end
    };
  });

  const styleDefaultFont = (index: number) => {
    const returnStyle: CSSProperties = {
      color: option.value.defaultObj.fontColor,
      fontSize: `${option.value.defaultObj.fontSize || 12}px`,
      fontWeight: option.value.defaultObj.fontWeight,
      fontFamily: option.value.defaultObj.fontFamily,
      fontStyle: option.value.defaultObj.fontStyle,
      textShadow: option.value.defaultObj.isTextShadow
        ? `${option.value.defaultObj.textShadow.color} ${option.value.defaultObj.textShadow.x || 0}px ${
            option.value.defaultObj.textShadow.y || 0
          }px ${option.value.defaultObj.textShadow.blur}px`
        : "none",
      transform: `translate(${option.value.defaultObj.textTranslateX || 0}px, ${
        option.value.defaultObj.textTranslateY || 0
      }px)`,
    };

    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.defaultObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.color = `${targetItem.defaultObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.defaultObj.fontSize || 12}px`;
        returnStyle.fontWeight = `${targetItem.defaultObj.fontWeight}`;
        returnStyle.fontFamily = `${targetItem.defaultObj.fontFamily}`;
        returnStyle.fontStyle = `${targetItem.defaultObj.fontStyle}`;
        returnStyle.textShadow = `${
          targetItem.defaultObj.isTextShadow
            ? `${targetItem.defaultObj.textShadow.color} ${targetItem.defaultObj.textShadow.x || 0}px ${
                targetItem.defaultObj.textShadow.y || 0
              }px ${targetItem.defaultObj.textShadow.blur}px`
            : "none"
        }`;
        returnStyle.transform = `translate(${targetItem.defaultObj.textTranslateX || 0}px, ${
          targetItem.defaultObj.textTranslateY || 0
        }px)`;
      }
    }

    return returnStyle;
  };

  // 样式处理方法
  const styleDefaultItem = (index: number) => {
    const returnStyle: CSSProperties = {
      border: option.value.defaultObj.isBorder
        ? `${option.value.defaultObj.borderWidth || 0}px solid ${option.value.defaultObj.borderColor}`
        : `none`,
      background:
        option.value.defaultObj.backgroundType == "color"
          ? option.value.defaultObj.backgroundColor
          : `url(${setMinioUrl(option.value.defaultObj.backgroundImage)}) 50% 50% / ${
              option.value.defaultObj.backgroundImageType
            } no-repeat`,
    };

    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.defaultObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.border = `${targetItem.defaultObj.borderWidth || 0}px solid ${targetItem.defaultObj.borderColor}`;
        returnStyle.background =
          targetItem.defaultObj.backgroundType == "color"
            ? targetItem.defaultObj.backgroundColor
            : `url(${setMinioUrl(targetItem.defaultObj.backgroundImage)}) 50% 50% / ${
                targetItem.defaultObj.backgroundImageType
              } no-repeat`;
      }
    }

    return returnStyle;
  };
  const styleActiveItem = (index: number) => {
    const returnStyle: CSSProperties = {
      border: option.value.activeObj.isBorder
        ? `${option.value.activeObj.borderWidth || 0}px solid ${option.value.activeObj.borderColor}`
        : `none`,
      background:
        option.value.activeObj.backgroundType == "color"
          ? option.value.activeObj.backgroundColor
          : `url(${setMinioUrl(option.value.activeObj.backgroundImage)}) 50% 50% / ${
              option.value.activeObj.backgroundImageType
            } no-repeat`,
    };

    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.activeObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.border = `${targetItem.activeObj.borderWidth || 0}px solid ${targetItem.activeObj.borderColor}`;
        returnStyle.background =
          targetItem.activeObj.backgroundType == "color"
            ? targetItem.activeObj.backgroundColor
            : `url(${setMinioUrl(targetItem.activeObj.backgroundImage)}) 50% 50% / ${
                targetItem.activeObj.backgroundImageType
              } no-repeat`;
      }
    }

    return returnStyle;
  };

  const styleActiveFont = (index: number) => {
    const returnStyle: CSSProperties = {
      color: option.value.activeObj.fontColor,
      fontSize: `${option.value.activeObj.fontSize || 12}px`,
      fontWeight: option.value.activeObj.fontWeight,
      fontFamily: option.value.activeObj.fontFamily,
      fontStyle: option.value.activeObj.fontStyle,
      textShadow: option.value.activeObj.isTextShadow
        ? `${option.value.activeObj.textShadow.color} ${option.value.activeObj.textShadow.x || 0}px ${
            option.value.activeObj.textShadow.y || 0
          }px ${option.value.activeObj.textShadow.blur}px`
        : "none",
      transform: `translate(${option.value.activeObj.textTranslateX || 0}px, ${
        option.value.activeObj.textTranslateY || 0
      }px)`,
    };

    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.activeObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.color = `${targetItem.activeObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.activeObj.fontSize || 12}px`;
        returnStyle.fontWeight = `${targetItem.activeObj.fontWeight}`;
        returnStyle.fontFamily = `${targetItem.activeObj.fontFamily}`;
        returnStyle.fontStyle = `${targetItem.activeObj.fontStyle}`;
        returnStyle.textShadow = `${
          targetItem.activeObj.isTextShadow
            ? `${targetItem.activeObj.textShadow.color} ${targetItem.activeObj.textShadow.x || 0}px ${
                targetItem.activeObj.textShadow.y || 0
              }px ${targetItem.activeObj.textShadow.blur}px`
            : "none"
        }`;
        returnStyle.transform = `translate(${targetItem.activeObj.textTranslateX || 0}px, ${
          targetItem.activeObj.textTranslateY || 0
        }px)`;
      }
    }

    return returnStyle;
  };
  const styleHoverFont = (index: number) => {
    // 样式里开启了悬停后，系列里面才有悬停选项，然后渲染默认设置样式里的悬停，如果系列里开启了系列样式优先且有对应系列的悬停样式则用对应样式
    const returnStyle: CSSProperties = option.value.isHovered
      ? {
          color: option.value.hoverObj.fontColor,
          fontSize: `${option.value.hoverObj.fontSize || 12}px`,
          fontWeight: option.value.hoverObj.fontWeight,
          fontFamily: option.value.hoverObj.fontFamily,
          fontStyle: option.value.hoverObj.fontStyle,
          textShadow: option.value.hoverObj.isTextShadow
            ? `${option.value.hoverObj.textShadow.color} ${option.value.hoverObj.textShadow.x || 0}px ${
                option.value.hoverObj.textShadow.y || 0
              }px ${option.value.hoverObj.textShadow.blur}px`
            : "none",
          transform: `translate(${option.value.hoverObj.textTranslateX || 0}px, ${
            option.value.hoverObj.textTranslateY || 0
          }px)`,
          border: option.value.hoverObj.isBorder
            ? `${option.value.hoverObj.borderWidth || 0}px solid ${option.value.hoverObj.borderColor}`
            : "none",
          background:
            option.value.hoverObj.backgroundType == "color"
              ? option.value.hoverObj.backgroundColor
              : `url(${setMinioUrl(option.value.hoverObj.backgroundImage)}) 50% 50% / ${
                  option.value.hoverObj.backgroundImageType
                } no-repeat`,
        }
      : {};

    // 根据是否系列样式优先设置样式
    if (
      option.value.isHovered &&
      option.value.isSeriesFirst &&
      option.value.seriesTabsList?.length &&
      index !== -1
    ) {
      // 如果找不到对应系列的样式则使用全局的option.activeObj样式
      const targetItem = option.value.seriesTabsList?.[index];
      if (targetItem) {
        returnStyle.color = `${targetItem.hoverObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.hoverObj.fontSize || 12}px`;
        returnStyle.fontWeight = `${targetItem.hoverObj.fontWeight}`;
        returnStyle.fontFamily = `${targetItem.hoverObj.fontFamily}`;
        returnStyle.fontStyle = `${targetItem.hoverObj.fontStyle}`;
        returnStyle.textShadow = `${
          targetItem.hoverObj.isTextShadow
            ? `${targetItem.hoverObj.textShadow.color} ${targetItem.hoverObj.textShadow.x || 0}px ${
                targetItem.hoverObj.textShadow.y || 0
              }px ${targetItem.hoverObj.textShadow.blur}px`
            : "none"
        }`;
        returnStyle.transform = `translate(${targetItem.hoverObj.textTranslateX || 0}px, ${
          targetItem.hoverObj.textTranslateY || 0
        }px)`;
        returnStyle.border = `${targetItem.hoverObj.borderWidth || 0}px solid ${targetItem.hoverObj.borderColor}`;
        returnStyle.background =
          targetItem.hoverObj.backgroundType == "color"
            ? targetItem.hoverObj.backgroundColor
            : `url(${setMinioUrl(targetItem.hoverObj.backgroundImage)}) 50% 50% / ${
                targetItem.hoverObj.backgroundImageType
              } no-repeat`;
      }
    }

    return returnStyle;
  };

  const asyncDeviceStatus = async () => {
    if (!deviceId.value || !baseUrl.value) {
      return;
    }

    try {
      availableWindows.value = await iotApiService.getListWindows({
        deviceId: Number(deviceId.value),
        baseUrl: baseUrl.value,
        pattern: option.value.pattern,
      });

      if (!isArray(availableWindows.value)) {
        console.error("获取窗口列表失败");
        return;
      }

      dataChart.value = availableWindows.value.map((item) => ({
        label: item.title,
        value: item.hwnd,
      }));

      if (dataChart.value.length) {
        dataChart.value.unshift({
          label: "刷新窗口列表",
          value: "refreshWindows",
        });
      }

      if (availableWindows.value.length > rows.value * option.value.columns) {
        rows.value = Math.ceil(
          availableWindows.value.length / option.value.columns,
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  const refreshWindows = (res: any) => {
    if (res.code === 200 && res.success) {
      dataChart.value = res.result.map((item: any) => ({
        label: item.title,
        value: item.hwnd,
      }));

      if (dataChart.value.length) {
        dataChart.value.unshift({
          label: "刷新窗口列表",
          value: "refreshWindows",
        });
      }
    } else {
      ElMessage.error(res.message || "刷新窗口列表失败");
    }
  };

  const handleIotMessageEnd = (info: any) => {
    if (availableWindows.value.length === 0) {
      return;
    }

    sendIotMessage({
      params: {
        hwnd: info.value,
      },
    }).then((res: any) => {
      if (info.value === "refreshWindows") {
        refreshWindows(res);
      }
    });
  };

  /**
   * 选项卡点击事件处理的核心实现
   * @param info - 被点击的选项卡信息
   */
  const _handleClickImpl = (info: TabItem) => {
    console.log("_handleClickImpl", info);
    if (option.value.isFixedSelectedItem) {
      handleEventAndCallbackEvent({
        throwValue: info,
        events: options.events,
        triggerType: EventTypeEnum.Click,
        id: options.id,
      });
      return;
    }

    if (
      !info ||
      !dataChart.value.some(
        (item: TabItem) => String(item.value) === String(info.value),
      )
    ) {
      currentActive.value = null;
    } else if (String(currentActive.value) === String(info.value)) {
      if (option.value.isCancelSelected) {
        currentActive.value = null;
      }
    } else {
      currentActive.value = info.value;
    }

    const safeValue = currentActive.value ?? "";
    handleEventAndCallbackEvent({
      throwValue:
        currentActive.value === null
          ? {
              value: "null",
            }
          : { ...info, value: safeValue },
      events: options.events,
      triggerType: EventTypeEnum.Click,
      id: options.id,
    });
  };

  /**
   * 注册关联触发器
   * 根据是否隔离配置，决定注册到全局作用域(0)还是父级动态面板作用域
   * 使用未防抖的核心实现，避免关联触发时的延迟
   */
  const registerRelatedTrigger = () => {
    if (!option.value.related) {
      return;
    }

    if (!option.value.isIsolated) {
      relatedTrigger.register({
        panelId: 0,
        componentId: `${id.value}`,
        trigger: _handleClickImpl,
      });
    } else {
      if (
        !options.parentDynamicPanelId ||
        !options.parentDynamicPanelId.length
      ) {
        console.error("parentDynamicPanelId is not defined");
        return;
      }

      const parentPanelId =
        options.parentDynamicPanelId[options.parentDynamicPanelId.length - 1];
      relatedTrigger.register({
        panelId: parentPanelId,
        componentId: `${id.value}`,
        trigger: _handleClickImpl,
      });
    }
  };

  /**
   * 触发关联的选项卡组件
   * @param info - 触发信息
   */
  const triggerRelated = (info: TabItem) => {
    if (!option.value.related) {
      return;
    }

    if (!option.value.isIsolated) {
      relatedTrigger.trigger({
        panelId: 0,
        info,
        triggerComponentId: `${id.value}`,
      });
    } else {
      if (
        !options.parentDynamicPanelId ||
        !options.parentDynamicPanelId.length
      ) {
        console.error("parentDynamicPanelId is not defined");
        return;
      }

      const parentPanelId =
        options.parentDynamicPanelId[options.parentDynamicPanelId.length - 1];
      relatedTrigger.trigger({
        panelId: parentPanelId,
        info,
        triggerComponentId: `${id.value}`,
      });
    }
  };

  return {
    rows,
    currentActive,
    isFirst,
    eventStatus,
    encodeStatus,
    styleGrid,
    liMinHeight,
    styleFlex,
    componentClasses,
    option,
    dataChart,
    isBuild,
    height,
    baseUrl,
    deviceId,
    id,
    events,
    encodes,
    cbArgs,
    styleDefaultItem,
    styleActiveItem,
    styleDefaultFont,
    styleActiveFont,
    styleHoverFont,
    handleIotMessageEnd,
    handleEventAndCallbackEvent,
    handleEncode,
    asyncDeviceStatus,
    _handleClickImpl,
    triggerRelated,
    registerRelatedTrigger,
  };
};
