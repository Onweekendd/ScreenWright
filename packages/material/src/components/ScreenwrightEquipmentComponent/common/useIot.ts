import {
  deviceInvokeOperate,
  getInfoByDeviceId,
  integratedControlInvoke,
} from "@screenwright/composables";
import type {
  DeviceOperateAttributeName,
  DeviceOperateParamsWithCircuitIndex,
} from "@screenwright/types";
import type { ComponentType } from "@screenwright/types";
import { EquipmentEnum } from "@screenwright/types";
import { ElMessage } from "element-plus";
import { has } from "lodash-es";
import { computed } from "vue";

interface DeviceInfo {
  circuitName?: Array<{
    circuitIndex: number;
    switchName: string;
    switchValue: string;
  }>;
  switchName: string;
  switchValue: string;
}

type MessageParams = {
  pattern?: number;
  hwnd?: number;
  switchValue?: any;
  value?: number;
  circuitIndex?: number;
  selectedStatus?: number;
} & {
  [key in DeviceOperateAttributeName]?: any;
};

interface PollOptions {
  pollMethod: () => Promise<DeviceInfo>;
  isStatusChange: (deviceInfo: DeviceInfo) => boolean;
  onStatusChange: (deviceInfo: DeviceInfo) => void;
  isFinish: (deviceInfo: DeviceInfo) => boolean;
  onFinish: () => void;
  onError?: (error: Error) => void;
}

/**
 * 开始轮询设备状态
 */
