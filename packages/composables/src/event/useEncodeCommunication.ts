import { extractComponentId } from "@screenwright/core";
import { type Action, EncodeEventTypeEnum, interactiveEnum } from "@screenwright/types";
import { createGlobalState } from "@vueuse/core";
import { ElMessage } from "element-plus";
import { isNil } from "lodash-es";
import { computed, ref } from "vue";

import { FilterResultCollector } from "../FilterResultCollector";
import { getSendUE4Message } from "../ports/eventPort";
import { useActionEvent } from "../useActionEvent";
import { useGlobalAnimation } from "../useGlobalAnimation";
import { useGlobalComponentData } from "../useGlobalComponentData";
import { useLargeScreenInfo } from "../useLargeScreenInfo";
import { Websocketconfig as WebSocketConfig } from "../utils/websocket";
import type { MessageToSend } from "./useEncodeEvent";
import { useEventHandling } from "./useEventHandling";
import { useIframeWebSocket } from "./useIframeWebSocket";

interface DataChartItem {
  value: any;
  name?: string;
  label?: string;
}

export interface EncodedControlItem {
  id: string;
  code: string;
  value: any;
}

/**
 * @description 终端通信
 */
const useEncodeCommunication = createGlobalState(() => {
  const { globalComponentMap } = useGlobalComponentData();
  const { navInfo } = useLargeScreenInfo();
  const terminalCommunicationWs = ref<WebSocketConfig | null>(null);
  const screenCommunicationWs = ref<WebSocketConfig | null>(null);
  const filterResultCollector = FilterResultCollector.getInstance();
  const { eventList } = useActionEvent();
  const { triggerRegistry } = useGlobalAnimation();
  const { handleActions: handleEventActions } = useEventHandling();

  const controlWebsocketUrl = computed(() => {
    if (window.webconfig && window.webconfig.controlWebsocketUrl) {
      return window.webconfig.controlWebsocketUrl;
    }

    return navInfo.value.detail.controlWebsocketUrl;
  });

  // 使用 iframe WebSocket 管理 hook
  const { initIframeWs: initIframeWebSocket, closeIframeWs, getIframeWs } = useIframeWebSocket();

  /**
   * @description 控制编码值的计算属性
   * 从 navInfo.value.encodedControl 读取数据，并支持反向修改
   */
  const encodedControlValues = computed<EncodedControlItem[]>({
    get: () => {
      const { isEncodedControl } = navInfo.value.detail;
      const encodedControlList = navInfo.value.encodedControl;

      if (!isEncodedControl || !encodedControlList || !Array.isArray(encodedControlList)) {
        return [];
      }

      return encodedControlList.map((item: string) => {
        const [id, code, value] = item.split("-");
        return { id, code, value };
      });
    },
    set: (newValues: EncodedControlItem[]) => {
      // 将 EncodedControlItem[] 转换回 string[] 格式
      const encodedControlStrings = newValues.map((item) => `${item.id}-${item.code}-${item.value}`);

      // 反向更新到 navInfo.value.encodedControl
      navInfo.value.encodedControl = encodedControlStrings;
    }
  });

  /**
   * @description 初始化终端通信
   */
  const initTerminalCommunication = () => {
    // 终端面板的ws连接
    const { isEncodedControl, heartbeatInterval } = navInfo.value.detail;
    if (!isEncodedControl || !controlWebsocketUrl.value) {
      console.error("终端通信配置错误");
      return;
    }

    terminalCommunicationWs.value = createNewTerminalCommunicationWs({
      controlWebsocketUrl: controlWebsocketUrl.value,
      heartbeatInterval
    });
  };

  /**
   * 创建一个新的终端通信对象
   * @param {{ controlWebsocketUrl, heartbeatInterval }} options
   * @param {string} options.controlWebsocketUrl 终端通信的ws连接地址
   * @param {number} options.heartbeatInterval 心跳检查时间间隔，单位为毫秒
   * @returns {WebSocketConfig} 新创建的终端通信对象
   */
  const createNewTerminalCommunicationWs = ({
    controlWebsocketUrl,
    heartbeatInterval
  }: {
    controlWebsocketUrl: string;
    heartbeatInterval: number;
  }) => {
    const newTerminalCommunicationWs = new WebSocketConfig({
      src: controlWebsocketUrl.replace("/bi/", "/thirdParty/"),
      longConnect: true, // 设置为长连接以支持自动重连
      enableHeartbeat: true,
      heartbeatInterval: heartbeatInterval * 1000, // 转换为毫秒
      heartbeatMessage: { type: "heartbeat", timestamp: Date.now() }, // 自定义心跳消息格式
      responseTimeout: heartbeatInterval * 1000 * 2
    });

    newTerminalCommunicationWs.localSocket(onTerminalReceiveMessage);

    return newTerminalCommunicationWs;
  };

  /**
   * @description 终端通信消息接收
   * @param data 消息数据
   */
  const onTerminalReceiveMessage = (data: any) => {
    console.log(data);
  };

  /**
   * @description 初始化大屏通信
   */
  const initScreenCommunication = () => {
    // 大屏的ws连接
    const { isEncodedControl, heartbeatInterval } = navInfo.value.detail;
    if (!isEncodedControl || !controlWebsocketUrl.value) {
      console.warn("大屏通信配置错误");
      return;
    }

    screenCommunicationWs.value = new WebSocketConfig({
      src: controlWebsocketUrl.value,
      longConnect: true, // 设置为长连接以支持自动重连
      enableHeartbeat: true,
      heartbeatInterval: heartbeatInterval * 1000, // 转换为毫秒
      heartbeatMessage: { type: "heartbeat", timestamp: Date.now() }, // 自定义心跳消息格式
      responseTimeout: heartbeatInterval * 1000 * 2
    });

    screenCommunicationWs.value.localSocket(receiveEncodedControl);
  };

  /**
   * @description 清理资源（组件卸载时调用）
   */
  const cleanup = (): void => {
    // 关闭 WebSocket 连接（会自动停止心跳和响应检测）
    terminalCommunicationWs.value?.onclose();
    screenCommunicationWs.value?.onclose();

    // 清空实例
    terminalCommunicationWs.value = null;
    screenCommunicationWs.value = null;

    console.log("[cleanup] 所有资源已清理");
  };

  /**
   * @description 处理UE4消息
   * @param code 消息名称
   * @param data 消息数据
   */
  const handleUE4Message = (code?: string, data?: string | object | any[]) => {
    const allComponentList = Array.from(globalComponentMap.value.values());
    const ueComponent = allComponentList.find((item) => item.title.includes("UE"));
    if (!ueComponent) {
      return;
    }

    const ue4Config = {
      messageName: code || "websocketCallUE",
      messageContent: data as string,
      messageType: "string",
      messageJson: "{}"
    };

    getSendUE4Message()({
      componentIds: [ueComponent.id],
      isConditionSatisfied: true,
      eventList: eventList.value,
      globalComponentMap: globalComponentMap.value,
      componentRootDoms: document.querySelectorAll(`.${ueComponent.id}`),
      ue4Config,
      info: null,
      sourceComponentId: ueComponent.id,
      globalAnimationTriggers: triggerRegistry
    });
  };

  /**
   * @description 处理动作列表
   * @param actions 动作数组
   */
  const handleActions = async (actions: MessageToSend[]) => {
    actions.map(async ({ trigger, id, encodeKey, throwValue }) => {
      const component = globalComponentMap.value.get(`${extractComponentId(id)}`);
      if (!component) {
        return;
      }

      const filterDataRes = filterResultCollector.getResults(component);

      if (!filterDataRes) {
        return;
      }

      const interInfo: DataChartItem | undefined = filterDataRes[filterDataRes?.length - 1].outputData?.find(
        (a: DataChartItem) => a.value == encodeKey
      );
      const componentProp = component.component.prop;

      if (trigger === EncodeEventTypeEnum.VideoControls) {
        const videoControlsInfo = throwValue as {
          label: Action["action"];
          value: any;
        };

        handleEventActions({
          actions: [
            {
              id: `encodeToVideoAction-${Date.now()}`,
              action: videoControlsInfo.label,
              component: [component.id]
            } as unknown as Action
          ],
          isConditionSatisfied: true,
          info: throwValue,
          id
        });

        // 视频控件特有 TODO: 添加事件
        //   interRef.setVideoEvent?.(info?.label || "", info?.value)
        return;
      }

      if (encodeKey && componentProp === interactiveEnum.SwPageTurning) {
        // 翻页
        // interRef.handleClick?.(encodeKey)
      } else if (encodeKey && componentProp === interactiveEnum.SwPageQuery) {
        // 分页
        //   interRef.handleBeforOrAfterClick?.(encodeKey, null)
      } else if (componentProp === interactiveEnum.SwVoiceControl && (component as any).upodateVoiceState) {
        // 语音控制
        // interRef.upodateVoiceState(encodeKey || "")
      } else {
        /**
         * @description 获取组件事件
         */
        const event = (eventList.value as any)[`${componentProp}-${id}`] as Record<string, (...args: any[]) => any>;
        if (event && event.handleClick) {
          event.handleClick(interInfo || throwValue);
        }
      }
    });
  };

  /**
   * @description 处理控制编码
   * @param code 控制编码
   */
  const handleControlCode = async (code: string) => {
    // 预分割+格式校验 code: aaa-10或者168-10
    const codeParts = code.split("-");
    if (codeParts.length < 2) {
      return;
    }
    const [targetCode, targetValue] = codeParts;
    // 组件ID-编码-数值: 168-aaa-10 id,code,value
    const transFormEncodedControl = encodedControlValues.value.map((v) => {
      if (v.code === targetCode || v.id === targetCode) {
        return {
          ...v,
          code: targetCode + "-" + targetValue,
          value: targetValue
        };
      }
      return v;
    });

    const targetEncode = transFormEncodedControl.find((item) => item.code === code);
    if (!targetEncode) {
      return;
    }

    const component = globalComponentMap.value.get(`${extractComponentId(targetEncode.id)}`);
    if (!component) {
      return;
    }

    const filterDataRes = filterResultCollector.getResults(component);
    if (!filterDataRes) {
      return;
    }

    const interInfo: DataChartItem | undefined = filterDataRes[filterDataRes?.length - 1].outputData?.find(
      (a: DataChartItem) => a.value == targetEncode.value
    );
    const componentProp = component.component.prop;

    // 处理特殊组件类型
    if (componentProp === interactiveEnum.SwPageTurning) {
      // 翻页组件
      // TODO: 实现翻页逻辑
      // interRef.handleClick?.(targetEncode.value)
    } else if (componentProp === interactiveEnum.SwPageQuery) {
      // 分页组件
      // TODO: 实现分页逻辑
      // interRef.handleBeforOrAfterClick?.(targetEncode.value, null)
    } else if (componentProp === interactiveEnum.SwVoiceControl) {
      // 语音控制组件
      // TODO: 实现语音控制逻辑
      // component.upodateVoiceState?.(targetEncode.value)
    } else {
      /**
       * @description 获取组件事件并执行点击事件
       */
      const event = (eventList.value as any)[`${componentProp}-${targetEncode.id}`] as Record<
        string,
        (...args: any[]) => any
      >;
      if (event && event.handleClick) {
        event.handleClick(interInfo);
      }
    }
  };

  /**
   * @description 控制编码-消息接收-处理
   * @param info 编码控制信息
   * @param info.type 类型，bi或ue（默认bi）
   * @param info.code 编码，对应图层的控制编码
   * @param info.data 数据，消息数据
   * @param info.actions 终端交互特有
   */
  const receiveEncodedControl = async (info: {
    type?: "bi" | "ue";
    code?: string;
    data?: string | object | any[];
    actions?: MessageToSend[];
  }): Promise<void> => {
    const { type, actions, code, data } = info;

    // 处理UE4消息
    if (type === "ue") {
      handleUE4Message(code, data);
      return;
    }

    // 处理动作列表
    if (actions && actions.length) {
      handleActions(actions);
      return;
    }

    // 处理控制编码
    if (code) {
      await handleControlCode(code);
    }
    if ("body" in info && typeof info.body === "string") {
      const wsData = JSON.parse(info.body);
      const { type, code } = wsData;
      if (!isNil(code) && !isNil(type) && type === "bi") {
        await handleControlCode(code);
      }
    }
  };

  /**
   * @description 初始化iframe通信
   * @param {Object} options - 初始化的参数
   * @param {string} options.iframeScreenId - iframe 所引用的大屏 ID
   * @param {string} options.controlWebsocketUrl - 终端通信的ws连接地址
   * @param {number} options.heartbeatInterval - 心跳检查时间间隔，单位为毫秒
   * @returns {WebSocketConfig} 新创建的iframe通信对象
   */
  const initIframeWs = ({
    iframeScreenId,
    controlWebsocketUrl,
    heartbeatInterval
  }: {
    iframeScreenId: string;
    controlWebsocketUrl: string;
    heartbeatInterval: number;
  }) => {
    return initIframeWebSocket({
      iframeScreenId,
      controlWebsocketUrl,
      heartbeatInterval,
      onMessage: onTerminalReceiveMessage
    });
  };

  /**
   * @description 通过 WebSocket 将控制编码发送到对应的终端
   * @param {{ largeId?: string; actions: MessageToSend[] }} options - 传递的参数
   * @param {string} options.largeId - iframe 的id
   * @param {MessageToSend[]} options.actions - 需要发送的控制编码
   */
  const sendTerminalMessage = ({ largeId, actions }: { largeId?: string; actions: MessageToSend[] }) => {
    const toSendMessageWs = largeId ? getIframeWs(largeId) : terminalCommunicationWs.value;
    if (!toSendMessageWs) {
      ElMessage.error("WebSocket 连接失败");
      return;
    }

    toSendMessageWs.sendMsg({ actions });
  };

  /**
   * 关闭对应的WebSocket连接
   * @param {string} largeId - 画布id
   */
  const closeTerminalWs = (largeId: string) => {
    closeIframeWs(largeId);
  };

  return {
    terminalCommunicationWs,
    screenCommunicationWs,
    encodedControlValues,
    getIframeWs,
    initIframeWs,
    initTerminalCommunication,
    sendTerminalMessage,
    initScreenCommunication,
    createNewTerminalCommunicationWs,
    closeTerminalWs,
    handleActions,
    cleanup
  };
});

export { useEncodeCommunication };
