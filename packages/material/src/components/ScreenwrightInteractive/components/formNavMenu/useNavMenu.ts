import { useActionEvent, useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { InteractiveEnum as interactiveEnum } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { isArray } from "lodash-es";
import type { CSSProperties } from "vue";
import { computed, nextTick, onBeforeMount, onMounted, ref, watch } from "vue";

// 接口定义
export interface MenuItem {
  value: string;
  label: string;
  image?: string;
  disabled?: boolean;
  isChecked?: boolean;
  children?: MenuItem[];
}

export function useNavMenu(element: ComponentType, isBuild: boolean) {
  const menuTextAlignMap = {
    left: "flex-start",
    center: "center",
    right: "flex-end",
  };
  // 使用交互hooks
  const { dataChart, handleEncode, handleEventAndCallbackEvent } =
    useBaseData(element);
  const { addEvent } = useActionEvent();
  // 获取配置项
  const option = computed(() => element.option || {}) as any;

  // 创建响应式变量
  const isShow = ref(true);
  const current = ref<MenuItem | null>(null);
  const defaultActive = ref(option.value.defaultActive || "");
  const navmenu = ref<HTMLElement | null>(null);
  const menuRef = ref<HTMLElement | null>(null);

  // 计算属性
  const containerStyle = computed<CSSProperties>(() => ({
    padding: `${option.value.paddingTop || 0}px ${option.value.paddingLeft || 0}px`,
    backgroundColor: option.value.backgroundColor,
  }));
  const iconImageStyle = computed<CSSProperties>(() => {
    return !option.value.showParentPrefix
      ? {}
      : {
          width: option.value?.checkboxTabs.parentPrefix.iconWidth + "px",
          height: option.value?.checkboxTabs.parentPrefix.iconHeight + "px",
        };
  });
  const textStyle = computed<CSSProperties>(() => ({
    letterSpacing: `${option.value.letterSpacing || 0}px`,
    fontFamily: option.value.fontFamily,
    fontStyle: option.value.fontStyle,
    textShadow: option.value.isTextShadow
      ? `${option.value.textShadow.color} ${option.value.textShadow.x || 0}px ${option.value.textShadow.y || 0}px ${
          option.value.textShadow.blur
        }px`
      : "none",
  }));
  const childSuffixIcon = computed<CSSProperties>(() => {
    return {
      width: option.value.checkboxTabs.childSuffix.iconStyle.iconWidth + "px",
      height: option.value.checkboxTabs.childSuffix.iconStyle.iconHeight + "px",
      transform: `translateX(${option.value.checkboxTabs.childSuffix.offset}px)`,
    };
  });
  const suffixStyle = computed<CSSProperties>(() => {
    return {
      fontFamily: option.value.checkboxTabs.parentSuffix.textStyle.fontFamily,
      fontSize: option.value.checkboxTabs.childSuffix.textStyle.fontSize + "px",
      color: option.value.checkboxTabs.childSuffix.textStyle.color,
      fontWeight: option.value.checkboxTabs.childSuffix.textStyle.fontWeight,
      fontStyle: option.value.checkboxTabs.childSuffix.textStyle.fontStyle,
      marginLeft: option.value.checkboxTabs.childSuffix.offset + "px",
      // transform: `translateX(${option.value.checkboxTabs.childSuffix.offset}px),translateY(${option.value.checkboxTabs.childSuffix.textStyle.fontSize}px)`,
      // position: "absolute",
      // right: 0
    };
  });
  const childPrefixStyle = computed<CSSProperties>(() => {
    return {
      width: option.value.checkboxTabs.childPrefix.iconWidth + "px",
      height: option.value.checkboxTabs.childPrefix.iconHeight + "px",
      transform: `translateX(${option.value.checkboxTabs.childPrefix.offset}px)`,
    };
  });

  const menuTextAlign = computed(() => {
    if (option.value.textAlign) {
      type textAlignType = "left" | "center" | "right";
      const key = option.value.textAlign as textAlignType;
      return menuTextAlignMap[key];
    } else {
      return "flex-start";
    }
  });

  const childrenMenuAlign = computed(() => {
    if (option.value.childTextAlign) {
      type textAlignType = "left" | "center" | "right";
      const key = option.value.childTextAlign as textAlignType;
      return menuTextAlignMap[key];
    } else {
      return "flex-start";
    }
  });

  watch(
    () => option.value.defaultActive,
    (newval) => {
      updateMenu(newval);
    },
  );

  // 方法定义
  const updateMenu = (newval: string) => {
    const dom: any = menuRef.value;
    console.log("active", dom);
    // 没有设置默认选中项时收起菜单
    if (newval && dom && dom.submenus) {
      for (const k in dom.submenus) {
        dom.closeMenu(k);
      }
    }
    if (dom) {
      // dom.updateActiveIndex(newval)
    }
  };

  const onSubMenu = (e: MouseEvent) => {
    if (option.value.type === "horizontal") {
      let target = e.target as HTMLElement;
      while (
        target.parentElement &&
        target.parentElement.className.indexOf("el-menu--horizontal") === -1
      ) {
        target = target.parentElement;
      }
      nextTick(() => {
        if (target.lastChild) {
          (target.lastChild as HTMLElement).style.left =
            target.offsetLeft + "px";
          (target.lastChild as HTMLElement).style.top =
            target.offsetTop + target.offsetHeight + "px";
        }
      });
    }
  };

  const onChildClick = (info: MenuItem) => {
    handleClick(info);
    handleEncode(info);
  };

  const handleClick = (info: MenuItem) => {
    if (current.value?.value === info.value) {
      return;
    }
    updateMenu(info.value);
    current.value = info;
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Click,
      events: element.events,

      throwValue: info,
    });
    // handleEventAndCallbackEvent(element, info, isMsg, type)
  };

  const handleOpen = (index: string) => {
    const cItem = getDefaultActive(element.data, index);
    console.log(cItem, "citem");
    if (cItem) {
      defaultActive.value = cItem.value;
      handleClick(cItem);
      handleEncode(cItem);
    }
  };

  const getDefaultActive = (
    data: MenuItem[],
    index?: string,
  ): MenuItem | null => {
    if (!data || !data.length) {
      return null;
    }

    for (const item of data) {
      if (item.value === index || !index) {
        // 如果存在子级
        if (item.children && item.children.length > 0) {
          // 返回子级第一个对象
          return getDefaultActive(item.children);
        } else {
          // 若无子级，返回本身
          return item;
        }
      }
    }
    return null;
  };

  const findObjectsWithValue = (
    array: MenuItem[],
    targetValue: string,
  ): MenuItem[] => {
    const result: MenuItem[] = [];

    for (const item of array) {
      if (typeof item === "object" && item !== null) {
        if ("value" in item && item.value === targetValue) {
          result.push(item);
        } else if ("children" in item && Array.isArray(item.children)) {
          // 如果有子数组，则递归调用本函数来检查子数组
          result.push(
            ...findObjectsWithValue(item.children || [], targetValue),
          );
        }
      }
    }

    return result;
  };

  const checkData = ref<MenuItem[]>([]);
  const handleCheck = (res: MenuItem) => {
    console.log("handleCheck", res, dataChart.value);
    if (
      res.children &&
      res.children.length &&
      option.value.checkboxTabs.parentControl
    ) {
      res.children.forEach((item) => {
        if (!item.disabled) {
          item.isChecked = res.isChecked;
        }
      });
    } else {
      const fatherValue = res.value.split("-")[0];

      const fatherIndex = isArray(dataChart.value)
        ? dataChart.value.findIndex((item: any) => {
            return item.value === fatherValue;
          })
        : -1;
      console.log(
        "handleCheck",
        fatherValue,
        fatherIndex,
        dataChart.value[fatherIndex],
      );
      if (fatherIndex !== -1 && dataChart.value[fatherIndex].children.length) {
        let isFatherCheck = true;
        for (let i = 0; i < dataChart.value[fatherIndex].children.length; i++) {
          if (!dataChart.value[fatherIndex].children[i].isChecked) {
            isFatherCheck = false;
            break;
          }
        }
        dataChart.value[fatherIndex].isChecked = isFatherCheck;
        console.log("handleCheck final", dataChart.value[fatherIndex]);
      }
    }

    if (res.isChecked) {
      checkData.value.push(res);
    } else {
      checkData.value.splice(checkData.value.indexOf(res), 1);
    }

    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.Change,
      events: element.events,

      throwValue: checkData.value,
    });
  };

  // 监听变化
  watch(
    () => option.value.type,
    () => {
      if (isBuild) {
        isShow.value = false;
        nextTick(() => {
          isShow.value = true;
          updateMenu(option.value.defaultActive);
        });
      }
    },
  );

  watch(
    () => option.value.defaultActive,
    () => {
      defaultActive.value = option.value.defaultActive;
    },
  );

  watch(
    () => dataChart.value,
    (val) => {
      if (!val) {
        return;
      }
      const info = findObjectsWithValue(val, option.value.defaultActive);
      console.log("info", info);
      if (info && info.length > 0) {
        handleEventAndCallbackEvent({
          id: element.id,
          triggerType: EventTypeEnum.DataChange,
          events: element.events,

          throwValue: checkData.value,
        });
      }
    },
    { deep: true },
  );
  const transformNavMenu = (item: ComponentType): ComponentType => {
    if (item.component.prop === interactiveEnum.FormNavMenu) {
      if (item.option && !item.option.checkboxTabs) {
        item.option.checkboxTabs = {
          multiple: false,
          selectParent: true,
          parentControl: false,
          checkboxStyle: {
            width: 16,
            height: 16,
            borderRadius: 4,
            borderColor: "#393b4a",
            backgroundColor: "#642cff",
          },
          parentPrefix: {
            isDataFirst: true,
            url: "",
            iconWidth: 16,
            iconHeight: 16,
            offset: 0,
          },
          childPrefix: {
            isDataFirst: true,
            url: "",
            iconWidth: "16px",
            iconHeight: "16px",
            offset: 0,
          },
          parentSuffix: {
            type: "icon",
            icon: "",
            text: "length",
            customField: "",
            position: "right",
            offset: 0,
            iconStyle: {
              iconWidth: "16",
              iconHeight: "16",
            },
            textStyle: {
              fontSize: "12px",
              color: "#333333",
              opacity: 1,
              fontWeight: "bold",
              fontStyle: "normal",
              fontFamily: "sans-serif",
            },
          },
          childSuffix: {
            type: "icon",
            icon: "",
            text: "length",
            customField: "",
            position: "right",
            offset: 0,
            iconStyle: {
              iconWidth: "16px",
              iconHeight: "16px",
            },
            textStyle: {
              fontSize: "12px",
              color: "#333333",
              opacity: 1,
              fontWeight: "bold",
              fontStyle: "normal",
              fontFamily: "sans-serif",
            },
          },
        };
      }
    }
    return item;
  };
  onBeforeMount(() => {
    transformNavMenu(element);
  });
  // 生命周期钩子
  onMounted(async () => {
    defaultActive.value = option.value.defaultActive;
    console.log("defaultActive", defaultActive.value);
    await nextTick();

    // 注册组件事件
    addEvent({
      [`${interactiveEnum.FormNavMenu}-${element.id}`]: { handleClick },
    });

    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.DataChange,
      events: element.events,

      throwValue: defaultActive.value,
    });
  });

  return {
    isShow,
    defaultActive,
    navmenu,
    menuRef,
    containerStyle,
    textStyle,
    iconImageStyle,
    childSuffixIcon,
    suffixStyle,
    childPrefixStyle,
    menuTextAlign,
    childrenMenuAlign,
    updateMenu,
    onSubMenu,
    onChildClick,
    handleOpen,
    handleCheck,
  };
}
