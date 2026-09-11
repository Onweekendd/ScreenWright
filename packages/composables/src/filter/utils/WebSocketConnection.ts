import { WebSocketConfig, type WebsocketConfigData } from "../../utils/websocket";

export type { WebsocketConfigData } from "../../utils/websocket";

/**
 * 数据回调类型定义
 */
export type DataCallback = (data: any) => void;

/**
 * WebSocket 连接封装
 *
 * 职责：
 * - 管理单个 WebSocket 连接的生命周期
 * - 管理该连接的所有订阅者
 * - 存储和分发接收到的数据
 *
 * 设计原则：
 * - 信息隐蔽：WebSocket 实现细节对外部不可见
 * - 单一职责：只负责单个连接的管理
 * - 高内聚：所有与单个连接相关的逻辑都在此类中
 */
export class WebSocketConnection {
  private readonly url: string;
  private readonly wsInstance: WebSocketConfig;
  private currentData: any; // 只保存最新数据
  private subscribers: Map<string, DataCallback>;

  /**
   * 构造函数
   *
   * @param url WebSocket 服务地址
   * @param config 连接配置
   * @param onError 错误处理回调
   */
  constructor(url: string, config: WebsocketConfigData, onError?: (error: string) => void) {
    this.url = url;
    this.currentData = [];
    this.subscribers = new Map();

    this.wsInstance = this.initializeWebSocket(url, config, onError);
  }

  /**
   * 初始化 WebSocket 连接
   */
  private initializeWebSocket(
    url: string,
    config: WebsocketConfigData,
    onError?: (error: string) => void
  ): WebSocketConfig {
    const ws = new WebSocketConfig({
      src: url,
      ...config
    });

    // 设置消息接收回调
    ws.localSocket(
      (data: any) => this.handleDataReceived(data),
      (error: string) => this.handleError(error, onError),
      () => this.handleConnected()
    );

    return ws;
  }

  /**
   * 处理接收到的数据
   */
  private handleDataReceived(data: any): void {
    // 只保留最新数据（替换策略）
    this.currentData = data;

    // 通知所有订阅者
    this.notifySubscribers(data);
  }

  /**
   * 通知所有订阅者
   */
  private notifySubscribers(data: any): void {
    this.subscribers.forEach((callback, subscriberId) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WebSocketConnection] 订阅者 ${subscriberId} 回调执行失败:`, error);
      }
    });
  }

  /**
   * 处理连接错误
   */
  private handleError(error: string, onError?: (error: string) => void): void {
    console.error(`[WebSocketConnection] 错误 (${this.url}):`, error);
    if (onError) {
      onError(error);
    }
  }

  /**
   * 处理连接建立
   */
  private handleConnected(): void {
    console.log(`[WebSocketConnection] 已连接: ${this.url}`);
  }

  /**
   * 添加订阅者
   *
   * @param subscriberId 订阅者唯一标识
   * @param callback 数据更新回调
   */
  addSubscriber(subscriberId: string, callback: DataCallback): void {
    if (this.subscribers.has(subscriberId)) {
      console.warn(`[WebSocketConnection] 订阅者 ${subscriberId} 已存在，将被覆盖`);
    }

    this.subscribers.set(subscriberId, callback);
  }

  /**
   * 移除订阅者
   *
   * @param subscriberId 订阅者标识
   * @returns 是否成功移除
   */
  removeSubscriber(subscriberId: string): boolean {
    return this.subscribers.delete(subscriberId);
  }

  /**
   * 检查是否没有订阅者
   */
  hasNoSubscribers(): boolean {
    return this.subscribers.size === 0;
  }

  /**
   * 获取订阅者数量
   */
  getSubscriberCount(): number {
    return this.subscribers.size;
  }

  /**
   * 获取最新数据
   */
  getLatestData(): any[] {
    return this.currentData; // 返回副本，防止外部修改
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.wsInstance.onclose();
    this.subscribers.clear();
    this.currentData = [];
  }

  /**
   * 获取连接 URL
   */
  getUrl(): string {
    return this.url;
  }
}
