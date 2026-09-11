import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

import { resolveReasoningModelNoRecord } from "../provider/model-registry";
import { storage } from "../storage/storage";

const titleAgent = new Agent({
  id: "title-agent",
  name: "标题生成器",
  description: "根据对话内容生成精准的对话标题",
  instructions: `
你是对话标题生成器。根据用户的第一条提问，生成一个精准的标题。

生成规则：
- 核心：提炼用户的提问意图
- 长度：6~15 个字（中文优先）
- 格式：名词短语或动宾短语，不加句号
- 技术问题：保留关键技术词（如"React Hook 闭包问题"、"Prisma 联表查询"）
- 概念提问：点明概念和方向（如"什么是 RAG 检索增强"）
- 任务请求：动宾结构（如"生成 Git Commit 信息"、"翻译英文合同"）
- 不要泛化（禁止用"代码问题"、"技术讨论"、"日常对话"此类无意义标题）
- 只输出标题本身，不加引号、不加任何解释
  `,
  memory: new Memory({
    storage,
    options: {
      lastMessages: 4 // 只保留最近4条消息用于生成标题
    }
  }),

  // record:false —— 标题生成不参与 LLM 往返录制，避免经连接复用泄漏进主对话 turn。
  model: () => resolveReasoningModelNoRecord(),

  defaultOptions: {
    maxSteps: 1 // 标题生成不需要多步推理
  }
});

export { titleAgent };
