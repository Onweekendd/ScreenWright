import { deviceGetById, getInfoByDeviceId } from "@screenwright/composables";
import { useBaseData } from "@screenwright/composables";
import { setMinioUrl } from "@screenwright/composables";
import type { ComponentType } from "@screenwright/types";
import type { CSSProperties } from "vue";
import { computed, ref } from "vue";

import { useIot } from "../common/useIot";

export const useIotFormSwitch = (options: ComponentType) => {
  const iotDisabled = ref<boolean>(false);
  const device = ref<any>(null);
  const statusText = ref<string>("关闭");

  const {
    width,
    height,
    styleSizeName,
    componentClasses,
    dataChart,
    option,
    handleEventAndCallbackEvent,
    handleEncode,
  } = useBaseData(options);
  const { deviceId, baseUrl, iotConfig, sendIotMessage } = useIot(options);

  const containerStyle = computed<CSSProperties>(() => {
    return {
      padding: `${option.value.paddingTop || 0}px ${option.value.paddingLeft || 0}px`,
      backgroundSize: `${option.value.backgroudSize || "100% 100%"}`,
      backgroundImage: `url(${setMinioUrl(option.value.backgroudImage)})`,
    };
  });

  const textStyle = computed<CSSProperties>(() => {
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

  const fontWeightValue = computed(() => {
    return option.value.fontWeight;
  });

  const handleIotMessageEnd = (info: any) => {
    if (!iotConfig.value) {
      return;
    }

    const { value } = info;

    const { circuitIndex } = iotConfig.value;

    if (circuitIndex) {
      const targetCircuitIndex = device.value.info.circuitName.find(
        (circuit: any) => circuit.circuitIndex === circuitIndex,
      );

      if (!targetCircuitIndex) {
        return;
      }

      const { switchValue } = targetCircuitIndex;

      sendIotMessage({
        params: {
          switchValue: value ? 1 : 0,
          circuitIndex: Number(circuitIndex),
        },
        initStatus: switchValue,
        circuitIndex: Number(circuitIndex),
        onStatusChange: (status) => {
          statusText.value = status ? "打开" : "关闭";
        },
        onSuccess: () => {
          statusText.value = "打开";
          // options.data[0].value = !options.data[0].value;
        },
        onError: () => {
          statusText.value = "关闭";
        },
      })?.then((res) => {
        console.log(res);
      });
    } else {
      const { switchValue } = device.value.info;

      sendIotMessage({
        params: { switchValue: value ? 1 : 0 },
        initStatus: switchValue,
        onStatusChange: (status) => {
          statusText.value = status ? "打开" : "关闭";
        },
        onSuccess: () => {
          statusText.value = "打开";
          // options.data[0].value = !options.data[0].value;
        },
        onError: () => {
          statusText.value = "关闭";
        },
      })?.then((res) => {
        console.log(res);
      });
    }
  };

  const asyncDeviceStatus = async () => {
    if (!iotConfig.value) {
      return;
    }

    if (!deviceId.value || !baseUrl.value) {
      iotDisabled.value = true;
      return;
    }

    const {
      data: {
        result: { info: deviceInfo },
      },
    } = await getInfoByDeviceId(Number(deviceId.value), baseUrl.value);
    const { circuitIndex } = iotConfig.value;
    handleDeviceInfo(deviceInfo, circuitIndex || 0);
    const {
      data: { result: deviceRecord },
    } = await deviceGetById(Number(deviceId.value), baseUrl.value);
    device.value = deviceRecord;
  };
  const handleDeviceInfo = (deviceInfo: any, circuitIndex: number | string) => {
    if (dataChart.value.length === 0) {
      return;
    }

    if (deviceInfo.circuitName) {
      const targetCircuitIndex = deviceInfo.circuitName.find(
        (circuit: any) => circuit.circuitIndex === circuitIndex,
      );
      if (!targetCircuitIndex) {
        return;
      }
      const { switchValue, _switchName } = targetCircuitIndex;
      switch (String(switchValue)) {
        case "1":
          options.data = [{ label: "开关", value: true }];
          statusText.value = "打开";
          break;
        case "0":
          options.data = [{ label: "开关", value: false }];
          statusText.value = "关闭";
          break;
      }
    } else {
      switch (String(deviceInfo.switchValue)) {
        case "1":
          options.data = [{ label: "开关", value: true }];
          statusText.value = "打开";
          break;
        case "0":
          options.data = [{ label: "开关", value: false }];
          statusText.value = "关闭";
          break;
      }
    }
  };
  return {
    width,
    iotDisabled,
    containerStyle,
    textStyle,
    styleSizeName,
    componentClasses,
    dataChart,
    option,
    inactiveColorValue,
    activeColorValue,
    pointColorValue,
    pointColor2Value,
    borderRadiusValue,
    fontWeightValue,
    asyncDeviceStatus,
    handleIotMessageEnd,
    handleEventAndCallbackEvent,
    handleEncode,
  };
};
