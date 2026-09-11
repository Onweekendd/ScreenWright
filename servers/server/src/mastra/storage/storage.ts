import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { z } from "zod";

import { sqliteUrl } from "@/lib/db/sqlite-url";

import { vector } from "../vector";
import { embeddingModel } from "../vector/embeddingModel";

const workingMemoryItem = z.string().trim().min(1).max(500);

export const biThreadWorkingMemorySchema = z
  .object({
    currentGoal: z
      .string()
      .trim()
      .min(1)
      .max(1_000)
      .optional()
      .describe("当前对话正在解决的主要目标；目标变化时替换旧值"),
    confirmedConstraints: z
      .array(workingMemoryItem)
      .max(20)
      .optional()
      .describe("用户已经明确确认、且当前任务仍需遵守的约束"),
    currentPlan: z
      .array(workingMemoryItem)
      .max(20)
      .optional()
      .describe("当前仍有效的实施步骤；计划改变或完成后及时更新或清空"),
    pendingQuestions: z.array(workingMemoryItem).max(20).optional().describe("继续执行前仍需用户确认或补充的信息"),
    recentFailures: z
      .array(workingMemoryItem)
      .max(10)
      .optional()
      .describe("当前任务中近期失败及其原因；问题解决后移除"),
    unverifiedAssumptions: z
      .array(workingMemoryItem)
      .max(20)
      .optional()
      .describe("尚未通过工具、运行时或用户确认的假设；验证后移除或转为约束")
  })
  .describe(
    "当前 BI 对话线程的工作状态。不要保存组件完整配置、编辑器快照、工具原始结果、密钥，或可从 Workspace、数据库和运行时重新读取的事实。"
  );

// 单机版：Mastra 记忆/线程/追踪落 SQLite（libsql）。
// URL 由 MASTRA_DATABASE_URL 提供（如 file:./.data/mastra.db），相对路径以 servers/server 为基准。
export const storage = new LibSQLStore({
  id: "libsql-storage",
  url: sqliteUrl("MASTRA_DATABASE_URL", "file:./.data/mastra.db")
});

export const memory = new Memory({
  storage,
  vector,
  embedder: embeddingModel as any,
  options: {
    lastMessages: 500,
    // 目前有bug 无法支持 clientTool 暂不启用
    // observationalMemory: {
    //   model: aihubmix("gemini-2.5-flash"),
    //   observation: {
    //     messageTokens: 40_000, // 15k token 触发 Observer（默认30k，你的 tool result 大所以要更低）
    //     bufferTokens: 0.2, // 每累积 3k token 在后台预压缩一次
    //     bufferActivation: 0.8, // 激活时保留 20% 原始消息
    //     blockAfter: 1.2 // 18k token 强制同步压缩（安全阀）
    //   },
    //   reflection: {
    //     observationTokens: 40_000, // 25k token 触发 Reflector（默认40k）
    //     bufferActivation: 0.5 // observations 达到 50% 就开始后台反思
    //   }
    // },
    workingMemory: {
      enabled: true,
      scope: "thread",
      schema: biThreadWorkingMemorySchema
    }
  }
});
