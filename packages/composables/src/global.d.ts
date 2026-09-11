export {};

declare global {
  interface WebConfig {
    /** 系统接口服务 */
    WEB_APP_API_BASE_URL?: string;
    /** 终端控制websocket地址 */
    controlWebsocketUrl?: string;
    /** tcp通知websocket地址 */
    tcpNoticeWebsocketUrl?: string;
    [key: string]: any;
  }

  interface Window {
    webconfig: WebConfig;
  }
}
