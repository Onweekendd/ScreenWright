export {};

declare global {
  /** 仅离线导出包内联注入，运行时读取前要判空 */
  interface WebConfig {
    /** 终端控制websocket地址 */
    controlWebsocketUrl?: string;
    /** tcp通知websocket地址 */
    tcpNoticeWebsocketUrl?: string;
    [key: string]: any;
  }

  interface Window {
    webconfig?: WebConfig;
  }
}
