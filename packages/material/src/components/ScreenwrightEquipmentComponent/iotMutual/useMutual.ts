import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import { useIot } from "../common/useIot";

export interface touchStyleType {
  hoverFontColor: string;
  hoverFontSize: number;
  hoverFontFamily: string;
  hoverBgImage: string;
}

export const useMutual = (options: ComponentType) => {
  const {
    option,
    dataChart,
    componentClasses,
    handleEventAndCallbackEvent,
    handleEncode,
    getAnimationType,
  } = useBaseData(options);
  const { baseUrl, iotConfig, sendIotMessage } = useIot(options);
  const touchStyle = ref<touchStyleType | null>(null);
  const touchTimer = ref<NodeJS.Timeout | null>(null);
  const eventStatus = ref<boolean>(false);
  const encodeStatus = ref<boolean>(false);

  const mutualStyle = computed<CSSProperties>(() => {
    return {
      cursor: option.value.isCursorPointer ? "pointer" : "default",
    };
  });

  const styleFont = computed<CSSProperties>(() => {
    return {
      color: touchStyle.value
        ? touchStyle.value.hoverFontColor
        : option.value.fontColor,
      fontSize: `${(touchStyle.value ? touchStyle.value.hoverFontSize : option.value.fontSize) || 0}px`,
      fontFamily: touchStyle.value
        ? touchStyle.value.hoverFontFamily
        : option.value.fontFamily,
      backgroundImage: `url(${setMinioUrl(option.value.bgImage)})`,
    };
  });

  const styleTransform = computed<CSSProperties>(() => {
    return {
      transform: `rotateX(${option.value.rotateX || 0}deg)
                    rotateY(${option.value.rotateY || 0}deg)
                    rotateZ(${option.value.rotateZ || 0}deg)
                    skewX(${option.value.skewX || 0}deg)
                    skewY(${option.value.skewY || 0}deg)`,
    };
  });

  const styleHoverFont = computed<any>(() => {
    return option.value.isHovered
      ? {
          color: option.value.hoverFontColor,
          fontSize: `${option.value.hoverFontSize || 24}px`,
          fontFamily: option.value.hoverFontFamily,
          background: `url(${setMinioUrl(option.value.hoverBgImage)})`,
        }
      : {};
  });

  const setClickBubble = () => {
    if (option.value.isClickBubble) {
      const { hoverFontColor, hoverFontSize, hoverFontFamily, hoverBgImage } =
        option.value;
      touchStyle.value = {
        hoverFontColor,
        hoverFontSize,
        hoverFontFamily,
        hoverBgImage,
      };
      touchTimer.value = setTimeout(() => {
        touchStyle.value = null;
        clearTimeout(touchTimer.value as NodeJS.Timeout);
      }, 1000);
    }
  };

  const getLabel = (obj: any) => {
    return obj && obj.label ? obj.label : "";
  };

  const handleIotMessageEnd = () => {
    if (!iotConfig.value) {
      return;
    }

    const { circuitIndex, selectedStatus } = iotConfig.value;

    const param = {
      params: {
        switchValue: 0,
        circuitIndex: 0,
      },
    };

    if (selectedStatus !== undefined) {
      param.params.switchValue = selectedStatus;
    }

    if (circuitIndex) {
      param.params.circuitIndex = Number(circuitIndex);
    }

    sendIotMessage(param).then((res) => {
      console.log(res);
    });
  };

  return {
    option,
    dataChart,
    componentClasses,
    mutualStyle,
    styleFont,
    styleTransform,
    styleHoverFont,
    touchStyle,
    touchTimer,
    eventStatus,
    encodeStatus,
    baseUrl,
    iotConfig,
    getLabel,
    setClickBubble,
    handleIotMessageEnd,
    handleEventAndCallbackEvent,
    handleEncode,
    getAnimationType,
  };
};
