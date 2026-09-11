import z from "zod";

export const TaskStatusSchema = z
  .enum(["pending", "in_progress", "completed", "failed", "cancelled"])
  .describe("任务状态");

export const TaskSchema = z.object({
  id: z.string(),
  subject: z.string().describe("任务标题（祈使句）"),
  description: z.string().describe("详细描述"),
  activeForm: z.string().optional().describe("进行时形式，用于 spinner"),
  owner: z.string().optional().describe("认领该任务的 agent ID"),
  status: TaskStatusSchema,
  attemptCount: z.number().int().nonnegative().optional().describe("任务已经开始执行的次数"),
  lastError: z.string().optional().describe("最近一次执行失败的原因"),
  blocks: z.array(z.string()).default([]).describe("本任务阻塞的任务 ID 列表，无依赖时省略"),
  blockedBy: z.array(z.string()).default([]).describe("阻塞该任务的任务 ID 列表，无依赖时省略"),
  metadata: z.record(z.string(), z.unknown()).optional().describe("可选的元数据字段，用于存储额外信息")
});

export type Task = z.infer<typeof TaskSchema>;
