import { zValidator } from "@hono/zod-validator";
import { createUIMessageStreamResponse, type LanguageModelUsage, type UIMessage } from "ai";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import z from "zod";

import {
  type BIChatRequest,
  handleBiChat,
  handleBiChatResume,
  handleBiChatResumeTask,
  handleCompactThread,
  handleCreateThread,
  handleListThreadMessages,
  handleListThreads,
  handleUpdateThread
} from "../services/chat";
import { buildScreenVersionKey } from "../services/screen-workspace";
import { handleGenerateTitle, type TitleGenerationRequest } from "../services/title-generation.server";
import { buildRollbackPlan, getRollbackPreview, listNodes, rollback } from "../services/version-history";
import { AgentMode, ListThreadMessagesRequestSchema } from "../types/bi-chat";
import { SuspendTypeSchema } from "../types/suspend";

const TitleGenerationRequestSchema = z.object({
  messages: z.custom<TitleGenerationRequest["messages"]>(),
  threadId: z.string()
});

const BiChatRequestSchema = z.object({
  messages: z.custom<UIMessage[]>(),
  clientTools: z.custom<BIChatRequest["clientTools"]>(),
  threadId: z.string().optional(),
  resourceId: z.string().optional(),
  runId: z.string().optional(),
  resumeData: z.record(z.string(), z.unknown()).optional()
});

const CreateThreadRequestSchema = z.object({
  resourceId: z.string(),
  title: z.string().optional(),
  metadata: z
    .object({
      lastUsage: z.custom<LanguageModelUsage>().optional(),
      mode: z.nativeEnum(AgentMode).optional()
    })
    .optional()
});

const ListThreadsRequestSchema = z.object({
  resourceId: z.string()
});

const UpdateThreadRequestSchema = z.object({
  threadId: z.string(),
  title: z.string(),
  metadata: z
    .object({
      lastUsage: z.custom<LanguageModelUsage>().optional(),
      mode: z.enum(AgentMode).optional()
    })
    .optional()
});

const CompactThreadRequestSchema = z.object({
  threadId: z.string(),
  resourceId: z.string()
});

const ResumeTurnRequestSchema = z.object({
  threadId: z.string(),
  runId: z.string(),
  toolCallId: z.string(),
  suspendType: SuspendTypeSchema,
  resumeData: z.record(z.string(), z.unknown()).optional()
});

const ResumeTaskRequestSchema = z.object({
  threadId: z.string(),
  taskId: z.string(),
  suspendType: SuspendTypeSchema,
  resumeData: z.record(z.string(), z.unknown()).optional()
});

/** 版本回退：定位到具体大屏版本目录 screen_{resourceId}_{versionCode} */
const VersionListRequestSchema = z.object({
  resourceId: z.string(),
  versionCode: z.union([z.string(), z.number()])
});

const VersionRollbackRequestSchema = z.object({
  resourceId: z.string(),
  versionCode: z.union([z.string(), z.number()]),
  commit: z.string()
});

