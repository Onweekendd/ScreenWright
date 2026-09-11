import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";

import { getActive } from "@/utils/auth";

// 定义发送消息的数据结构接口
interface FunbiMessageData {
  skill: string;
  response: string;
  timestamp: string;
}

class IOSender {
  // 类属性添加类型注解
  private serverUrl: string;
  private socket: Socket | null;
  private reconnectInterval: number;

  constructor(serverUrl?: string) {
    // 可选参数默认值
    this.serverUrl = serverUrl || "ws://localhost:3000";
    this.socket = null;
    this.reconnectInterval = 3000;
    this.connect();
  }

  /**
   * 建立 Socket.IO 连接
   */
  private connect(): void {
    console.log(`🔌 正在连接Socket.IO服务器: ${this.serverUrl}`);
    this.socket = io(this.serverUrl, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: this.reconnectInterval,
      transports: ["websocket", "polling"]
    });

    this.socket.on("connect", () => {
      console.log("✅ Socket.IO连接成功！");
      const username = getActive("userInfo")?.userName || "";
      // 给服务端发送「用户登录」事件，传递用户名
      if (username && this.socket) {
        this.socket.emit("user_login", username);
      }
    });

    this.socket.on("connect_error", (err: Error) => {
      console.error(`连接错误: ${err.message}`);
    });

    this.socket.on("disconnect", (reason: string) => {
      console.warn(`连接断开: ${reason}. 自动重连中...`);
    });

    // 监听系统消息
    this.socket.on("system_msg", (msg) => {
      console.log("系统通知", msg, "📩 system");
    });

    // 监听私聊消息
    this.socket.on("private_msg", (data) => {
      const from = data.from || "未知用户";
      const to = data.to ? `（发给${data.to}）` : "";
      console.log(`${from}${to}`, data.msg, "📩 private");
    });

    // 监听群聊消息
    this.socket.on("group_msg", (data) => {
      console.log(data.from, data.msg, "📩 group");
    });
  }
  /**
   * 发送消息到 Socket.IO 服务器
   * @param response 要发送的消息内容
   * @returns 发送是否成功
   */
  public sendResponse(response: string): boolean {
    if (!this.socket || !this.socket.connected) {
      console.warn("⚠️ Socket.IO未就绪，消息已排队");
      return false;
    }

    try {
      const messageData: FunbiMessageData = {
        skill: "screenwright-skill-beta",
        response: response,
        timestamp: new Date().toISOString()
      };
      // 发送群聊消息
      // this.socket.emit('group_chat', messageData);
      // 发送私聊消息：传递接收人 + 消息
      const username = getActive("userInfo")?.name || "";
      if (username) {
        this.socket.emit("private_chat", {
          to_username: username,
          msg: messageData
        });
        console.log(`📤 已发送消息: ${response}`);
      }
      return true;
    } catch (err) {
      // 捕获错误并指定类型
      const error = err as Error;
      console.error(`发送失败: ${error.message}`);
      return false;
    }
  }
}

export default IOSender;
