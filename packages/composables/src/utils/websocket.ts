// 定义WebSocket连接配置接口
export interface WebsocketConfigData {
  src?: string;
  longConnect?: boolean;
  /** 最大重连次数，默认为3；长连接模式下不扣减次数 */
  limitConnect?: number;
  initLoad?: boolean;
  token?: string;
  enableResponseCheck?: boolean; // 是否启用响应超时检测
  responseTimeout?: number; // 消息响应超时时间（毫秒），默认5秒
  enableHeartbeat?: boolean; // 是否启用心跳检测
  heartbeatInterval?: number; // 心跳间隔（毫秒）
  heartbeatMessage?: string | object; // 自定义心跳消息，默认 {type: "heartbeat", timestamp: Date.now()}
}

const TOKEN_KEY = "bi_token";
const DEFAULT_RECONNECT_LIMIT = 3;
const getToken = (): string | null => window.localStorage.getItem(TOKEN_KEY);

/**
 * WebSocket连接配置类
 * 提供WebSocket连接管理、自动重连、心跳检测和超时处理功能
 */
export class WebSocketConfig {
  /** 最大重连次数限制，默认3次 */
  limitConnect: number;

  /** 是否为长连接类型，长连接不会减少重连次数限制 */
  longConnect: boolean;

  /** WebSocket服务器地址URL */
  websocketServerUrl: string;

  /** 认证令牌，用于WebSocket连接认证 */
  token: string | null;

  /** 连接状态标识，打开时为"open"，关闭时为null */
  socketOpen?: null | string;

  /** WebSocket实例对象 */
  ws?: WebSocket;

  /** 消息响应超时时间（毫秒），超过此时间未收到响应将触发重连 */
  responseTimeout: number;

  /** 响应超时检测定时器，用于定期检查是否有消息超时未响应 */
  responseCheckTimer?: NodeJS.Timeout;

  /** 最后发送消息的时间戳，用于计算响应超时 */
  lastSendTime: number;

  /** 最后收到消息的时间戳，用于心跳和超时检测 */
  lastReceiveTime: number;

  /** 消息接收回调函数，保存用于重连时恢复消息处理 */
  onReceiveMessageCallback?: (data: any) => void;

  /** 连接打开回调函数 */
  onOpenCallback?: () => void;

  /** 连接错误回调函数 */
  onErrorCallback?: (error: string) => void;

  /** 是否有待响应的消息，用于超时检测逻辑 */
  hasPendingMessage: boolean;

  /** 是否启用心跳检测功能 */
  enableHeartbeat: boolean;

  /** 心跳检测间隔时间（毫秒） */
  heartbeatInterval: number;

  /** 自定义心跳消息内容，默认发送{type: "heartbeat", timestamp: Date.now()} */
  heartbeatMessage?: string | object;

  /** 心跳检测定时器 */
  heartbeatTimer?: NodeJS.Timeout;

  /** 是否启用响应超时检测 */
  enableResponseCheck: boolean;

  /** 连接错误标记，用于跨定时器传递错误状态 */
  private connectionError: Error | null = null;

  /**
   * 创建WebSocket连接实例
   * @param data WebSocket配置参数
   * @param data.src WebSocket服务器地址
   * @param data.longConnect 是否为长连接（长连接不会减少重连次数）
   * @param data.limitConnect 最大重连次数，默认3次
   * @param data.initLoad 是否初始化时立即建立连接
   * @param data.token 认证令牌，默认从getToken()获取
   * @param data.responseTimeout 消息响应超时时间（毫秒），默认5000ms
   * @param data.enableHeartbeat 是否启用心跳检测，默认false
   * @param data.heartbeatInterval 心跳间隔（毫秒），默认30000ms
   * @param data.heartbeatMessage 自定义心跳消息
   */
  constructor({
    src,
    longConnect,
    limitConnect,
    initLoad,
    token,
    responseTimeout,
    enableHeartbeat,
    heartbeatInterval,
    heartbeatMessage,
    enableResponseCheck
  }: WebsocketConfigData) {
    this.longConnect = longConnect || false;
    this.websocketServerUrl = src || "";
    this.responseTimeout = responseTimeout || 5000; // 默认5秒
    this.enableHeartbeat = enableHeartbeat || false;
    this.heartbeatInterval = heartbeatInterval || 30000; // 默认30秒
    this.heartbeatMessage = heartbeatMessage;
    this.token = token || getToken();
    this.enableResponseCheck = enableResponseCheck || false;
    this.limitConnect = limitConnect ?? DEFAULT_RECONNECT_LIMIT;
    this.lastSendTime = 0;
    this.lastReceiveTime = Date.now();
    this.hasPendingMessage = false;

    if (initLoad) {
      this.localSocket();
    }

    // 监听页面关闭---仅针对PC端
    window.addEventListener("beforeunload", () => {
      this.onclose();
    });
  }

