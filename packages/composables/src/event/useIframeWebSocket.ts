import { createGlobalState } from "@vueuse/core";

import { Websocketconfig as WebSocketConfig } from "../utils/websocket";

/**
 * @description iframe WebSocket 管理 Hook
 * 用于管理 iframe 引用的终端交互 WebSocket 连接
 */
export const useIframeWebSocket = createGlobalState(() => {
  /**
   * @description 存储用于 iframe 引用的终端交互的 ws
   */
  const iframeWsMap: Map<string, WebSocketConfig> = new Map();

  /**
   * 默认的终端消息接收处理器
   * @param data 消息数据
   */
  const defaultMessageHandler = (data: any) => {
    console.log("[iframe ws] received:", data);
  };

  /**
   * 创建一个新的 WebSocket 连接
   * @param options 配置选项
   * @param options.controlWebsocketUrl 终端通信的 ws 连接地址
   * @param options.heartbeatInterval 心跳检查时间间隔，单位为毫秒
   * @param options.onMessage 自定义消息处理器，不传则使用默认处理器
   * @returns 新创建的 WebSocket 连接对象
   */
  const createWebSocketConnection = ({
    controlWebsocketUrl,
    heartbeatInterval,
    onMessage
  }: {
    controlWebsocketUrl: string;
    heartbeatInterval: number;
    onMessage?: (data: any) => void;
  }): WebSocketConfig => {
    const ws = new WebSocketConfig({
      src: controlWebsocketUrl.replace("/bi/", "/thirdParty/"),
      longConnect: true, // 设置为长连接以支持自动重连
      enableHeartbeat: true,
      heartbeatInterval: heartbeatInterval * 1000, // 转换为毫秒
      heartbeatMessage: { type: "heartbeat", timestamp: Date.now() }, // 自定义心跳消息格式
      responseTimeout: heartbeatInterval * 1000 * 2
    });

    ws.localSocket(onMessage || defaultMessageHandler);

    return ws;
  };

  /**
   * @description 初始化 iframe WebSocket 连接
   * @param options 初始化参数
   * @param options.iframeScreenId iframe 所引用大屏的唯一标识
   * @param options.controlWebsocketUrl 终端通信的 ws 连接地址
   * @param options.heartbeatInterval 心跳检查时间间隔，单位为毫秒
   * @param options.onMessage 自定义消息处理器
   * @returns WebSocket 连接对象
   */
  const initIframeWs = ({
    iframeScreenId,
    controlWebsocketUrl,
    heartbeatInterval,
    onMessage
  }: {
    iframeScreenId: string;
    controlWebsocketUrl: string;
    heartbeatInterval: number;
    onMessage?: (data: any) => void;
  }): WebSocketConfig => {
    // 如果已存在连接，直接返回
    if (iframeWsMap.has(iframeScreenId)) {
      return iframeWsMap.get(iframeScreenId) as WebSocketConfig;
    }

    const newIframeWs = createWebSocketConnection({
      controlWebsocketUrl,
      heartbeatInterval,
      onMessage
    });

    iframeWsMap.set(iframeScreenId, newIframeWs);

    return newIframeWs;
  };

  /**
   * @description 获取指定 iframe 的 WebSocket 连接
   * @param iframeScreenId iframe 所引用大屏的唯一标识
   * @returns WebSocket 连接对象，如果不存在则返回 undefined
   */
  const getIframeWs = (iframeScreenId: string): WebSocketConfig | undefined => {
    return iframeWsMap.get(iframeScreenId);
  };

  /**
   * @description 关闭指定 iframe 的 WebSocket 连接
   * @param iframeScreenId iframe 所引用大屏的唯一标识
   */
  const closeIframeWs = (iframeScreenId: string): void => {
    iframeWsMap.get(iframeScreenId)?.onclose();
    iframeWsMap.delete(iframeScreenId);
  };

  /**
   * @description 通过指定的 iframe WebSocket 发送消息
   * @param iframeScreenId iframe 所引用大屏的唯一标识
   * @param message 要发送的消息
   * @returns 是否发送成功
   */
  const sendIframeMessage = (iframeScreenId: string, message: any): boolean => {
    const ws = iframeWsMap.get(iframeScreenId);
    if (!ws) {
      console.error(`[iframe ws] WebSocket connection not found for iframeScreenId: ${iframeScreenId}`);
      return false;
    }
    ws.sendMsg(message);
    return true;
  };

  /**
   * @description 关闭所有 iframe WebSocket 连接
   */
  const closeAllIframeWs = (): void => {
    iframeWsMap.forEach((ws) => {
      ws.onclose();
    });
    iframeWsMap.clear();
  };

  return {
    iframeWsMap,
    initIframeWs,
    getIframeWs,
    closeIframeWs,
    sendIframeMessage,
    closeAllIframeWs
  };
});
