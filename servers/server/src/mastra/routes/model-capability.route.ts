import { Hono } from "hono";

import { getModelCapability } from "../services/model-capability.server";

/**
 * 只读的模型能力配置。前端上下文进度条据此计算占用与告警阈值，
 * 不再自己硬编码上限（历史上前后端差过 5 倍）。
 */
export const modelCapabilityRouter = new Hono().get("/model-capability", (c) => {
  return c.json(getModelCapability());
});