  /**
   * 执行WebSocket重连
   * 使用防抖 + attempt 机制，确保重连操作的安全性和频率控制
   * @param onReceiveMessage 消息接收回调函数，用于重连后的消息处理
   */
  reconnect(onReceiveMessage?: (data: any) => void) {
    if (this.limitConnect <= 0) {
      throw new Error("TCP连接已超时");
    }

    // 长连接的话就不用减这个值，不然到0之后就不再连接
    if (!this.longConnect) {
      this.limitConnect -= 1;
    }

    console.log(`剩余重连次数: ${this.limitConnect}`);

    this.localSocket(onReceiveMessage);
  }

  /**
   * 处理WebSocket连接打开事件
   * @private
   */
  private handleWebSocketOpen(): void {
    console.log("加入连接：", this.websocketServerUrl);
    // 清除错误标记
    this.connectionError = null;
    // 启动心跳检测
    this.startHeartbeat();
    if (this.onOpenCallback) {
      this.onOpenCallback();
    }
  }

  /**
   * 处理WebSocket消息接收事件
   * @private
   */
  private handleWebSocketMessage(msg: MessageEvent, onReceiveMessage?: (data: any) => void): void {
    // 更新最后接收消息的时间
    this.lastReceiveTime = Date.now();

    const received_msg = JSON.parse(msg.data);
    if (onReceiveMessage) {
      onReceiveMessage(received_msg);
    }

    // 收到消息后，标记没有待响应的消息（在回调之后设置，允许回调中判断消息类型）
    this.hasPendingMessage = false;
  }

  /**
   * 处理WebSocket连接关闭事件
   * 统一处理所有重连逻辑（error、超时、心跳失败等都会触发此回调）
   *
   * 关闭码说明：
   * - 1000: 正常关闭（用户主动关闭）
   * - 1001: 端点离开（页面关闭等）
   * - 3001: 连接错误
   * - 3002: 响应超时
   * - 3003: 心跳检测失败/连接状态异常
   *
   * @private
   */
  private handleWebSocketClose(ev: CloseEvent): void {
    this.socketOpen = null;
    // 停止响应超时检测
    this.stopResponseCheck();
    // 停止心跳检测
    this.stopHeartbeat();

    // 记录关闭信息
    console.info(`连接已关闭 - Code: ${ev.code}, Reason: ${ev.reason || "无"}, WasClean: ${ev.wasClean}`);

    // 判断是否为正常关闭（1000: 正常关闭, 1001: 端点离开）
    const isNormalClose = ev.code === 1000 || ev.code === 1001;

    if (isNormalClose) {
      console.info("正常关闭，不进行重连");
      return;
    }

    // 异常关闭时才进行重连：长连接模式或有重连次数剩余
    if ((this.longConnect || this.limitConnect > 0) && this.onReceiveMessageCallback) {
      console.warn(`检测到异常关闭 (code: ${ev.code})，准备重连...`);
      this.reconnect(this.onReceiveMessageCallback);
    }
  }

  /**
   * 处理WebSocket连接错误事件
   * 只关闭连接，由 close 回调统一处理重连
   * @private
   */
  private handleWebSocketError(): void {
    console.log("WebSocket连接错误，准备关闭连接...");
    // 停止响应超时检测
    this.stopResponseCheck();
    // 停止心跳检测
    this.stopHeartbeat();

    if (this.onErrorCallback) {
      this.onErrorCallback("error");
    }

    // 关闭连接，触发 close 回调进行统一的重连处理
    // 3001: 自定义错误码 - 连接错误
    this.ws?.close(3001, "连接错误");
  }

  /**
   * 建立WebSocket连接并设置事件处理器
   * @param onReceiveMessage 消息接收回调函数
   * @param onError 连接错误回调函数
   * @param onOpen 连接打开回调函数
   */
  localSocket(onReceiveMessage?: (data: any) => void, onError?: (error: string) => void, onOpen?: () => void): void {
    if ("WebSocket" in window && this.websocketServerUrl) {
      // 保存回调函数，用于重连和其他操作
      if (onReceiveMessage) {
        this.onReceiveMessageCallback = onReceiveMessage;
      }
      if (onOpen) {
        this.onOpenCallback = onOpen;
      }
      if (onError) {
        this.onErrorCallback = onError;
      }

      this.ws = new WebSocket(this.websocketServerUrl);

      this.ws.onopen = () => this.handleWebSocketOpen();
      this.ws.onmessage = (msg: MessageEvent) => this.handleWebSocketMessage(msg, onReceiveMessage);
      this.ws.onclose = (ev: CloseEvent) => this.handleWebSocketClose(ev);
      this.ws.onerror = () => this.handleWebSocketError();
    } else {
      // 浏览器不支持 WebSocket
      alert("您的浏览器不支持 WebSocket!");
    }
  }

