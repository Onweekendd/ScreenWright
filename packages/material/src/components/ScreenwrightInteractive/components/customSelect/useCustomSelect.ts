import { setMinioUrl } from "@material/minioUrl";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { cloneDeep, isArray } from "lodash-es";
import type { ComponentPublicInstance } from "vue";
import { computed, nextTick, onMounted, ref, watch } from "vue";

export interface CustomSelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

interface Item {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export const useCustomSelect = (props: { element: ComponentType }) => {
  const {
    option,
    dataChart,
    height,
    events,
    encodes,
    isBuild,
    cbArgs,
    isView,
    handleEventAndCallbackEvent,
    handleEncode,
  } = useBaseData(props.element);
  const { addEvent } = useActionEvent();

  // 响应式状态
  const selectDom = ref<ComponentPublicInstance>();
  const optionArr = ref<CustomSelectOption[]>([]);
  const selectVal = ref<string | number>("");
  const selectValue = ref<any>({});
  const isFirst = ref(true);
  const currentEvent = ref("");

  // 计算属性
  const index = computed(() => {
    return option.value.defaultIndex - 1;
  });

  const customSelectClasses = computed(() => {
    return {
      "has-bind": events.value?.length && isBuild,
      "has-encode": encodes.value?.length && isBuild,
    };
  });

  // 方法
  const setDefaultVal = () => {
    let item: Item = { label: "", value: "" };
    const f = optionArr.value[option.value.defaultIndex - 1];
    if (f) {
      item = f;
    }

    selectVal.value = item.value;
    selectValue.value = item;
    isFirst.value = true;
  };

  const init = async () => {
    await nextTick();
    if (!selectDom.value || !selectDom.value.$el) {
      return;
    }

    const bodyRefDom = selectDom.value.$el;

    const elInputDom = [...[...bodyRefDom.children][0].children][0];
    const input = selectDom.value.$el.querySelector(".el-select__wrapper");
    if (isBuild.value) {
      elInputDom.style.setProperty("pointer-events", "none");
    }

    // 初始化各部分样式
    initBoxStyles(input);
    initBackgroundStyles(input);
    setDefaultVal();
    initCssVariables(bodyRefDom);
    initDropdownConfig(bodyRefDom);
  };

  // 初始化边框样式
  const initBoxStyles = (input: HTMLElement) => {
    input.style.setProperty(
      "border-width",
      `${option.value.boxBorderWidth}px`,
      "important",
    );
    input.style.setProperty(
      "border-color",
      option.value.boxBorderColor,
      "important",
    );
    input.style.setProperty(
      "border-radius",
      option.value.boxRadius + "%",
      "important",
    );
    input.style.setProperty("border-style", "solid");
  };

  // 初始化背景样式
  const initBackgroundStyles = (input: HTMLElement) => {
    if (option.value.boxBackgroundType === "custom") {
      input.style.setProperty("background-repeat", `no-repeat`, "important");
      input.style.setProperty("background-size", `100% 100%`, "important");
      input.style.setProperty(
        "background-image",
        `url(${setMinioUrl(option.value.boxBackgroundImage, true)})`,
        "important",
      );
      input.style.setProperty("background-color", "transparent", "important");
    } else {
      input.style.setProperty(
        "background-color",
        option.value.boxBackground,
        "important",
      );
      input.style.setProperty("background-image", "none", "important");
    }
  };

  // 初始化CSS变量
  const initCssVariables = (bodyRefDom: HTMLElement) => {
    // 辅助函数：设置CSS变量
    const setStyleVariable = (
      styleName: string,
      unit = "",
      styleValue?: string,
    ) => {
      if (styleName) {
        if (
          styleName === "dropDownHeight" &&
          isArray(dataChart.value) &&
          dataChart.value.length > 0
        ) {
          const value =
            option.value.dropDownHeight >
            (option.value.optionHeight + option.value.optionSpace) *
              dataChart.value.length
              ? (option.value.optionHeight + option.value.optionSpace) *
                dataChart.value.length
              : option.value.dropDownHeight;
          bodyRefDom.style.setProperty(`--${styleName}`, value + unit);
        } else {
          bodyRefDom.style.setProperty(
            `--${styleName}`,
            styleValue || option.value[styleName] + unit,
          );
        }
      }
    };

    // 设置基本样式
    setStyleVariable("indent", "px");

    // 设置盒子文本样式
    initBoxTextStyles(setStyleVariable);

    // 设置选项样式
    initOptionStyles(setStyleVariable);

    // 设置默认状态样式
    initDefaultStyles(setStyleVariable);

    // 设置悬停状态样式
    initHoverStyles(setStyleVariable);

    // 设置下拉框样式
    initDropdownStyles(setStyleVariable);

    // 设置下拉图标样式
    initDropdownIconStyles(setStyleVariable);
  };

