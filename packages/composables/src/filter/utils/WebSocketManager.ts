import type { WebsocketConfigData } from "./WebSocketConnection";
import { WebSocketConnection } from "./WebSocketConnection";

/**
 * WebSocket 连接管理器（单例）
 *
 * 职责：
 * - 管理所有 WebSocket 连接的生命周期
 * - 避免重复连接同一个服务
 * - 支持多订阅者模式
 * - 实现延迟关闭策略
 *
 * 设计原则：
 * - 信息隐蔽：连接管理细节对外部不可见
 * - 单一职责：只负责连接管理，不处理业务逻辑
 * - 防御性编程：完善的参数检查和错误处理
 */
class WebSocketManager {
  private static instance: WebSocketManager | null = null;

  // 核心数据结构
  private connections: Map<string, WebSocketConnection>;
  private pendingClosures: Map<string, NodeJS.Timeout>;

  // 配置常量
  private readonly CLOSE_DELAY_MS = 5000;
  private readonly DEFAULT_HEARTBEAT_INTERVAL = 30000;
  private readonly DEFAULT_RESPONSE_TIMEOUT = 5000;

  /**
   * 私有构造函数（单例模式）
   */
  private constructor() {
    this.connections = new Map();
    this.pendingClosures = new Map();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * 连接到 WebSocket 服务或复用现有连接
   *
   * @param url WebSocket 服务地址
   * @param config 可选的连接配置
   * @returns 连接标识符（用于后续订阅和取消订阅）
   * @throws {Error} 如果 URL 无效
   */
  connect(url: string, config?: Partial<WebsocketConfigData>): string {
    // 防御性编程：参数验证
    if (!this.isValidWebSocketUrl(url)) {
      throw new Error(`Invalid WebSocket URL: ${url}`);
    }

    const connectionKey = this.generateConnectionKey(url);

    // 如果连接计划关闭，取消关闭计划
    this.cancelPendingClosure(connectionKey);

    // 如果连接不存在，创建新连接
    if (!this.hasConnection(connectionKey)) {
      this.createNewConnection(connectionKey, url, config);
    }

    return connectionKey;
  }

  /**
   * 订阅连接的数据更新
   *
   * @param connectionKey 连接标识符
   * @param subscriberId 订阅者ID（通常是组件ID）
   * @param callback 数据更新回调函数
   * @throws {Error} 如果连接不存在
   */
  subscribe(connectionKey: string, subscriberId: string, callback: (data: any) => void): void {
    // 防御性编程：参数验证
    if (!connectionKey || !subscriberId || !callback) {
      throw new Error("Invalid subscription parameters");
    }

    const connection = this.getConnection(connectionKey);
    if (!connection) {
      throw new Error(`Connection not found: ${connectionKey}`);
    }

    connection.addSubscriber(subscriberId, callback);
  }

  /**
   * 取消订阅
   *
   * @param connectionKey 连接标识符
   * @param subscriberId 订阅者ID
   */
  unsubscribe(connectionKey: string, subscriberId: string): void {
    const connection = this.getConnection(connectionKey);
    if (!connection) {
      console.warn(`Connection not found: ${connectionKey}`);
      return;
    }

    connection.removeSubscriber(subscriberId);

    // 如果没有订阅者了，延迟关闭连接
    if (connection.hasNoSubscribers()) {
      this.scheduleConnectionClosure(connectionKey);
    }
  }

  /**
   * 获取连接的最新数据
   *
   * @param connectionKey 连接标识符
   * @returns 最新接收的数据数组
   */
  getLatestData(connectionKey: string): any[] {
    const connection = this.getConnection(connectionKey);
    return connection?.getLatestData() || [];
  }

  /**
   * 生成连接标识符
   * 信息隐蔽：调用者不需要知道标识符的生成逻辑
   *
   * @param url WebSocket URL
   * @returns 连接标识符
   */
  private generateConnectionKey(url: string): string {
    // 当前策略：直接使用 URL
    // 未来可以扩展为：URL + 配置参数的哈希
    return url;
  }

  /**
   * 验证 WebSocket URL 的有效性
   *
   * @param url 待验证的 URL
   * @returns 是否有效
   */
  private isValidWebSocketUrl(url: string): boolean {
    if (!url || typeof url !== "string") {
      return false;
    }

    const pattern = /^ws[s]?:\/\/([\w-]+\.)+[\w-]+([\w\-\\.,@?^=%&:/~\\+#]*[\w\-\\@?^=%&/~\\+#])?$/;
    return pattern.test(url);
  }

  /**
   * 检查连接是否存在
   */
  private hasConnection(connectionKey: string): boolean {
    return this.connections.has(connectionKey);
  }

  /**
   * 获取连接对象
   */
  private getConnection(connectionKey: string): WebSocketConnection | undefined {
    return this.connections.get(connectionKey);
  }

  /**
   * 取消待关闭的连接计划
   */
  private cancelPendingClosure(connectionKey: string): void {
    const timer = this.pendingClosures.get(connectionKey);
    if (timer) {
      clearTimeout(timer);
      this.pendingClosures.delete(connectionKey);
    }
  }

  /**
   * 计划延迟关闭连接
   *
   * 延迟关闭的目的：
   * - 避免快速重新加载组件时重复建立连接
   * - 如果延迟期间有新订阅，连接会被保留
   */
  private scheduleConnectionClosure(connectionKey: string): void {
    const timer = setTimeout(() => {
      this.closeConnectionIfUnused(connectionKey);
    }, this.CLOSE_DELAY_MS);

    this.pendingClosures.set(connectionKey, timer);
  }

  /**
   * 关闭未使用的连接
   */
  private closeConnectionIfUnused(connectionKey: string): void {
    const connection = this.getConnection(connectionKey);

    // 再次检查是否有订阅者（延迟期间可能有新订阅）
    if (connection && connection.hasNoSubscribers()) {
      connection.close();
      this.connections.delete(connectionKey);
      this.pendingClosures.delete(connectionKey);

      console.log(`[WebSocketManager] 连接已关闭: ${connectionKey}`);
    }
  }

  /**
   * 创建新的 WebSocket 连接
   *
   * 职责：
   * - 初始化 WebSocket 配置
   * - 设置消息处理回调
   * - 存储连接对象
   */
  private createNewConnection(connectionKey: string, url: string, config?: Partial<WebsocketConfigData>): void {
    const connection = new WebSocketConnection(url, this.buildConnectionConfig(config), (error) =>
      this.handleConnectionError(connectionKey, error)
    );

    this.connections.set(connectionKey, connection);
  }

  /**
   * 构建 WebSocket 连接配置
   */
  private buildConnectionConfig(customConfig?: Partial<WebsocketConfigData>): WebsocketConfigData {
    return {
      longConnect: false,
      enableHeartbeat: true,
      heartbeatInterval: this.DEFAULT_HEARTBEAT_INTERVAL,
      responseTimeout: this.DEFAULT_RESPONSE_TIMEOUT,
      ...customConfig,
      // WebSocketConnection 会在注册回调时主动建立连接，避免构造阶段重复连接。
      initLoad: false
    };
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(connectionKey: string, error: string): void {
    console.error(`[WebSocketManager] 连接错误 (${connectionKey}):`, error);

    // 可以在这里添加错误恢复逻辑
    // 例如：通知所有订阅者、尝试重连等
  }

  /**
   * 重置单例实例（仅用于测试）
   */
  static resetInstance(): void {
    if (WebSocketManager.instance) {
      // 关闭所有连接
      WebSocketManager.instance.connections.forEach((connection, key) => {
        connection.close();
      });
      WebSocketManager.instance.connections.clear();
      WebSocketManager.instance.pendingClosures.clear();
      WebSocketManager.instance = null;
    }
  }
}

export { WebSocketConnection, WebSocketManager };
