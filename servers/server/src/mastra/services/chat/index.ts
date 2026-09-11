/**
 * BI Chat 业务逻辑层
 *
 * 负责：解析请求、调用 agent.stream、转换流格式并返回响应
 */

export { createBIChatTurnStream } from "./bi-chat-turn-stream";
export { handleBiChat, handleBiChatResume, handleBiChatResumeTask } from "./handle-bi-chat";
export { SessionRegistry, sessionRegistry } from "./session-registry";
export type { BIChatStreamSession } from "./stream-session";
export {
  handleCompactThread,
  handleCreateThread,
  handleListThreadMessages,
  handleListThreads,
  handleUpdateThread
} from "./thread-handlers";
export type { BIChatRequest } from "./types";