const startPolling = ({
  pollMethod,
  isStatusChange,
  onStatusChange,
  isFinish,
  onFinish,
  onError,
}: PollOptions) => {
  let attempts = 0;
  const pollTime = 1000;
  const maxAttempts = 60;

  const poll = async () => {
    try {
      const deviceInfo = await pollMethod();
      if (isStatusChange(deviceInfo)) {
        onStatusChange(deviceInfo);
      }

      if (isFinish(deviceInfo)) {
        onFinish();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, pollTime);
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };

  setTimeout(poll, 0);
};

export const useIot = (options: ComponentType) => {
  const isGeneralComponent = computed(() => {
    return options.component.prop === EquipmentEnum.IotGeneralEquipment;
  });

  const baseUrl = computed(() => {
    const dataSource = options.dataSource;
    if (!dataSource) {
      return "";
    }

    if ("desIp" in dataSource) {
      const ip = dataSource.desIp;
      const port = dataSource.desPort;
      return `http://${ip}:${port}`;
    }
    return "";
  });

  const iotConfig = computed(() => options.iotConfig);

  const deviceId = computed(() => {
    if (!iotConfig.value) {
      return null;
    }

    if (!iotConfig.value.deviceId) {
      return null;
    }

    return isGeneralComponent.value
      ? iotConfig.value.deviceId
      : iotConfig.value.deviceId.split("-")[1];
  });

  const operateCode = computed(() => {
    if (!iotConfig.value) {
      return null;
    }

    if (iotConfig.value.operateCode === "LIST_WINDOWS") {
      return "SWITCH_WINDOWS";
    }

    return iotConfig.value.operateCode;
  });

  /**
   * 验证物联网配置
   */
  const validateIotConfig = () => {
    if (!iotConfig.value) {
      throw new Error("物联配置错误");
    }

    // 集成设备：只需要验证 integratedControlId
    if (iotConfig.value.deviceType === "integrated") {
      if (!iotConfig.value.integratedControlId) {
        throw new Error("集成设备配置错误：缺少 integratedControlId");
      }
      return;
    }

    // 普通设备：需要验证 deviceId 和 operateCode
    if (!deviceId.value || !operateCode.value) {
      throw new Error("物联配置错误");
    }
  };

  /**
   * 处理集成设备调用
   */
  const handleIntegratedDevice = () => {
    if (
      iotConfig.value?.deviceType === "integrated" &&
      iotConfig.value.integratedControlId
    ) {
      return integratedControlInvoke(
        Number(iotConfig.value.integratedControlId),
        baseUrl.value,
      );
    }
    return null;
  };

  /**
   * 构建请求参数
   */
  const buildRequestParams = (params: MessageParams) => {
    const requestParams: DeviceOperateParamsWithCircuitIndex = {
      deviceId: Number(deviceId.value!),
      operateCode: operateCode.value!,
      params: {} as any,
    };

    switch (operateCode.value) {
      case "SWITCH_WINDOWS":
        if (has(params, "hwnd")) {
          if (params.hwnd === "refreshWindows") {
            requestParams.operateCode = "LIST_WINDOWS";
            requestParams.params = { hwnd: params.hwnd };
          } else {
            requestParams.params = { hwnd: params.hwnd };
          }
        }
        break;

      case "BUTTON":
      case "SWITCH":
        if (has(params, "switchValue")) {
          requestParams.params = { switchValue: params.switchValue ? 1 : 0 };
        }
        break;

      case "VOLUME":
        if (has(params, "value")) {
          requestParams.params = {
            value: params.value,
            type: params.type ? params.type : "FIXED",
          };
        }
        break;

      default:
        requestParams.params = params || {};
    }

    if (params.circuitIndex) {
      requestParams.params = {
        ...requestParams.params,
        circuitIndex: params.circuitIndex,
      };
    }

    return requestParams;
  };

  /**
   * 创建轮询配置
   */
  const createPollingConfig = (
    circuitIndex?: number,
    initStatus?: "0" | "1",
    onStatusChange?: (status: string) => void,
    onSuccess?: () => void,
    onError?: (error: Error) => void,
  ): PollOptions => ({
    pollMethod: async () => {
      const {
        data: {
          result: { info: deviceInfo },
        },
      } = await getInfoByDeviceId(Number(deviceId.value!), baseUrl.value);
      return deviceInfo;
    },

    isStatusChange: (deviceInfo) => {
      if (deviceInfo.circuitName && circuitIndex) {
        const targetCircuitIndex = deviceInfo.circuitName.find(
          (circuit) => circuit.circuitIndex === circuitIndex,
        );
        if (!targetCircuitIndex) {
          return false;
        }
        return (
          targetCircuitIndex.switchValue === "10" ||
          targetCircuitIndex.switchValue === "11"
        );
      }
      return deviceInfo.switchValue === "10" || deviceInfo.switchValue === "11";
    },

    onStatusChange: (deviceInfo) => {
      if (deviceInfo.circuitName && circuitIndex) {
        const targetCircuitIndex = deviceInfo.circuitName.find(
          (circuit) => circuit.circuitIndex === circuitIndex,
        );
        if (!targetCircuitIndex) {
          return;
        }
        if (onStatusChange) {
          onStatusChange(targetCircuitIndex.switchName);
        }
      } else if (onStatusChange) {
        onStatusChange(deviceInfo.switchName);
      }
    },

    isFinish: (deviceInfo) => {
      if (deviceInfo.circuitName && circuitIndex) {
        const targetCircuitIndex = deviceInfo.circuitName.find(
          (circuit) => circuit.circuitIndex === circuitIndex,
        );
        if (!targetCircuitIndex) {
          return false;
        }
        return (
          (initStatus === "0" && targetCircuitIndex.switchValue === "1") ||
          (initStatus === "1" && targetCircuitIndex.switchValue === "0")
        );
      }
      return (
        (initStatus === "0" && deviceInfo.switchValue === "1") ||
        (initStatus === "1" && deviceInfo.switchValue === "0")
      );
    },

    onFinish: () => {
      if (onSuccess) {
        onSuccess();
      }
    },

    onError: (error) => {
      if (onError) {
        onError(error);
      }
    },
  });

  /**
   * 发送设备请求
   */
  const sendDeviceRequest = async (
    requestParams: DeviceOperateParamsWithCircuitIndex,
    pollingConfig?: PollOptions,
  ) => {
    const response = await deviceInvokeOperate(requestParams, baseUrl.value);

    if (response.data && response.data.code === 200) {
      if (operateCode.value === "SWITCH" && pollingConfig) {
        startPolling(pollingConfig);
      }
      return response.data;
    } else {
      ElMessage.error(response.data?.message || "设备请求失败");
    }

    throw new Error("API invocation failed");
  };

  /**
   * 发送物联网消息到设备并轮询设备状态
   */
  const sendIotMessage = ({
    params = {
      pattern: undefined,
      hwnd: undefined,
      switchValue: undefined,
      value: undefined,
      circuitIndex: undefined,
    },
    initStatus,
    circuitIndex,
    onStatusChange,
    onSuccess,
    onError,
  }: {
    params: MessageParams;
    initStatus?: "0" | "1";
    circuitIndex?: number;
    onStatusChange?: (status: string) => void;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }) => {
    try {
      // 1. 验证配置
      validateIotConfig();

      // 2. 处理集成设备
      const integratedResult = handleIntegratedDevice();
      if (integratedResult) {
        return integratedResult;
      }

      // 3. 构建请求参数
      const requestParams = buildRequestParams(params);

      // 4. 创建轮询配置（如果需要）
      const pollingConfig =
        operateCode.value === "SWITCH"
          ? createPollingConfig(
              circuitIndex,
              initStatus,
              onStatusChange,
              onSuccess,
              onError,
            )
          : undefined;

      // 5. 发送设备请求
      return sendDeviceRequest(requestParams, pollingConfig).catch((error) => {
        if (onError) {
          onError(error);
        }
        throw error;
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(err);
      }
      return Promise.reject(err);
    }
  };

  return {
    baseUrl,
    deviceId,
    iotConfig,
    sendIotMessage,
  };
};
