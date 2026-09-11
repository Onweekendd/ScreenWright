import { setMinioUrl } from "@material/minioUrl";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { debounce } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import { RelatedTrigger } from "./RelatedTrigger";
import type { SubtabsOption } from "./type";

/**
 * 选项卡项类型定义
 */
export interface TabItem {
  label: string;
  value: string;
  disabled?: boolean;
  isChecked?: boolean;
  children?: TabItem[];
  [key: string]: any;
}

/**
 * useSubtabs composable
 * 用于管理选项卡组件的状态和行为
 * @param element - 组件元素配置
 * @returns 选项卡相关的状态、方法和样式
 */
export function useSubtabs(
  element: ComponentType<interactiveEnum.Subtabs, SubtabsOption>,
) {
  const { addEvent } = useActionEvent();
  const relatedTrigger = RelatedTrigger.getInstance();

  // 使用基础数据
  const {
    option,
    dataChart,
    events,
    encodes,
    isBuild,
    id,
    handleEncode,
    handleEventAndCallbackEvent,
  } = useBaseData(element);
  // DOM引用
  const subtabs = ref<HTMLElement | null>(null);

  // 响应式状态
  const currentActive = ref<string | null>(null);
  const isFirst = ref(true);
  const eventStatus = ref(false);
  const encodeStatus = ref(false);

  /**
   * 计算列表项最小高度
   */
  const liMinHeight = computed<CSSProperties>(() => {
    return {
      minHeight: option.value.setMinHeight
        ? `${element.component.height / option.value.rows}px`
        : "auto",
    };
  });

  /**
   * 计算网格布局样式
   */
  const styleGrid = computed<CSSProperties>(() => {
    return {
      gridTemplateRows: `repeat(${option.value.rows}, 1fr)`,
      gridTemplateColumns: `repeat(${option.value.columns}, 1fr)`,
      rowGap: `${option.value.rowGap}px`,
      columnGap: `${option.value.columnGap}px`,
    };
  });

  /**
   * 计算弹性布局样式
   */
  const styleFlex = computed<CSSProperties>(() => {
    return {
      padding: `${option.value.paddingTop}px ${option.value.paddingRight}px ${option.value.paddingBottom}px ${option.value.paddingLeft}px`,
      writingMode: option.value.writingMode, // tb-rl 文字方向
      alignItems: option.value.alignItems, //flex-start, flex-end
    };
  });

  /**
   * Canvas滑动事件处理
   * 使用未防抖的核心实现，立即响应滑动操作
   * @param op - 包含id和索引的操作对象
   */
  const onCanvasSlide = (op: { id: string; index: number }) => {
    if (op.id === String(id.value)) {
      console.log("tab slide", op.index);
      const index =
        dataChart.value.findIndex(
          (it: TabItem) => String(it.value) === String(currentActive.value),
        ) + op.index;
      if (index >= 0 && index < dataChart.value.length) {
        handleClick(dataChart.value[index]);
      }
    }
  };

  /**
   * 选项卡点击事件处理的核心实现
   * @param info - 被点击的选项卡信息
   * @param isExecuteOnlyConditionSatisfied - 是否仅执行满足条件的事件，默认false
   */
  const _handleClickImpl = (
    info: TabItem,
    isExecuteOnlyConditionSatisfied = false,
    event = EventTypeEnum.Click,
  ) => {
    if (option.value.isFixedSelectedItem) {
      handleEventAndCallbackEvent({
        throwValue: info,
        events: element.events,
        triggerType: EventTypeEnum.Click,
        isExecuteOnlyConditionSatisfied,
        id: element.id,
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
    handleEventAndCallbackEvent({
      throwValue:
        currentActive.value === null
          ? {
              value: "null",
            }
          : { ...info },
      events: element.events,
      triggerType: event,
      isExecuteOnlyConditionSatisfied,
      id: element.id,
    });
  };

  /**
   * 选项卡点击事件处理（防抖版本）
   * 防抖延迟500ms执行，并在执行后延迟500ms重置状态，防止快速连续点击
   * @param info - 被点击的选项卡信息
   * @param isExecuteOnlyConditionSatisfied - 是否仅执行满足条件的事件，默认false
   */
  const handleClick = debounce(
    (info: TabItem, isExecuteOnlyConditionSatisfied = false) => {
      _handleClickImpl(info, isExecuteOnlyConditionSatisfied);

      triggerRelated(info);
    },
    500,
    {
      leading: true,
      trailing: false,
    },
  );

  /**
   * 获取默认状态下的选项卡项样式
   * @param index - 选项卡索引
   * @returns CSS样式对象
   */
  const styleDefaultItem = (index: number): CSSProperties => {
    const returnStyle: CSSProperties = {
      border: option.value.defaultObj.isBorder
        ? `${option.value.defaultObj.borderWidth || 0}px solid ${option.value.defaultObj.borderColor}`
        : `none`,
      background:
        option.value.defaultObj.backgroundType == "color"
          ? option.value.defaultObj.backgroundColor
          : `url('${setMinioUrl(option.value.defaultObj.backgroundImage, true)}') 50% 50% / ${
              option.value.defaultObj.backgroundImageType
            } no-repeat`,
    };

    // 根据是否系列样式优先设置样式
    if (option.value.isSeriesFirst && option.value.seriesTabsList?.length) {
      // 如果找不到对应系列的样式则使用全局的option.defaultObj样式
      const targetItem = option.value.seriesTabsList[index];
      if (targetItem) {
        returnStyle.border = `${targetItem.defaultObj.borderWidth || 0}px solid ${targetItem.defaultObj.borderColor}`;
        returnStyle.background =
          targetItem.defaultObj.backgroundType == "color"
            ? targetItem.defaultObj.backgroundColor
            : `url('${setMinioUrl(targetItem.defaultObj.backgroundImage, true)}') 50% 50% / ${
                targetItem.defaultObj.backgroundImageType
              } no-repeat`;
      }
    }

    return returnStyle;
  };

  /**
   * 获取默认状态下的字体样式
   * @param index - 选项卡索引
   * @returns CSS样式对象
   */
  const styleDefaultFont = (index: number): CSSProperties => {
    const fontWeight =
      typeof option.value.defaultObj.fontWeight === "boolean"
        ? option.value.defaultObj.fontWeight
          ? "bold"
          : "normal"
        : option.value.defaultObj.fontWeight;
    const fontStyle =
      typeof option.value.defaultObj.fontStyle === "boolean"
        ? option.value.defaultObj.fontStyle
          ? "italic"
          : "normal"
        : option.value.defaultObj.fontStyle;

    const returnStyle: CSSProperties = {
      color: option.value.defaultObj.fontColor,
      fontSize: `${option.value.defaultObj.fontSize || 12}px`,
      fontWeight: fontWeight,
      fontFamily: option.value.defaultObj.fontFamily,
      fontStyle: fontStyle,
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
        const seriesFontWeight =
          typeof targetItem.defaultObj.fontWeight === "boolean"
            ? targetItem.defaultObj.fontWeight
              ? "bold"
              : "normal"
            : targetItem.defaultObj.fontWeight;
        const seriesFontStyle =
          typeof targetItem.defaultObj.fontStyle === "boolean"
            ? targetItem.defaultObj.fontStyle
              ? "italic"
              : "normal"
            : targetItem.defaultObj.fontStyle;

        returnStyle.color = `${targetItem.defaultObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.defaultObj.fontSize || 12}px`;
        returnStyle.fontWeight = seriesFontWeight;
        returnStyle.fontFamily = `${targetItem.defaultObj.fontFamily}`;
        returnStyle.fontStyle = seriesFontStyle;
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

  /**
   * 获取激活状态下的选项卡项样式
   * @param index - 选项卡索引
   * @returns CSS样式对象
   */
  const styleActiveItem = (index: number): CSSProperties => {
    const returnStyle: CSSProperties = {
      border: option.value.activeObj.isBorder
        ? `${option.value.activeObj.borderWidth || 0}px solid ${option.value.activeObj.borderColor}`
        : `none`,
      background:
        option.value.activeObj.backgroundType == "color"
          ? option.value.activeObj.backgroundColor
          : `url('${setMinioUrl(option.value.activeObj.backgroundImage, true)}') 50% 50% / ${
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
            : `url('${setMinioUrl(targetItem.activeObj.backgroundImage, true)}') 50% 50% / ${
                targetItem.activeObj.backgroundImageType
              } no-repeat`;
      }
    }

    return returnStyle;
  };

  /**
   * 获取激活状态下的字体样式
   * @param index - 选项卡索引
   * @returns CSS样式对象
   */
  const styleActiveFont = (index: number): CSSProperties => {
    const fontWeight =
      typeof option.value.activeObj.fontWeight === "boolean"
        ? option.value.activeObj.fontWeight
          ? "bold"
          : "normal"
        : option.value.activeObj.fontWeight;
    const fontStyle =
      typeof option.value.activeObj.fontStyle === "boolean"
        ? option.value.activeObj.fontStyle
          ? "italic"
          : "normal"
        : option.value.activeObj.fontStyle;

    const returnStyle: CSSProperties = {
      color: option.value.activeObj.fontColor,
      fontSize: `${option.value.activeObj.fontSize || 12}px`,
      fontWeight: fontWeight,
      fontFamily: option.value.activeObj.fontFamily,
      fontStyle: fontStyle,
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
        const seriesFontWeight =
          typeof targetItem.activeObj.fontWeight === "boolean"
            ? targetItem.activeObj.fontWeight
              ? "bold"
              : "normal"
            : targetItem.activeObj.fontWeight;
        const seriesFontStyle =
          typeof targetItem.activeObj.fontStyle === "boolean"
            ? targetItem.activeObj.fontStyle
              ? "italic"
              : "normal"
            : targetItem.activeObj.fontStyle;

        returnStyle.color = `${targetItem.activeObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.activeObj.fontSize || 12}px`;
        returnStyle.fontWeight = seriesFontWeight;
        returnStyle.fontFamily = `${targetItem.activeObj.fontFamily}`;
        returnStyle.fontStyle = seriesFontStyle;
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

  /**
   * 获取悬停状态下的字体样式
   * @param index - 选项卡索引
   * @returns CSS样式对象
   */
  const styleHoverFont = (index: number): CSSProperties => {
    // 样式里开启了悬停后，系列里面才有悬停选项，然后渲染默认设置样式里的悬停，如果系列里开启了系列样式优先且有对应系列的悬停样式则用对应样式
    const hoverFontWeight =
      typeof option.value.hoverObj.fontWeight === "boolean"
        ? option.value.hoverObj.fontWeight
          ? "bold"
          : "normal"
        : option.value.hoverObj.fontWeight;
    const hoverFontStyle =
      typeof option.value.hoverObj.fontStyle === "boolean"
        ? option.value.hoverObj.fontStyle
          ? "italic"
          : "normal"
        : option.value.hoverObj.fontStyle;

    const returnStyle: CSSProperties = option.value.isHovered
      ? {
          color: option.value.hoverObj.fontColor,
          fontSize: `${option.value.hoverObj.fontSize || 12}px`,
          fontWeight: hoverFontWeight,
          fontFamily: option.value.hoverObj.fontFamily,
          fontStyle: hoverFontStyle,
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
              : `url('${setMinioUrl(option.value.hoverObj.backgroundImage, true)}') 50% 50% / ${
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
        const seriesHoverFontWeight =
          typeof targetItem.hoverObj.fontWeight === "boolean"
            ? targetItem.hoverObj.fontWeight
              ? "bold"
              : "normal"
            : targetItem.hoverObj.fontWeight;
        const seriesHoverFontStyle =
          typeof targetItem.hoverObj.fontStyle === "boolean"
            ? targetItem.hoverObj.fontStyle
              ? "italic"
              : "normal"
            : targetItem.hoverObj.fontStyle;

        returnStyle.color = `${targetItem.hoverObj.fontColor}`;
        returnStyle.fontSize = `${targetItem.hoverObj.fontSize || 12}px`;
        returnStyle.fontWeight = seriesHoverFontWeight;
        returnStyle.fontFamily = `${targetItem.hoverObj.fontFamily}`;
        returnStyle.fontStyle = seriesHoverFontStyle;
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
            : `url('${setMinioUrl(targetItem.hoverObj.backgroundImage, true)}') 50% 50% / ${
                targetItem.hoverObj.backgroundImageType
              } no-repeat`;
      }
    }

    return returnStyle;
  };

  /**
   * 设置悬停样式到CSS变量
   * @param targetIndex - 目标选项卡索引，默认-1表示使用全局样式
   */
  const setHoverStyle = (targetIndex = -1) => {
    const fields = [
      "color",
      "fontSize",
      "fontWeight",
      "fontFamily",
      "fontStyle",
      "textShadow",
      "transform",
      "border",
      "background",
    ];
    const index =
      option.value.isSeriesFirst && option.value.seriesTabsList?.length
        ? targetIndex
        : -1;

    if (!subtabs.value) {
      return;
    }

    fields.forEach((field) => {
      const value = styleHoverFont(index)[field as keyof CSSProperties];
      subtabs.value?.style.setProperty(
        `--hover-${field}`,
        value?.toString() || "",
      );
    });
  };

  /**
   * 鼠标事件处理（移入/移出）
   * @param type - 事件类型
   * @param info - 选项卡信息
   * @param index - 选项卡索引
   * @param isExecuteOnlyConditionSatisfied - 是否仅执行满足条件的事件，默认false
   */
  const handleMouseEvent = (
    type: EventTypeEnum,
    info: TabItem,
    index?: number,
    isExecuteOnlyConditionSatisfied = false,
  ) => {
    setHoverStyle(index);
    handleEventAndCallbackEvent({
      throwValue: info,
      events: element.events,
      triggerType: type,
      isExecuteOnlyConditionSatisfied,
      id: element.id,
    });
  };

  /**
   * followCanvasSlide 变化的回调函数
   * @param val - 新的 followCanvasSlide 值
   */
  const onFollowCanvasSlideChange = (val: boolean) => {
    if (val) {
      element.emitter?.emit("followCanvasSlide", id.value);
    }
  };

  /**
   * 数据变化的回调函数
   * @param val - 新的数据
   */
  const onDataChartChange = (val: TabItem[]) => {
    if (val && val.length > 0) {
      // 组件数据变化后 只有点击事件与请求完成或数据变化的事件才会默认触发一次交互事件
      const filterEvents = events.value.filter((item) =>
        ["dataChange"].includes(item.trigger),
      );
      const curInfo = val.find((c: TabItem) => c.value == currentActive.value);

      handleEventAndCallbackEvent({
        throwValue: curInfo || {},
        events: filterEvents,
        triggerType: EventTypeEnum.DataChange,
        isExecuteOnlyConditionSatisfied: false,
        id: element.id,
      });
    }
  };

  /**
   * option.active 变化的回调函数
   * @param val - 新的 active 值
   */
  const onActiveChange = (val: number | undefined) => {
    currentActive.value = val !== undefined ? String(val) : null;
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
        !element.parentDynamicPanelId ||
        !element.parentDynamicPanelId.length
      ) {
        console.error("parentDynamicPanelId is not defined");
        return;
      }

      const parentPanelId =
        element.parentDynamicPanelId[element.parentDynamicPanelId.length - 1];
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
        !element.parentDynamicPanelId ||
        !element.parentDynamicPanelId.length
      ) {
        console.error("parentDynamicPanelId is not defined");
        return;
      }

      const parentPanelId =
        element.parentDynamicPanelId[element.parentDynamicPanelId.length - 1];
      relatedTrigger.trigger({
        panelId: parentPanelId,
        info,
        triggerComponentId: `${id.value}`,
      });
    }
  };

  // 生命周期相关函数
  /**
   * 初始化函数
   * 用于在组件挂载时执行的逻辑
   */
  const init = () => {
    element.emitter?.on("onCanvasSlide", onCanvasSlide);

    currentActive.value =
      option.value.active !== undefined ? String(option.value.active) : null;

    addEvent({
      [`${interactiveEnum.Subtabs}-${element.id}`]: {
        handleClick: (
          info: TabItem,
          options = {
            isExecuteOnlyConditionSatisfied: false,
            triggerType: EventTypeEnum.Click,
          },
        ) => {
          const { isExecuteOnlyConditionSatisfied, triggerType } = options;
          _handleClickImpl(info, isExecuteOnlyConditionSatisfied, triggerType);
          triggerRelated(info);
        },
      },
    });

    if (!option.value.related) {
      return;
    }

    registerRelatedTrigger();
  };

  /**
   * 清理函数
   * 用于在组件卸载时执行的逻辑
   */
  const cleanup = () => {
    eventStatus.value = false;
    encodeStatus.value = false;
    element.emitter?.off("onCanvasSlide", onCanvasSlide);
  };

  return {
    // DOM引用
    subtabs,
    // 响应式状态
    currentActive,
    isFirst,
    eventStatus,
    encodeStatus,
    liMinHeight,
    styleGrid,
    styleFlex,
    // 方法
    onCanvasSlide,
    handleClick,
    styleDefaultItem,
    styleDefaultFont,
    styleActiveItem,
    styleActiveFont,
    styleHoverFont,
    setHoverStyle,
    handleMouseEvent,
    // watch 回调函数
    onFollowCanvasSlideChange,
    onDataChartChange,
    onActiveChange,
    // 生命周期相关
    init,
    cleanup,
    // 来自 useBaseData 的值
    option,
    dataChart,
    events,
    encodes,
    isBuild,
    id,
    handleEncode,
    handleEventAndCallbackEvent,
  };
}