  /**
   * 标记WebSocket连接为打开状态
   * 此方法主要用于状态管理，实际的连接打开处理在localSocket方法中
   */
  onopen(): void {
    this.socketOpen = "open";
  }

  /**
   * 处理WebSocket连接关闭
   * 停止所有定时器并清理连接资源
   */
  onclose(): void {
    // 停止响应超时检测
    this.stopResponseCheck();
    // 停止心跳检测
    this.stopHeartbeat();
    this.ws?.close(1000, "用户主动关闭");
  }

  /**
   * 发送消息到WebSocket服务器
   * @param msg 要发送的消息内容，支持字符串或对象
   * @param isBuffer 是否作为二进制缓冲区发送，默认false
   */
  sendMsg(msg: string | object, isBuffer = false): void {
    // readyState: 0-正在建立 | 1-已建立 |2-正在关闭 | 3-已关闭
    if (this.ws && this.ws.readyState === 1) {
      this.ws.send(isBuffer ? (msg as string) : JSON.stringify(msg));
      // 记录发送时间并标记有待响应的消息
      this.lastSendTime = Date.now();
      this.hasPendingMessage = true;
      // 启动响应超时检测
      if (this.enableResponseCheck) {
        this.startResponseCheck();
      }
    } else {
      console.log("WebSocket is not ready");
    }
  }

  /**
   * 启动响应超时检测
   * 定期检查是否有消息发送后长时间未收到响应，若超时则关闭连接并重连
   * @private
   */
  private startResponseCheck(): void {
    // 如果已经有检测定时器在运行，不重复启动
    if (this.responseCheckTimer) {
      return;
    }

    // 每1秒检查一次是否超时（检查频率应该高于超时阈值）
    this.responseCheckTimer = setInterval(() => {
      // 如果没有待响应的消息，不需要检查
      if (!this.hasPendingMessage) {
        return;
      }

      const now = Date.now();
      const timeSinceLastSend = now - this.lastReceiveTime;

      // 检查是否超时：有待回复的消息且超过超时时间
      if (timeSinceLastSend > this.responseTimeout) {
        console.warn(
          `[WebSocket] 消息响应超时：已发送${Math.floor(timeSinceLastSend / 1000)}秒未收到回复，设置错误标记`
        );

        // 停止检测
        this.stopResponseCheck();

        // 设置错误标记，让心跳检测捕获并处理
        this.connectionError = new Error(`消息响应超时：${Math.floor(timeSinceLastSend / 1000)}秒未收到回复`);
      }
    }, 1000); // 每1秒检查一次

    console.log(`[WebSocket] 响应超时检测已启动，超时时间: ${this.responseTimeout}ms`);
  }

  /**
   * 停止响应超时检测
   * 清除响应超时检测定时器
   * @private
   */
  private stopResponseCheck(): void {
    if (this.responseCheckTimer) {
      clearInterval(this.responseCheckTimer);
      this.responseCheckTimer = undefined;
      console.log("[WebSocket] 响应超时检测已停止");
    }
  }

  /**
   * 启动心跳检测
   * 定期发送心跳消息以保持连接活跃，连接异常时自动重连
   * @private
   */
  private startHeartbeat(): void {
    if (!this.enableHeartbeat) {
      return;
    }

    // 清除之前的心跳定时器
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      try {
        // 首先检查是否有错误标记（可能来自响应超时检测）
        if (this.connectionError) {
          throw this.connectionError;
        }

        // 检查连接状态
        if (this.ws?.readyState === 1) {
          // 连接正常，发送心跳消息
          this.sendMsg({
            type: "heartbeat",
            timestamp: Date.now()
          });
        } else {
          // 连接状态异常
          throw new Error(`连接状态异常 (readyState=${this.ws?.readyState})`);
        }
      } catch (error) {
        // 捕获所有错误（包括响应超时、连接异常等）
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`[WebSocket] 心跳检测捕获错误: ${errorMessage}`);
        this.stopHeartbeat();

        // 清除错误标记
        this.connectionError = null;

        // 关闭连接，触发 close 回调进行统一的重连处理
        if (this.ws) {
          // 根据错误类型使用不同的关闭码
          // 3002: 响应超时，3003: 其他心跳检测失败
          const closeCode = errorMessage.includes("响应超时") ? 3002 : 3003;
          this.ws.close(closeCode, errorMessage);
        }
      }
    }, this.heartbeatInterval);

    console.log(`[WebSocket] 心跳检测已启动，间隔: ${this.heartbeatInterval}ms`);
  }

  /**
   * 停止心跳检测
   * 清除心跳检测定时器，停止定期心跳消息发送
   * @private
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
      console.log("[WebSocket] 心跳检测已停止");
    }
  }
}

// 别名导出，兼容原 apps/app 里 `Websocketconfig` 的命名
export { WebSocketConfig as Websocketconfig };
