import { useActionEvent } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import { ExtendsEnum } from "@screenwright/types";
import { useEventListener } from "@vueuse/core";
import type { CSSProperties } from "vue";
import { computed, onMounted, ref } from "vue";

import { useActionTime } from "../useActionTime";

export const usePageReload = (options: ComponentType) => {
  const timer = ref<NodeJS.Timeout | null>(null);
  const autoUpdateInterval = ref<NodeJS.Timeout | null>(null);
  const timeOut = ref<NodeJS.Timeout | null>(null);
  const { isBuild, width, height, option } = useBaseData(options);
  const { actionTime, setActionTime } = useActionTime();
  const { addEvent } = useActionEvent();

  const contentStyle = computed((): CSSProperties => {
    return {
      pointerEvents: isBuild.value ? "none" : "auto",
      width: width.value + "px",
      height: height.value + "px",
      position: "relative",
    };
  });

  console.log(contentStyle.value, "contentStyle");

  const iconUrl = computed((): string => {
    return setMinioUrl(option.value.icon);
  });

  const iconStyle = computed((): CSSProperties => {
    return {
      width: option.value.iconWidth + "px",
      height: option.value.iconHeight + "px",
      opacity: option.value.opacity,
      position: "absolute",
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  });

  const handleReload = () => {
    if (autoUpdateInterval.value) {
      clearInterval(autoUpdateInterval.value);
      autoUpdateInterval.value = null;
    }

    window.location.reload();
  };

  const handleClick = () => {
    if (option.value.pageReloadType) {
      switch (option.value.pageReloadType) {
        case "click":
          if (
            option.value.pageReloadTypeClick == "0" ||
            option.value.pageReloadTypeClick === true
          ) {
            handleReload();
          }
          break;
      }
    }
  };

  const initComponent = () => {
    setActionTime();
    if (option.value.pageReloadType && !isBuild.value) {
      console.log("进入逻辑刷新");
      switch (option.value.pageReloadType) {
        case "keepTime":
          timeOut.value = setTimeout(() => {
            handleReload();
          }, option.value.pageReloadTypeKeepTime * 1000);
          break;
        case "setTime":
          timer.value = setInterval(() => {
            if (
              new Date().getHours() ===
                option.value.pageReloadTypeTimeOutHour &&
              new Date().getMinutes() ===
                option.value.pageReloadTypeTimeOutHourMinute &&
              new Date().getSeconds() === 0
            ) {
              if (timer.value) {
                clearInterval(timer.value);
                timer.value = null;
              }
              handleReload();
            }
          }, 500);
          break;
        case "autoUpdate":
          if (option.value.pageReloadTypeAutoTime) {
            autoUpdateInterval.value = setInterval(() => {
              if (
                new Date().getTime() - actionTime.value >=
                option.value.pageReloadTypeAutoTime * 1000
              ) {
                if (autoUpdateInterval.value) {
                  clearInterval(autoUpdateInterval.value);
                  autoUpdateInterval.value = null;
                }
                console.log(
                  autoUpdateInterval.value,
                  "autoUpdateInterval.value",
                );
                handleReload();
              }
            }, 100);
          }

          break;
      }
    }
  };

  onMounted(() => {
    addEvent({
      [`${ExtendsEnum.PageReload}-${options.id}`]: {
        handleClick: handleClick,
      },
    });

    // 监听全局鼠标移动事件，用于更新操作时间
    useEventListener(document, "mousemove", () => {
      setActionTime();
    });
  });

  return {
    contentStyle,
    iconUrl,
    iconStyle,
    timeOut,
    timer,
    autoUpdateInterval,
    handleClick,
    initComponent,
    handleReload,
  };
};
