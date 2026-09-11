import { getInfoByDeviceId } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import {
  getPartialGradientCSS,
  lineargradientHandle,
} from "@screenwright/core";
import type { ComponentType } from "@screenwright/types";
import { EventTypeEnum } from "@screenwright/types";
import { computed, onMounted, ref } from "vue";

import { useIot } from "../common/useIot";

interface SliderItem {
  label: string;
  value: number;
}

export default function useFormSlider(element: ComponentType) {
  const slider = ref<HTMLElement | null>(null);
  const iotDisabled = ref<boolean>(false);
  const {
    dataChart,
    option,
    styleSizeName,
    events,
    encodes,
    isBuild,
    componentClasses,
    handleEventAndCallbackEvent,
    handleEncode,
  } = useBaseData(element);

  const { deviceId, baseUrl, iotConfig, sendIotMessage } = useIot(element);

  // 滑块容器样式
  const containerStyle = computed(() => {
    let pl = 0;
    if (!option.value.showLabel) {
      pl = option.value.pointSize;
    }
    let pr = 0;
    if (!option.value.showValue) {
      pr = option.value.pointSize;
    }
    return {
      marginTop: `${option.value.paddingTop || 0}px`,
      marginBottom: `${option.value.paddingBottom || 0}px`,
      paddingLeft: `${(option.value.paddingLeft || 0) + pl}px`,
      paddingRight: `${(option.value.paddingLeft || 0) + pr}px`,
      backgroundSize: `${option.value.backgroudSize || "100% 100%"}`,
      backgroundImage: option.value.backgroudImage
        ? `url(${setMinioUrl(option.value.backgroudImage)})`
        : "none",
    };
  });

  // 文本样式
  const textStyle = computed(() => {
    return {
      color: option.value.fontColor,
      fontSize: `${option.value.fontSize || 12}px`,
      letterSpacing: `${option.value.letterSpacing || 0}px`,
      fontWeight: option.value.fontWeight,
      fontFamily: option.value.fontFamily,
      fontStyle: option.value.fontStyle,
      textShadow: option.value.isTextShadow
        ? `${option.value.textShadow.color} ${option.value.textShadow.x || 0}px ${option.value.textShadow.y || 0}px ${
            option.value.textShadow.blur
          }px`
        : "none",
      transform: `translate(${option.value.textTranslateX || 0}px, ${option.value.textTranslateY || 0}px)`,
      padding: `${option.value.fontPaddingTop || 0}px ${option.value.fontPaddingLeft || 0}px`,
    };
  });

  // 滑块样式 - 处理垂直滑块的高度
  const sliderStyle = computed(() => {
    if (option.value.vertical) {
      return {
        height: "100%",
        flex: "1",
      };
    }
    return {};
  });

  // 将CSS变量转换为计算属性
  const defaultColorValue = computed(
    () => option.value.defaultColor || "#3f485e",
  );
  const activeColorValue = computed(() => {
    // option.value.seriesBgColor || "#24afff"
    if (!dataChart.value[0]) {
      return "#24afff";
    }
    let bgColor;
    if (
      option.value.seriesBgColor &&
      option.value.highlightArea === "percent"
    ) {
      // 占比 取整
      const percentage = Math.floor(
        (dataChart.value[0].value / option.value.max) * 100,
      );
      const lineargradientColor = lineargradientHandle(
        option.value.seriesBgColor,
        option.value.seriesOpacity,
      );
      if (lineargradientColor) {
        // 如果是线性渐变色，获取指定百分比处的颜色
        bgColor = getPartialGradientCSS(
          lineargradientColor as string,
          percentage,
        );
      } else {
        // 如果不是线性渐变色，直接使用默认颜色
        bgColor = option.value.seriesBgColor;
      }
    } else if (option.value.seriesBgColor) {
      bgColor = lineargradientHandle(
        option.value.seriesBgColor,
        option.value.seriesOpacity,
      );
    }
    return bgColor;
  });

  const pointColorValue = computed(() => {
    if (option.value.placardImg && option.value.pointType === "image") {
      const images = option.value.placardImg;
      return `url(${setMinioUrl(images)})`;
    }
    return option.value.pointColor || "#ffffff";
  });
  const pointSizeValue = computed(() => `${option.value.pointSize || 20}px`);
  const pointX = computed(
    () => `${-option.value.pointSize / 2 + option.value.size / 2}px`,
  );
  const barSizeValue = computed(() => `${option.value.size || 10}px`);
  const borderRadius = computed(() => `${option.value.borderRadius || 3}px`);
  const borderColor = computed(() => {
    if (option.value.placardImg && option.value.pointType === "image") {
      return "transparent";
    }
    return `${option.value.pointBorderColor || "#24afff"}`;
  });
  const borderImage = computed(() => {
    const images = option.value.placardImg;
    return setMinioUrl(images);
  });
  // 处理输入事件
  const handleInput = (info: SliderItem) => {
    handleEncode(info);
    if (option.value.changeType !== "2") {
      return;
    }
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.DataChange,
      events: element.events,

      throwValue: info,
    });
  };

  // 处理更改事件
  const handleChange = (info: SliderItem) => {
    element.data = [info];
    handleEncode(info);
    if (option.value.changeType !== "1") {
      return;
    }
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.DataChange,
      events: element.events,

      throwValue: info,
    });
    handleIotMessageEnd(info);
  };

  const asyncDeviceStatus = async () => {
    if (!deviceId.value || !baseUrl.value) {
      iotDisabled.value = true;
      return;
    }

    const {
      data: {
        result: { info: deviceInfo },
      },
    } = await getInfoByDeviceId(Number(deviceId.value), baseUrl.value);

    if (!deviceInfo.volume) {
      element.data = [
        {
          value: 0,
          label: element.data[0].label,
        },
      ];
      return;
    }
    element.data = [
      {
        value: deviceInfo.volume,
        label: element.data[0].label,
      },
    ];
    iotDisabled.value = false;
  };

  const handleIotMessageEnd = async (info: any) => {
    if (!iotConfig.value) {
      return;
    }

    const { value } = info;

    try {
      await sendIotMessage({
        params: { value },
      });
    } catch (error) {
      console.log(error);
    }
  };

  // 组件挂载后设置滑块属性
  onMounted(() => {
    console.log(iotConfig.value, "fff");
    handleEventAndCallbackEvent({
      id: element.id,
      triggerType: EventTypeEnum.DataChange,
      events: element.events,

      throwValue: dataChart.value.length > 0 ? dataChart.value[0] : {},
    });
  });

  return {
    slider,
    dataChart,
    option,
    styleSizeName,
    containerStyle,
    textStyle,
    events,
    encodes,
    isBuild,
    defaultColorValue,
    activeColorValue,
    pointColorValue,
    pointSizeValue,
    barSizeValue,
    borderRadius,
    borderColor,
    componentClasses,
    borderImage,
    iotDisabled,
    pointX,
    handleInput,
    handleChange,
    handleEncode,
    asyncDeviceStatus,
    sliderStyle,
  };
}
