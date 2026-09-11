import { ElNotification } from "element-plus";

import audioUrl from "@/assets/video/embedAudio.mp3";
import { getToken } from "@/utils/auth";
import { BaseName } from "@/utils/config";
import { getTcpNoticeWebsocketUrl } from "@/utils/utils";

import { WebSocketConfig } from "./websocket";

// 系统公告处理
let noticeWebsocket: WebSocketConfig | null = null;
const webSocketNotice = new Map();
let wsTimer: NodeJS.Timeout | null = null;
const heartbeatTimer: NodeJS.Timeout | null = null;

const systemWSNotice = (isOpen: boolean): void => {
  if (!isOpen) {
    noticeWebsocket?.onclose();
    webSocketNotice.clear();
    if (wsTimer) clearInterval(wsTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    return;
  }
  if (location.pathname.includes("/shareScreen/") || location.pathname.includes("/view/")) return;
  const { VITE_API_BASE_URL } = process.env;
  const { WEB_APP_API_BASE_URL } = window.webconfig;

  // 定义收到消息的数据结构
  interface ReceivedMsg {
    id: string;
    Operation: string;
    type?: number;
    text?: string;
  }

  const receivedMsg = (info: ReceivedMsg): void => {
    let title = "系统公告";
    // 导出导出信息处理 2.导入完成3.导出完成   1:系统公告
    const { id, type } = info;
    if (type === 1 && webSocketNotice.get(id)) return;
    if (type === 2) {
      title = "导入成功";
      window?.importDiaplayCallback?.();
    } else if (type === 3) {
      title = "导出成功";
    } else if (type === -1) {
      title = "导入失败";
    }
    ElNotification({
      duration: type !== 1 ? 6000 : 0,
      dangerouslyUseHTMLString: true,
      message: `<div>
                <embed height="1" width="1" src="${audioUrl}" style="position: absolute;">
                <div style="color: #555c75; font-size: 16px; font-weight: 600"><i class="audio_icon"></i>${title}</div>
                <span >${info.text}</span>
              </div>`,
      position: "bottom-right",
      customClass: "el-notification-custom",
      onClose: () => {
        if (type === 1) {
          noticeWebsocket?.sendMsg(
            {
              id: info.id,
              Operation: "收到"
            },
            false
          );
          webSocketNotice.delete(info.id);
        }
      }
    });
  };

  // 实例连接
  const setupMsg = (token: string): void => {
    if (!token) return;
    const baseURL = WEB_APP_API_BASE_URL || VITE_API_BASE_URL || "";
    const websocketHost = baseURL.slice(baseURL.indexOf("//"));
    const protocol = baseURL.slice(0, baseURL.indexOf("//")) === "https:" ? "wss:" : "ws:";
    // 特殊处理
    // const pathname = protocol === 'ws:'? `${system}` : '';
    const pathname = `${BaseName.System}`;
    // 实例Websocketconfig
    noticeWebsocket = new WebSocketConfig({
      src: `${protocol + websocketHost}${pathname}/webSocket?auth=${token}`
    });
    // 注册接收数据⽅法
    noticeWebsocket?.localSocket(receivedMsg);
  };

  // 心跳检测
  //   const setHeartbeat = (): void => {
  //     if (location.protocol === "http:") return
  //     heartbeatTimer = setInterval(() => {
  //       const token = getToken()
  //       if (!noticeWebsocket || !token) clearInterval(heartbeatTimer)
  //       if (noticeWebsocket.socketOpen !== "open" && token) setupMsg(token)
  //     }, 1000 * 15)
  //   }

  if (wsTimer) clearTimeout(wsTimer);
  wsTimer = setTimeout(() => {
    const token = getToken();
    if (heartbeatTimer !== null || !token) clearInterval(heartbeatTimer as unknown as NodeJS.Timeout);
    if (token) {
      setupMsg(token);
      // setHeartbeat();
    }
  }, 5000);
};

const initConnectTCPAndUDP = (isOpen: boolean): void => {
  if (!isOpen) {
    (window as any).tcpNoticeWebsocket?.onclose();
    return;
  }
  // if (location.pathname.match(/(\/view\/|\/shareScreen\/|index.html)/g)) {
  //   const { VUE_APP_API_BASE_URL } = process.env
  //   const { WEB_APP_API_BASE_URL } = window.webconfig

  // 定义收到消息的数据结构
  interface ReceivedMsg {
    id: string;
    Operation: string;
  }

  const receivedMsg = (info: ReceivedMsg): void => {
    console.log("🚀 ~ receivedMsg ~ info:", info);
  };

  // 实例Websocketconfig
  (window as any).tcpNoticeWebsocket = new WebSocketConfig({
    src: (window.webconfig as any).tcpNoticeWebsocketUrl || getTcpNoticeWebsocketUrl(),
    longConnect: true
  });

  // 注册接收数据⽅法
  (window.webconfig as any).tcpNoticeWebsocket?.localSocket(receivedMsg);
};

const getWsProtocolAndHost = (): { protocol: string; wshost: string } => {
  const { VUE_APP_API_BASE_URL } = process.env;
  const { WEB_APP_API_BASE_URL } = window.webconfig;
  const baseURL = WEB_APP_API_BASE_URL || VUE_APP_API_BASE_URL || "";
  const wshost = baseURL.slice(baseURL.indexOf("//"));
  const protocol = baseURL.slice(0, baseURL.indexOf("//")) === "https:" ? "wss:" : "ws:";
  return {
    protocol,
    wshost
  };
};

export { getWsProtocolAndHost, initConnectTCPAndUDP, systemWSNotice };
