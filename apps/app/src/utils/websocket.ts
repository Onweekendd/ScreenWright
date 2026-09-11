// WebSocketConfig 类已下沉到 @screenwright/composables；此处再导出以保持原有导入路径不变。
export { WebSocketConfig, Websocketconfig } from "@screenwright/composables";

// 从独立文件导入并重新导出辅助函数
export { getWsProtocolAndHost, initConnectTCPAndUDP, systemWSNotice } from "./websocket-utils";
