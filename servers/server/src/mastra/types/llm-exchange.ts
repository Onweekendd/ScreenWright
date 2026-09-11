import { z } from "zod";

export const LlmExchangeRecordSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  runId: z.string().nullable(),
  turnIndex: z.number(),
  step: z.number(),
  url: z.string().nullable(),
  model: z.string().nullable(),
  status: z.number().nullable(),
  ok: z.boolean().nullable(),
  toolNames: z.array(z.string()),
  toolCallCount: z.number(),
  at: z.string().nullable(),
  generationTimeMs: z.number().nullable(),
  promptTokens: z.number().nullable(),
  completionTokens: z.number().nullable(),
  totalTokens: z.number().nullable(),
  cachedPromptTokens: z.number().nullable(),
  reasoningTokens: z.number().nullable(),
  bucket: z.string(),
  branchKey: z.string().nullable(),
  evalRunId: z.string().nullable(),
  objectKey: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const LlmExchangeThreadSummarySchema = z.object({
  threadId: z.string(),
  title: z.string().nullable(),
  exchangeCount: z.number(),
  firstAt: z.string().nullable(),
  lastAt: z.string().nullable(),
  latestModel: z.string().nullable(),
  latestOk: z.boolean().nullable(),
  branchKey: z.string().nullable(),
  /** 非 null 即这条会话来自某一批 eval，不是真实用户跑出来的 */
  evalRunId: z.string().nullable(),
  generationTimeMs: z.number().nullable(),
  promptTokens: z.number().nullable(),
  completionTokens: z.number().nullable(),
  totalTokens: z.number().nullable(),
  cachedPromptTokens: z.number().nullable(),
  reasoningTokens: z.number().nullable()
});

export const ListLlmExchangeThreadsResponseSchema = z.object({
  code: z.literal(200),
  message: z.string(),
  data: z.object({
    items: z.array(LlmExchangeThreadSummarySchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    /** 本次列的是哪一域：null = 真实用户会话，否则是该批次的 eval 会话 */
    evalRunId: z.string().nullable()
  })
});

export const ListLlmExchangesByThreadResponseSchema = z.object({
  code: z.literal(200),
  message: z.string(),
  data: z.object({
    threadId: z.string(),
    items: z.array(LlmExchangeRecordSchema)
  })
});

export const ParsedExchangeMessageSchema = z.object({
  role: z.string(),
  content: z.string(),
  toolCalls: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().optional(),
      arguments: z.string().optional()
    })
  ),
  toolCallId: z.string().optional()
});

export const ParsedLlmExchangeContentSchema = z.object({
  meta: z.object({
    step: z.number().nullable(),
    at: z.string().nullable(),
    threadId: z.string().nullable(),
    runId: z.string().nullable(),
    url: z.string().nullable(),
    status: z.number().nullable(),
    ok: z.boolean().nullable(),
    model: z.string().nullable(),
    objectKey: z.string(),
    bucket: z.string()
  }),
  messages: z.array(ParsedExchangeMessageSchema),
  toolDefinitions: z.array(z.unknown()),
  toolTokenUsage: z.object({
    total: z.number(),
    byTool: z.array(z.number()),
    estimated: z.boolean(),
    tokenizer: z.string().nullable()
  }),
  messageTokenUsage: z.object({
    total: z.number(),
    byMessage: z.array(z.number()),
    finalOutput: z.number().nullable(),
    estimated: z.boolean(),
    tokenizer: z.string().nullable()
  }),
  summary: z
    .object({
      reasoning: z.string(),
      text: z.string(),
      toolCalls: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          arguments: z.string()
        })
      )
    })
    .nullable(),
  responseText: z.string().nullable()
});

export type ParsedExchangeMessage = z.infer<typeof ParsedExchangeMessageSchema>;
export type ParsedLlmExchangeContent = z.infer<typeof ParsedLlmExchangeContentSchema>;

/** MinIO 中单个 LLM 交换记录文件（turn 目录下的 .json）。 */
export interface ThreadFileTreeFile {
  name: string;
  objectKey: string;
}

/** 单个 turn 目录及其包含的文件列表。 */
export interface ThreadFileTreeTurn {
  name: string;
  path: string;
  files: ThreadFileTreeFile[];
}

/** 某个 thread 在 MinIO 中的目录树（turn 目录 + 文件）。 */
export interface ThreadFileTree {
  threadId: string;
  bucket: string;
  prefix: string;
  rootLabel: string;
  turns: ThreadFileTreeTurn[];
}

export const LlmExchangeContentResponseSchema = z.object({
  code: z.literal(200),
  message: z.string(),
  data: z.object({
    record: LlmExchangeRecordSchema,
    content: z.unknown(),
    parsed: ParsedLlmExchangeContentSchema
  })
});

export const LlmExchangeErrorSchema = z.object({
  code: z.number(),
  message: z.string()
});

export type LlmExchangeRecord = z.infer<typeof LlmExchangeRecordSchema>;
export type LlmExchangeThreadSummary = z.infer<typeof LlmExchangeThreadSummarySchema>;