export const biChatRouter = new Hono()
  .post("/", zValidator("json", BiChatRequestSchema), (c) => {
    const body = c.req.valid("json");
    if (!body.threadId || !body.resourceId) {
      return c.json({ error: "ThreadId or ResourceId is missing" }, 400);
    }
    // requestSignal = 举着 outer 流的初始连接，断连 → 拆会话
    return createUIMessageStreamResponse({ stream: handleBiChat(body, c.req.raw.signal) });
  })
  // resume 控制端点：只触发、不消费流——把 resume 轮灌进已存在的会话流，返回 ack
  .post("/resume", zValidator("json", ResumeTurnRequestSchema), (c) => {
    return c.json(handleBiChatResume(c.req.valid("json")));
  })
  // resume 后台任务控制端点：先 attach 遥测再 resume，返回 ack
  .post("/resume-task", zValidator("json", ResumeTaskRequestSchema), async (c) => {
    return c.json(await handleBiChatResumeTask(c.req.valid("json")));
  })
  .post("/generate-title", zValidator("json", TitleGenerationRequestSchema), async (c) => {
    return handleGenerateTitle(c.req.valid("json"));
  })
  .post("/thread-messages", zValidator("json", ListThreadMessagesRequestSchema), async (c) => {
    try {
      const { threadId, resourceId, page, perPage } = c.req.valid("json");
      const result = await handleListThreadMessages(threadId, resourceId, page ?? 0, perPage ?? 10);
      return c.json(result);
    } catch (e) {
      if (e instanceof Error && e.message.includes("not found")) {
        throw new HTTPException(404, { message: e.message });
      }
      console.error("[list-thread-messages] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "获取消息失败" });
    }
  })
  .post("/create-thread", zValidator("json", CreateThreadRequestSchema), async (c) => {
    try {
      const { resourceId, title, metadata } = c.req.valid("json");
      const thread = await handleCreateThread(resourceId, title, metadata);
      return c.json(thread);
    } catch (e) {
      console.error("[create-thread] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "创建线程失败" });
    }
  })
  .post("/list-threads", zValidator("json", ListThreadsRequestSchema), async (c) => {
    try {
      const { resourceId } = c.req.valid("json");
      const result = await handleListThreads(resourceId);
      return c.json(result);
    } catch (e) {
      console.error("[list-threads] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "获取线程列表失败" });
    }
  })
  .post("/update-thread", zValidator("json", UpdateThreadRequestSchema), async (c) => {
    try {
      const { threadId, title, metadata } = c.req.valid("json");
      const updated = await handleUpdateThread(threadId, title, metadata ?? {});
      return c.json(updated);
    } catch (e) {
      if (e instanceof Error && e.message.includes("not found")) {
        throw new HTTPException(404, { message: e.message });
      }
      console.error("[update-thread] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "更新线程失败" });
    }
  })
  .post("/compact-thread", zValidator("json", CompactThreadRequestSchema), async (c) => {
    try {
      const { threadId, resourceId } = c.req.valid("json");
      const result = await handleCompactThread(threadId, resourceId);
      return c.json(result);
    } catch (e) {
      console.error("[compact-thread] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "压缩失败" });
    }
  })
  // 列出某大屏版本的回退节点（一次提问 = 一个节点）
  .post("/version/list", zValidator("json", VersionListRequestSchema), async (c) => {
    try {
      const { resourceId, versionCode } = c.req.valid("json");
      const nodes = await listNodes(buildScreenVersionKey(resourceId, versionCode));
      return c.json({ nodes });
    } catch (e) {
      console.error("[version/list] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "获取回退节点失败" });
    }
  })
  // 回退预览：回退到目标节点会更新哪些文件（相对当前状态）
  .post("/version/preview", zValidator("json", VersionRollbackRequestSchema), async (c) => {
    try {
      const { resourceId, versionCode, commit } = c.req.valid("json");
      const files = await getRollbackPreview(buildScreenVersionKey(resourceId, versionCode), commit);
      return c.json({ files });
    } catch (e) {
      console.error("[version/preview] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "获取回退预览失败" });
    }
  })
  // 回退计划：把「工作区 → 目标节点」的三类差异翻译成前端可执行的有序操作
  .post("/version/rollback-plan", zValidator("json", VersionRollbackRequestSchema), async (c) => {
    try {
      const { resourceId, versionCode, commit } = c.req.valid("json");
      const plan = await buildRollbackPlan(buildScreenVersionKey(resourceId, versionCode), commit);
      return c.json(plan);
    } catch (e) {
      console.error("[version/rollback-plan] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "生成回退计划失败" });
    }
  })
  // 硬回退到指定节点（丢弃其后所有改动）
  .post("/version/rollback", zValidator("json", VersionRollbackRequestSchema), async (c) => {
    try {
      const { resourceId, versionCode, commit } = c.req.valid("json");
      await rollback(buildScreenVersionKey(resourceId, versionCode), commit);
      return c.json({ ok: true });
    } catch (e) {
      console.error("[version/rollback] error:", e);
      throw new HTTPException(500, { message: e instanceof Error ? e.message : "回退失败" });
    }
  });
