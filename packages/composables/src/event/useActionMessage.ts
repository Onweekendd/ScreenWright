import { type IotAddress, type TcpudpConfig, tcpudpDataTypeEnum, type WebSocketDataSource } from "@screenwright/types";

import { useTcpUdpWebSocket } from "./useTcpUdpWebSocket";

type tcpudpDataType = TcpudpConfig["dataType"];
type MaybeTcpudpConfig = TcpudpConfig | undefined;

/** 消息头部类型 */
interface MessageHeader {
  url: string;
  type: "TCP" | "UDP" | "WebSocket";
  desIp: string;
  desPort: number;
  charsetName: string;
  sendType: string;
}

/** 完整消息类型 */
interface SocketMessage {
  header: MessageHeader;
  body: string;
  localPort?: number;
}

/** 重试配置 */
interface RetryConfig {
  maxRetries: number;
  retryInterval: number;
}

/**
 * 动作消息管理 Hook
 * @description 用于处理TCP/UDP/WebSocket消息发送和重连逻辑
 */
export const useActionMessage = () => {
  // 初始化 TCP/UDP WebSocket 管理器
  const { initConnection, isConnected, getInstance } = useTcpUdpWebSocket();

  // 默认重试配置
  const defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    retryInterval: 1000
  };

  /**
   * 获取连接类型
   * @param dataType 数据类型
   * @returns 连接类型字符串
   */
  const getConnectionType = (dataType: tcpudpDataType): "TCP" | "UDP" | "WebSocket" => {
    const typeMap: Partial<Record<tcpudpDataType, "TCP" | "UDP" | "WebSocket">> = {
      [tcpudpDataTypeEnum.TCP]: "TCP",
      [tcpudpDataTypeEnum.UDP]: "UDP",
      [tcpudpDataTypeEnum.WebSocket]: "WebSocket"
    };
    return typeMap[dataType] || "WebSocket";
  };

  /**
   * 构建消息对象
   * @param config TCP/UDP配置
   * @returns 格式化的消息对象
   */
  const buildMessage = (config: MaybeTcpudpConfig): SocketMessage => {
    const { dataType, sendData, dataSourceObj, sendType } = config as TcpudpConfig;

    // 处理 WebSocket 类型数据源
    if (dataType === tcpudpDataTypeEnum.WebSocket) {
      const webSocketDataSource = dataSourceObj as WebSocketDataSource;
      const configData = JSON.parse(webSocketDataSource.config || "{}") as { baseUrl: string; type: string };

      return {
        header: {
          url: configData.baseUrl || webSocketDataSource.baseUrl || "",
          type: getConnectionType(dataType),
          desIp: "", // WebSocket 不需要 desIp
          desPort: 0, // WebSocket 不需要 desPort
          charsetName: "UTF-8", // WebSocket 默认字符集
          sendType: ""
        },
        body: sendData
      };
    }

    if (dataType === tcpudpDataTypeEnum.TCP || dataType === tcpudpDataTypeEnum.UDP) {
      // 处理 TCP/UDP 类型数据源
      const tcpUdpDataSource = dataSourceObj as IotAddress;
      const message: SocketMessage = {
        header: {
          url: "",
          type: getConnectionType(dataType),
          desIp: tcpUdpDataSource.desIp || "",
          desPort: tcpUdpDataSource.desPort || 0,
          charsetName: tcpUdpDataSource.charsetName || "UTF-8",
          sendType: dataType === tcpudpDataTypeEnum.UDP ? sendType || "unicast" : ""
        },
        body: sendData
      };

      // UDP 需要添加本地端口
      if (dataType === tcpudpDataTypeEnum.UDP && tcpUdpDataSource.localPort) {
        message.localPort = tcpUdpDataSource.localPort;
      }

      return message;
    }

    return {} as SocketMessage;
  };

  /**
   * 延时函数
   * @param ms 延时毫秒数
   * @returns Promise
   */
  const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  /**
   * 检查WebSocket连接状态
   * @returns 是否连接可用
   */
  const isWebSocketReady = (): boolean => {
    return isConnected();
  };

  /**
   * 通用重试函数
   * @param fn 需要重试的异步函数
   * @param config 重试配置
   * @returns Promise
   */
  const retry = async <T>(fn: () => Promise<T>, config: RetryConfig = defaultRetryConfig): Promise<T> => {
    const { maxRetries, retryInterval } = config;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`重试 ${maxRetries} 次后仍然失败:`, error);
          throw error;
        }

        console.log(`第 ${attempt + 1} 次尝试失败，${retryInterval}ms 后重试...`);

        // 重试前尝试重新连接
        initConnection(true);
        await sleep(retryInterval);
      }
    }

    throw new Error("重试失败");
  };

  /**
   * 发送TCP/UDP/WebSocket消息
   * @param tcpudpConfig TCP/UDP配置对象
   * @returns Promise<void>
   */
  const setTcpudpToWebsocket = async (tcpudpConfig: MaybeTcpudpConfig): Promise<void> => {
    // 验证配置
    if (!tcpudpConfig?.dataSourceObj) {
      throw new Error("TCP/UDP配置或数据源对象缺失");
    }

    // 检查WebSocket连接是否可用
    if (!isWebSocketReady()) {
      throw new Error("WebSocket未连接");
    }

    // 构建消息
    const message = buildMessage(tcpudpConfig);

    // 延时发送
    if (tcpudpConfig.dataDelay) {
      await sleep(tcpudpConfig.dataDelay);
    }

    // 发送消息
    const instance = getInstance();
    if (!instance) {
      throw new Error("WebSocket 实例不存在");
    }

    instance.sendMsg(message);
    console.log("消息发送成功:", message);
  };

  return {
    // 方法
    setTcpudpToWebsocket,
    retry,
    isWebSocketReady,
    getConnectionType,
    buildMessage,
    sleep
  };
};
