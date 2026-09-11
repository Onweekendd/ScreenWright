import { Websocketconfig } from "../utils/websocket";

/**
 * TCP/UDP WebSocket 消息接口
 */
interface TcpUdpMessage {
  id: string;
  Operation: string;
  [key: string]: any;
}

/** 纯逻辑：只读 process.env，无 app 耦合 */
function getTcpNoticeWebsocketUrl(): string {
  let url = "";
  let websocketHost = "";
  let protocol = "";
  const { VITE_API_BASE_URL } = process.env || {};
  const baseURL = VITE_API_BASE_URL;
  if (baseURL) {
    websocketHost = baseURL.slice(baseURL.indexOf("//")).split(":")[0] + "/bi-application";
    protocol = baseURL.slice(0, baseURL.indexOf("//")) === "https:" ? "wss:" : "ws:";
    url = `${protocol + websocketHost}/webSocket`;
  }
  return url;
}

/**
 * TCP/UDP WebSocket 单例管理器
 * @description 专门用于管理 TCP/UDP WebSocket 连接的单例类，替代 initConnectTCPAndUDP 函数
 */
class TcpUdpWebSocketManager {
  private static instance: TcpUdpWebSocketManager | null = null;
  private webSocketInstance: InstanceType<typeof Websocketconfig> | null = null;

  private constructor() {
    // 私有构造函数，防止外部实例化
  }

  /**
   * 获取单例实例
   * @returns TcpUdpWebSocketManager 实例
   */
  static getInstance(): TcpUdpWebSocketManager {
    if (!TcpUdpWebSocketManager.instance) {
      TcpUdpWebSocketManager.instance = new TcpUdpWebSocketManager();
    }
    return TcpUdpWebSocketManager.instance;
  }

  /**
   * 初始化 TCP/UDP WebSocket 连接
   * @param isOpen 是否开启连接
   * @description 替代原来的 initConnectTCPAndUDP 函数
   */
  initConnectTCPAndUDP(isOpen: boolean): void {
    if (!isOpen) {
      this.disconnect();
      return;
    }

    try {
      // 获取 WebSocket URL
      const wsUrl = (window.webconfig as any)?.tcpNoticeWebsocketUrl || getTcpNoticeWebsocketUrl();

      if (!wsUrl) {
        console.error("TCP/UDP WebSocket URL 未配置");
        return;
      }

      // 定义收到消息的处理函数
      const receivedMsg = (info: TcpUdpMessage): void => {
        console.log("🚀 ~ TCP/UDP WebSocket 收到消息:", info);
      };

      // 创建 WebSocket 实例（复用 websocket.ts 中的 Websocketconfig）
      this.webSocketInstance = new Websocketconfig({
        src: wsUrl,
        longConnect: true
      });

      // 注册接收数据方法
      this.webSocketInstance.localSocket(receivedMsg);

      // 将实例挂载到全局对象（兼容现有代码）
      (window as any).tcpNoticeWebsocket = this.webSocketInstance;

      console.log("TCP/UDP WebSocket 初始化完成");
    } catch (error) {
      console.error("TCP/UDP WebSocket 初始化失败:", error);
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.webSocketInstance) {
      this.webSocketInstance.onclose();
      this.webSocketInstance = null;
    }

    // 清除全局对象
    if ((window as any).tcpNoticeWebsocket) {
      delete (window as any).tcpNoticeWebsocket;
    }

    console.log("TCP/UDP WebSocket 连接已断开");
  }

  /**
   * 检查连接状态
   * @returns 是否已连接
   */
  isConnected(): boolean {
    return this.webSocketInstance?.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取 WebSocket 实例
   * @returns WebSocket 实例
   */
  getWebSocketInstance(): InstanceType<typeof Websocketconfig> | null {
    return this.webSocketInstance;
  }
}

/**
 * TCP/UDP WebSocket 管理 Hook
 * @description 提供 TCP/UDP WebSocket 连接管理的 Vue 3 Hook
 */
export const useTcpUdpWebSocket = () => {
  const manager = TcpUdpWebSocketManager.getInstance();

  return {
    /**
     * 初始化连接（替代 initConnectTCPAndUDP）
     * @param isOpen 是否开启连接
     */
    initConnection: (isOpen: boolean) => manager.initConnectTCPAndUDP(isOpen),

    /**
     * 断开连接
     */
    disconnect: () => manager.disconnect(),

    /**
     * 检查连接状态
     */
    isConnected: () => manager.isConnected(),

    /**
     * 获取 WebSocket 实例
     */
    getInstance: () => manager.getWebSocketInstance()
  };
};

// 导出单例管理器（用于兼容现有代码）
export { TcpUdpWebSocketManager };

// 导出兼容函数（直接替代原来的 initConnectTCPAndUDP）
export const initConnectTCPAndUDP = (isOpen: boolean): void => {
  const manager = TcpUdpWebSocketManager.getInstance();
  manager.initConnectTCPAndUDP(isOpen);
};
