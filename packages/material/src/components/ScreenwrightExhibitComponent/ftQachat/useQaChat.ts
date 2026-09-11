import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

export const useQaChat = (options: ComponentType) => {
  const {
    isBuild,
    isView,
    dataChart,
    componentClasses,
    option,
    handleEventAndCallbackEvent,
    handleEvents,
    handleEncode,
    getAnimationType,
  } = useBaseData(options);
  const eventStatus = ref(false);
  const encodeStatus = ref(false);
  const showAIChatBox = ref(false);

  const aiChatStyle = computed<CSSProperties>(() => {
    const {
      boxWidth,
      boxHeight,
      boxX,
      boxY,
      borderRadius,
      backgroundType,
      backgroundColor,
      backgroundImage,
    } = option.value;
    return {
      width: `${boxWidth || 500}px`,
      height: `${boxHeight || 800}px`,
      transform: `translate(${boxX || 0}px, ${boxY || 0}px)`,
      borderRadius: `${borderRadius || 0}px`,
      pointerEvents: `${isBuild.value ? "none" : "visible"}`,
      backgroundColor:
        backgroundType === "color" ? backgroundColor : "transparent",
      backgroundImage:
        backgroundType === "custom"
          ? `url(${setMinioUrl(backgroundImage)})`
          : "none",
      backgroundSize: "100% 100%",
    };
  });
  const aiTextStyle = computed<CSSProperties>(() => {
    return {
      fontFamily: `${option.value.fontFamily || "sans-serif"}`,
      fontSize: `${option.value.fontSize || 13}px`,
      color: `${option.value.fontColor || "rgba(191, 191, 191, 1)"}`,
    };
  });
  const aiCloseStyle = computed<CSSProperties>(() => {
    const { boxX, boxY } = option.value;
    return {
      transform: `translate(${boxX || 0}px, ${boxY || 0}px)`,
    };
  });
  const mutualStyle = computed<CSSProperties>(() => {
    return {
      cursor: option.value.isCursorPointer ? "pointer" : "default",
    };
  });

  return {
    eventStatus,
    encodeStatus,
    showAIChatBox,
    aiChatStyle,
    aiTextStyle,
    mutualStyle,
    aiCloseStyle,
    isBuild,
    isView,
    dataChart,
    option,
    componentClasses,
    getAnimationType,
    handleEventAndCallbackEvent,
    handleEvents,
    handleEncode,
  };
};