  // 初始化盒子文本样式
  const initBoxTextStyles = (
    setStyleVariable: (
      styleName: string,
      unit?: string,
      styleValue?: string,
    ) => void,
  ) => {
    setStyleVariable("boxFontSize", "px");
    setStyleVariable("boxFontFamily");
    setStyleVariable("boxFontStyle");
    setStyleVariable("boxFontWeight");
    setStyleVariable("boxColor");
    setStyleVariable("boxLetterSpacing", "px");
    setStyleVariable("boxTextAlign");
    setStyleVariable(
      "boxTransform",
      "",
      `translate(${option.value.boxLabelOffsetX || 0}px,${option.value.boxLabelOffsetY || 0}px)`,
    );
  };

  // 初始化选项样式
  const initOptionStyles = (
    setStyleVariable: (
      styleName: string,
      unit?: string,
      styleValue?: string,
    ) => void,
  ) => {
    setStyleVariable("optionHeight", "px");
    setStyleVariable("optionSpace", "px");
  };

  // 初始化默认状态样式
  const initDefaultStyles = (
    setStyleVariable: (
      styleName: string,
      unit?: string,
      styleValue?: string,
    ) => void,
  ) => {
    setStyleVariable("defaultFontSize", "px");
    setStyleVariable("defaultFontFamily");
    setStyleVariable("defaultFontStyle");
    setStyleVariable("defaultFontWeight");
    setStyleVariable("defaultColor");
    setStyleVariable("defaultLetterSpacing", "px");
    setStyleVariable("defaultTextAlign");
    setStyleVariable(
      "defaultLabelTransform",
      "",
      `translate(${option.value.defaultLabelOffsetX || 0}px,${option.value.defaultLabelOffsetY || 0}px)`,
    );
  };

  // 初始化悬停状态样式
  const initHoverStyles = (
    setStyleVariable: (
      styleName: string,
      unit?: string,
      styleValue?: string,
    ) => void,
  ) => {
    setStyleVariable("hoverFontSize", "px");
    setStyleVariable("hoverFontFamily");
    setStyleVariable("hoverFontStyle");
    setStyleVariable("hoverFontWeight");
    setStyleVariable("hoverColor");
    setStyleVariable("hoverLetterSpacing", "px");
    setStyleVariable(
      "hoverLabelTransform",
      "",
      `translate(${option.value.hoverLabelOffsetX || 0}px,${option.value.hoverLabelOffsetY || 0}px)`,
    );
  };

  // 初始化下拉框样式
  const initDropdownStyles = (
    setStyleVariable: (
      styleName: string,
      unit?: string,
      styleValue?: string,
    ) => void,
  ) => {
    setStyleVariable("dropDownHeight", "px");
    setStyleVariable("topOffset", "px");
    setStyleVariable("scrollBarWidth", "px");
    setStyleVariable("scrollBgColor");
    setStyleVariable("barBgColor");
    setStyleVariable("dropdownBackgroundColor");
  };

  // 初始化下拉图标样式
  const initDropdownIconStyles = (
    setStyleVariable: (
      styleName: string,
      unit?: string,
      styleValue?: string,
    ) => void,
  ) => {
    // 下拉框图标
    if (option.value.dropDownIcon) {
      setStyleVariable(
        "dropDownIcon",
        "",
        `url(${setMinioUrl(option.value.dropDownIcon, true)})`,
      );
      setStyleVariable("contentColor", "", "transparent");
    } else {
      setStyleVariable("dropDownIcon", "", "");
      setStyleVariable("contentColor", "", option.value.contentColor || "#fff");
    }
    setStyleVariable("dropDownIconSize", "px");
    setStyleVariable("rightMargin", "px");
  };

  // 配置下拉框位置和背景
  const initDropdownConfig = (bodyRefDom: HTMLElement) => {
    // 计算下拉框高度
    const dataLength = dataChart.value.length || 0;
    const optionH =
      dataLength * (option.value.optionHeight + option.value.optionSpace) +
      (dataLength - 1);

    // 设置下拉框弹出方向
    bodyRefDom.style.setProperty(
      `--selectTop`,
      `${
        option.value.dropDownPosition === "top"
          ? -1 * Math.min(optionH, option.value.dropDownHeight) - height.value
          : 0
      }px`,
    );
    bodyRefDom.style.setProperty(
      `--selectTransformOrigin`,
      option.value.dropDownPosition === "top" ? "center bottom" : "center top",
    );

    // 设置背景样式
    initSelectBackgroundStyles(bodyRefDom);
  };

