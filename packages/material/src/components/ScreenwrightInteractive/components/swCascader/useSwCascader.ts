import { setMinioUrl } from "@material/minioUrl";
import { useActionEvent, useBaseData } from "@screenwright/composables";
import { uuid } from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { isUndefined } from "lodash-es";
import { computed, nextTick, onMounted, ref, watch } from "vue";

interface CascaderItem {
  value: string;
  label: string;
  disabled: boolean;
  children?: CascaderItem[];
}
type SelectValue = string | number | any[];
export const useFtCascader = (element: ComponentType) => {
  const {
    dataChart,
    option,
    isBuild,
    handleEventAndCallbackEvent,
    encodes,
    events,
  } = useBaseData(element);
  const { addEvent } = useActionEvent();
  const ftCascader = ref<HTMLElement | null>(null);
  const cascaderDom = ref<HTMLElement | null>(null);
  const optionArr = ref<CascaderItem[]>([]);
  const selectValue = ref<SelectValue>([]);
  const popperClass = ref(`ft-cascader-popper-${uuid()}`);
  const cascaderClasses = computed(() => {
    return {
      "ft-cascader": true,
      "component-bind-events": true,
      "has-bind": events.value?.length && isBuild,
      "has-encode": encodes.value?.length && isBuild,
    };
  });
  // 输入框样式字段列表
  const inputFieldList = [
    "textAlign",
    "color",
    "fontFamily",
    "fontSize",
    "fontWeight",
    "fontStyle",
    "lineHeight",
    "letterSpacing",
    "backgroundType",
    "borderColor",
    "borderWidth",
    "borderRadius",
    "dropDownIcon",
    "dropDownIconSize",
  ];

  // 下拉框样式字段列表
  const popperFieldList = [
    "menuHeight",
    "menuMarginTop",
    "menuMarginLeft",
    "menuHoverFontFamily",
    "menuHoverFontSize",
    "menuHoverLineHeight",
    "menuHoverLetterSpacing",
    "menuHoverColor",
    "menuHoverFontStyle",
    "menuHoverFontWeight",
    "menuDefaultFontFamily",
    "menuDefaultFontSize",
    "menuDefaultLineHeight",
    "menuDefaultLetterSpacing",
    "menuDefaultColor",
    "menuDefaultFontStyle",
    "menuDefaultFontWeight",
    "dropdownBackgroundColor",
    "dropdownMaxHeight",
    "dropdownMarginTop",
    "scrollBarWidth",
    "scrollBackgroundColor",
    "scrollBarColor",
  ];

  // 需要添加px单位的字段
  const regList = [
    "size",
    "height",
    "letterSpacing",
    "width",
    "radius",
    "margin",
  ];

  // 初始化组件样式
  const init = () => {
    if (!ftCascader.value) {
      return;
    }

    const cascaderDomEl = ftCascader.value as HTMLElement;
    const popperDom = document.getElementsByClassName(
      popperClass.value,
    )[0] as HTMLElement;
    if (popperDom) {
      popperDom.style.setProperty("zoom", "var(--scale)");
    }

    // 设置输入框样式
    inputFieldList.forEach((field) => {
      let style = option.value[field];
      console.log(style, "style");
      if (isUndefined(style)) {
        return;
      }

      // 字段包含regList关键词的则+px
      for (let index = 0; index < regList.length; index++) {
        const reg = new RegExp(regList[index], "i");
        if (reg.test(field)) {
          style += "px";
          break;
        }
      }
      cascaderDomEl.style.setProperty(`--${field}`, style);
    });

    // 设置下拉框样式
    if (popperDom) {
      // 将Element类型断言为HTMLElement
      const popperDomEl = popperDom as HTMLElement;

      popperFieldList.forEach((field) => {
        let style = option.value[field];
        if (isUndefined(style)) {
          return;
        }

        // 字段包含regList关键词的则+px
        for (let index = 0; index < regList.length; index++) {
          const reg = new RegExp(regList[index], "i");
          if (reg.test(field)) {
            style += "px";
            break;
          }
        }
        popperDomEl.style.setProperty(`--${field}`, style);
      });
    }

    // 输入框背景
    if (
      option.value.backgroundType === "custom" &&
      option.value.backgroundImage
    ) {
      cascaderDomEl.style.setProperty(
        "--background",
        `url(${setMinioUrl(option.value.backgroundImage)})`,
      );
    } else {
      cascaderDomEl.style.setProperty(
        "--background",
        option.value.backgroundColor,
      );
    }

    // 下拉框选项高亮背景
    if (popperDom) {
      if (option.value.menuHoverBackgroundType === "color") {
        popperDom.style.setProperty(
          "--menuHoverBackground",
          option.value.menuHoverBackgroundColor,
        );
      } else if (option.value.menuHoverBackgroundType === "custom") {
        popperDom.style.setProperty(
          "--menuHoverBackground",
          `url(${setMinioUrl(option.value.menuHoverBackgroundImage)})`,
        );
      }

      // 下拉框选项默认背景
      console.log(
        option.value.menuDefaultBackgroundImage,
        "option.value.menuDefaultBackgroundImage",
      );
      if (option.value.menuDefaultBackgroundType === "color") {
        popperDom.style.setProperty(
          "--menuDefaultBackground",
          option.value.menuDefaultBackgroundColor,
        );
      } else if (option.value.menuDefaultBackgroundType === "custom") {
        popperDom.style.setProperty(
          "--menuDefaultBackground",
          `url(${setMinioUrl(option.value.menuDefaultBackgroundImage)})`,
        );
      }
    }

    // 输入框icon背景
    if (option.value.dropDownIcon) {
      cascaderDomEl.style.setProperty(
        "--dropDownIcon",
        `url(${setMinioUrl(option.value.dropDownIcon)})`,
      );
      cascaderDomEl.style.setProperty("--contentColor", "transparent");
    } else {
      cascaderDomEl.style.setProperty("--dropDownIcon", "");
      cascaderDomEl.style.setProperty("--contentColor", "#fff");
    }

    cascaderDomEl.style.setProperty(
      "--iconDisplay",
      option.value.dropDownIcon ? "none" : "block",
    );
  };

  // 选择值变化
  const changeValue = (info: SelectValue) => {
    selectValue.value = info;
    // 如果是字符串或数字，转换为数组处理
    const infoArray = Array.isArray(info) ? info : [info];
    const findSelectedInfo = (
      list: CascaderItem[],
      valueList: any[],
    ): CascaderItem | undefined => {
      const res = list.find((child) => child.value === valueList[0]);
      if (res && valueList.length === 1) {
        return res;
      }
      if (res?.children) {
        return findSelectedInfo(res.children, valueList.slice(1));
      }
      return undefined;
    };

    const eventInfo = findSelectedInfo(optionArr.value, infoArray);
    // handleEventAndCallbackEvent(element, eventInfo || {}, isMsg, type)
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Click,
      events: element.events,

      throwValue: eventInfo || {},
    });
  };

  // 点击处理函数（供外部调用）
  const handleClick = (info: any) => {
    if (
      info &&
      (Array.isArray(info) ||
        typeof info === "string" ||
        typeof info === "number")
    ) {
      changeValue(info);
    }
  };

  // 格式化数据
  const formatData = (item: CascaderItem) => {
    if (typeof item.disabled === "string") {
      item.disabled = (item.disabled as string).toLowerCase() === "true";
    }

    try {
      if (typeof item.children == "string") {
        item.children = JSON.parse(item.children);
      }
      if (item.children?.length) {
        item.children.forEach((sub: CascaderItem) => {
          formatData(sub);
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // 监听option变化，更新样式
  watch(
    () => option.value,
    () => {
      init();
    },
    { deep: true },
  );

  // 监听数据变化
  watch(
    () => dataChart.value,
    (value) => {
      if (Array.isArray(value)) {
        value.forEach((item: CascaderItem) => {
          formatData(item);
        });
        const curInfo = value;
        // handleEventAndCallbackEvent(element, { info: curInfo }, false, "dataChange")
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.DataChange,
          events: element.events,

          throwValue: curInfo || {},
        });
      } else {
        value = [];
      }
      optionArr.value = value;
    },
    { deep: true },
  );

  // 初始化数据和样式
  const initDataAndStyle = () => {
    nextTick(() => {
      optionArr.value = Array.isArray(dataChart.value) ? dataChart.value : [];
      init();
    });
  };

  // 生命周期
  onMounted(() => {
    // 注册组件事件到全局事件系统
    addEvent({
      [`${interactiveEnum.FtCascader}-${element.id}`]: {
        handleClick,
      },
    });
  });

  return {
    ftCascader,
    cascaderDom,
    optionArr,
    selectValue,
    popperClass,
    option,
    isBuild,
    encodes,
    events,
    cascaderClasses,
    changeValue,
    initDataAndStyle,
  };
};
