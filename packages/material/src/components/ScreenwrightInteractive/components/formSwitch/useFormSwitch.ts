import { setMinioUrl } from "@material/minioUrl";
import { useBaseData } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { computed, ref, watch } from "vue";

export default function useFormSwitch(element: ComponentType) {
  const {
    option,
    isBuild,
    width,
    height,
    events,
    encodes,
    id,
    dataChart,
    styleSizeName,
    componentClasses,
    handleEncode,
    handleEventAndCallbackEvent,
  } = useBaseData(element);

  // 创建DOM引用
  const switchRef = ref<HTMLElement | null>(null);

  // 计算属性
  const containerStyle = computed(() => {
    return {
      padding: `${option.value.paddingTop || 0}px ${option.value.paddingLeft || 0}px`,
      backgroundSize: `${option.value.backgroudSize || "100% 100%"}`,
      backgroundImage: `url(${setMinioUrl(option.value.backgroudImage)})`,
    };
  });

  const textStyle = computed(() => {
    return {
      letterSpacing: `${option.value.letterSpacing || 0}px`,
      fontFamily: option.value.fontFamily,
      fontStyle: option.value.fontStyle,
      textShadow: option.value.isTextShadow
        ? `${option.value.textShadow.color} ${option.value.textShadow.x || 0}px ${option.value.textShadow.y || 0}px ${
            option.value.textShadow.blur
          }px`
        : "none",
    };
  });

  // 实际颜色计算属性，用于处理不同类型开关的样式
  const pointColorValue = computed(() => {
    if (option.value.type === "default") {
      return option.value.pointColor || "#2898ff";
    } else if (option.value.type === "icon") {
      return `url(${setMinioUrl(option.value.activeIcon)})`;
    } else if (option.value.type === "image") {
      return "transparent";
    }
    return option.value.pointColor || "#2898ff";
  });

  const pointColor2Value = computed(() => {
    if (option.value.type === "default") {
      return option.value.pointColor2 || "#3b445a";
    } else if (option.value.type === "icon") {
      return `url(${setMinioUrl(option.value.inactiveIcon)})`;
    } else if (option.value.type === "image") {
      return "transparent";
    }
    console.log(option.value.pointColor2, "option.value.pointColor2");
    return option.value.pointColor2 || "#3b445a";
  });

  const activeColorValue = computed(() => {
    if (option.value.type === "image") {
      return `url(${setMinioUrl(option.value.activeImage)})`;
    }
    return option.value.activeColor || "#0c0c13";
  });

  const inactiveColorValue = computed(() => {
    if (option.value.type === "image") {
      return `url(${setMinioUrl(option.value.inactiveImage)})`;
    }
    return option.value.inactiveColor || "#0c0c13";
  });

  const borderRadiusValue = computed(() => {
    return `${Math.floor(height.value * 0.5)}px`;
  });

  // 将pointSize和fontSize转换为字符串格式，处理undefined情况
  const pointSizeString = computed(() => {
    return option.value.pointSize !== undefined
      ? `${option.value.pointSize}px`
      : "50px";
  });

  const fontSizeString = computed(() => {
    return option.value.fontSize !== undefined
      ? `${option.value.fontSize}px`
      : "16px";
  });

  const fontWeightValue = computed(() => {
    return option.value.fontWeight;
  });

  const handleChange = (info: any) => {
    element.data = [info];
    handleEncode(info);
  };

  //监听数据变化
  watch(
    () => dataChart.value,
    (val: any) => {
      if (!val) {
        return;
      }
      let info;
      if (Array.isArray(val)) {
        info = val;
      } else {
        info = [val];
      }
      console.log("监听数据变化", info);
      handleEventAndCallbackEvent({
        id: element.id,
        triggerType: EventTypeEnum.DataChange,
        events: element.events,
        isExecuteOnlyConditionSatisfied: false,
        throwValue: info,
      });
      if (
        info?.[0] &&
        Object.prototype.hasOwnProperty.call(info[0], "disabled")
      ) {
        option.value.disabled = info[0].disabled;
      }
    },
    { deep: true },
  );

  return {
    switchRef,
    containerStyle,
    textStyle,
    dataChart,
    styleSizeName,
    width,
    option,
    events,
    encodes,
    id,
    isBuild,
    pointColorValue,
    pointColor2Value,
    activeColorValue,
    inactiveColorValue,
    borderRadiusValue,
    pointSizeString,
    fontSizeString,
    fontWeightValue,
    componentClasses,
    handleChange,
  };
}