  // 设置选择器背景样式
  const initSelectBackgroundStyles = (bodyRefDom: HTMLElement) => {
    // 设置默认背景
    if (option.value.defaultBackgroundType === "custom") {
      bodyRefDom.style.setProperty(
        "--defaultBackground",
        `url(${setMinioUrl(option.value.defaultBackgroundImage, true)}) no-repeat`,
      );
      bodyRefDom.style.setProperty(
        "--selectBackgroundImage",
        `url(${setMinioUrl(option.value.defaultBackgroundImage, true)})`,
      );
      bodyRefDom.style.setProperty("--selectBackgroundColor", "transparent");
    } else {
      bodyRefDom.style.setProperty(
        "--defaultBackground",
        option.value.defaultBackground,
      );
      bodyRefDom.style.setProperty(
        "--selectBackgroundColor",
        option.value.defaultBackground,
      );
      bodyRefDom.style.setProperty("--selectBackgroundImage", "");
    }

    // 设置悬停背景
    if (option.value.hoverBackgroundType === "custom") {
      bodyRefDom.style.setProperty(
        "--hoverBackgroundImage",
        `url(${setMinioUrl(option.value.hoverBackgroundImage)})`,
      );
      bodyRefDom.style.setProperty("--hoverBackground", "transparent");
    } else {
      bodyRefDom.style.setProperty(
        "--hoverBackground",
        option.value.hoverBackground,
      );
      bodyRefDom.style.setProperty("--hoverBackgroundImage", "");
    }
  };

  // 处理值变更
  const changeValue = (info: any, isMsg?: boolean, _type = "click") => {
    selectVal.value = info.value;
    selectValue.value = info;

    // 处理编码
    handleEncode(info);

    // 处理事件和回调
    handleEventAndCallbackEvent({
      id: props.element.id,
      triggerType: EventTypeEnum.Click,
      events: props.element.events,

      throwValue: info,
    });
    // handleEventAndCallbackEvent(props.element, info, isMsg, "click")
  };

  // 点击处理函数（供外部调用）
  const handleClick = (info: any) => {
    changeValue(info);
  };

  // 鼠标事件处理
  const handleMouseEvent = (type: string, _info: any) => {
    if (currentEvent.value !== type) {
      currentEvent.value = type;
      const eventName =
        type === "mouseEnter"
          ? EventTypeEnum.MouseEnter
          : EventTypeEnum.MouseLeave;
      handleEventAndCallbackEvent({
        id: props.element.id,
        triggerType: eventName,
        events: props.element.events,

        throwValue: selectValue.value,
      });
    }
  };

  // 监听数据变化
  watch(
    () => dataChart.value,
    (value) => {
      if (value?.length) {
        // 处理选项数组
        optionArr.value = Array.isArray(value) ? value : [];
        optionArr.value = optionArr.value.map((item: Item) => {
          if (typeof item.disabled === "string") {
            // 修复 toLowerCase 错误
            const disabledStr = String(item.disabled);
            item.disabled = disabledStr.toLowerCase() === "true";
          }
          return item;
        });

        // 设置当前选中值
        const curInfo = value[index.value];
        if (cbArgs.value?.length > 0 && isView.value && curInfo) {
          changeValue(curInfo);
        }

        // 触发数据变更事件
        const eventInfo = { value: cloneDeep(curInfo) };
        // handleEventAndCallbackEvent(props.element, eventInfo, undefined, "dataChange")
        handleEventAndCallbackEvent({
          id: props.element.id,
          triggerType: EventTypeEnum.DataChange,
          events: props.element.events,

          throwValue: eventInfo,
        });
      } else {
        // 处理空数据
        optionArr.value = [];
        const curInfo = {
          label: "",
          value: "",
          disabled: false,
        };
        if (cbArgs.value?.length > 0 && isView.value) {
          changeValue(curInfo);
        }
      }
      init();
    },
    { deep: true },
  );

  // 监听配置变化
  watch(
    () => option.value,
    async () => {
      await nextTick();
      init();
    },
    { deep: true, immediate: true },
  );
  // 生命周期
  onMounted(() => {
    nextTick(() => {
      optionArr.value = Array.isArray(dataChart.value) ? dataChart.value : [];
      setDefaultVal();
      init();
    });

    // 注册组件事件到全局事件系统
    addEvent({
      [`${interactiveEnum.FtCustomSelect}-${props.element.id}`]: {
        handleClick,
      },
    });
  });
  return {
    isBuild,
    selectDom,
    option,
    optionArr,
    selectVal,
    selectValue,
    isFirst,
    currentEvent,
    index,
    customSelectClasses,
    setDefaultVal,
    init,
    handleEncode,
    changeValue,
    handleMouseEvent,
    handleEventAndCallbackEvent,
  };
};
