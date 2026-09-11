import { HTTPException } from "hono/http-exception";

import { recordStore } from "@/lib/storage";
import { parseLlmExchangeContent } from "@/mastra/services/llm-exchange-content";
import { prismaClient } from "@/mastra/storage/prisma";
import { memory } from "@/mastra/storage/storage";
import type { LlmExchangeRecord } from "@/mastra/types/llm-exchange";
import { LlmExchangeRecordSchema, ParsedLlmExchangeContentSchema } from "@/mastra/types/llm-exchange";
import { joinKey, RECORD_PREFIX } from "@/recording/record-sink";

const ok = <T>(data: T) => ({ code: 200 as const, message: "ok", data });

/** 仅供展示用的桶名标签；纯 fs 部署下为空串。逐条记录的桶名以 `record.bucket` 为准。 */
const RECORD_BUCKET_LABEL = process.env.MINIO_BUCKET || "";

function serializeRecord(record: {
  id: string;
  threadId: string;
  runId: string | null;
  turnIndex: number;
  step: number;
  url: string | null;
  model: string | null;
  status: number | null;
  ok: boolean | null;
  toolNames: unknown; // SQLite 下为 Json（string[]）
  toolCallCount: number;
  at: Date | null;
  generationTimeMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  cachedPromptTokens: number | null;
  reasoningTokens: number | null;
  bucket: string;
  branchKey: string | null;
  evalRunId: string | null;
  objectKey: string;
  createdAt: Date;
  updatedAt: Date;
}): LlmExchangeRecord {
  return LlmExchangeRecordSchema.parse({
    id: record.id,
    threadId: record.threadId,
    runId: record.runId,
    turnIndex: record.turnIndex,
    step: record.step,
    url: record.url,
    model: record.model,
    status: record.status,
    ok: record.ok,
    toolNames: Array.isArray(record.toolNames) ? record.toolNames : [],
    toolCallCount: record.toolCallCount,
    at: record.at?.toISOString() ?? null,
    generationTimeMs: record.generationTimeMs,
    promptTokens: record.promptTokens,
    completionTokens: record.completionTokens,
    totalTokens: record.totalTokens,
    cachedPromptTokens: record.cachedPromptTokens,
    reasoningTokens: record.reasoningTokens,
    bucket: record.bucket,
    branchKey: record.branchKey,
    evalRunId: record.evalRunId,
    objectKey: record.objectKey,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  });
}

/**
 * 会话列表。
 *
 * `evalRunId` 把这个列表切成互不重叠的两域：不传是**真实用户会话**（`evalRunId is null`），
 * 传一个批次号是那一批 eval 跑出来的会话。没有「全都要」这个选项是故意的——两者混在一起
 * 谁也不想看，而且 eval 一跑就是十几条，很快会把真实会话挤下去。
 */
export async function listLlmExchangeThreads(page = 1, pageSize = 20, evalRunId?: string) {
  const where = { evalRunId: evalRunId ?? null };
  const groups = await prismaClient.llmExchangeRecord.groupBy({
    where,
    by: ["threadId"],
    _count: { _all: true },
    _max: { at: true, updatedAt: true, createdAt: true },
    _min: { createdAt: true },
    _sum: {
      generationTimeMs: true,
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      cachedPromptTokens: true,
      reasoningTokens: true
    }
  });

  groups.sort((a, b) => {
    const aTime = a._max.updatedAt?.getTime() ?? 0;
    const bTime = b._max.updatedAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  const total = groups.length;
  const start = (page - 1) * pageSize;
  const slice = groups.slice(start, start + pageSize);

  const items = await Promise.all(
    slice.map(async (group) => {
      const [latest, thread] = await Promise.all([
        prismaClient.llmExchangeRecord.findFirst({
          where: { threadId: group.threadId },
          orderBy: [{ turnIndex: "desc" }, { step: "desc" }]
        }),
        // 标题由 mastra memory 维护（title-agent 生成后写回 thread）；MinIO 记录里没有，需按需取。
        memory.getThreadById({ threadId: group.threadId }).catch(() => null)
      ]);

      return {
        threadId: group.threadId,
        title: thread?.title ?? null,
        exchangeCount: group._count._all,
        firstAt: group._min.createdAt?.toISOString() ?? null,
        lastAt: group._max.at?.toISOString() ?? group._max.updatedAt?.toISOString() ?? null,
        latestModel: latest?.model ?? null,
        latestOk: latest?.ok ?? null,
        branchKey: latest?.branchKey ?? null,
        evalRunId: latest?.evalRunId ?? null,
        generationTimeMs: group._sum.generationTimeMs,
        promptTokens: group._sum.promptTokens,
        completionTokens: group._sum.completionTokens,
        totalTokens: group._sum.totalTokens,
        cachedPromptTokens: group._sum.cachedPromptTokens,
        reasoningTokens: group._sum.reasoningTokens
      };
    })
  );

  return ok({ items, total, page, pageSize, evalRunId: evalRunId ?? null });
}

export async function listLlmExchangesByThread(threadId: string) {
  if (!threadId) {
    throw new HTTPException(400, { message: "threadId is required" });
  }

  const records = await prismaClient.llmExchangeRecord.findMany({
    where: { threadId },
    orderBy: [{ turnIndex: "asc" }, { step: "asc" }]
  });

  return ok({
    threadId,
    items: records.map(serializeRecord)
  });
}

/**
 * 反推一个 thread 的存储前缀。
 *
 * 前缀是**每条记录的属性**，不是进程的属性：eval 走 `eval-records`，线上走 `llm-records`，
 * 同一个库里两种并存。拿模块级的 `RECORD_PREFIX` 去拼，另一个前缀下的 thread 会拼出一个
 * 不存在的 key，返回一棵空树——不报错，只是什么都看不到。所以从已有记录行的 `objectKey`
 * 里把前缀切出来。
 *
 * 索引里没有这个 thread（还没入库）时退回全局默认前缀。
 */
async function resolveThreadPrefix(threadId: string): Promise<string> {
  const record = await prismaClient.llmExchangeRecord.findFirst({
    where: { threadId },
    select: { objectKey: true }
  });
  if (!record) {
    return RECORD_PREFIX;
  }
  // objectKey 形如 "<prefix>/<threadId>/turn_00/step_00.json"；前缀为空时它就以 threadId 打头
  const at = record.objectKey.lastIndexOf(`${threadId}/`);
  return at <= 0 ? "" : record.objectKey.slice(0, at - 1);
}

export async function getThreadFileTree(threadId: string) {
  if (!threadId) {
    throw new HTTPException(400, { message: "threadId is required" });
  }

  const prefix = await resolveThreadPrefix(threadId);
  const objectKeyOf = (key: string) => joinKey(prefix, key);

  const { dirs: turns } = await recordStore().list(objectKeyOf(threadId));
  const sortedTurns = turns.filter((name) => /^turn_\d+$/.test(name)).sort();

  const turnNodes = await Promise.all(
    sortedTurns.map(async (turn) => {
      const turnKey = joinKey(threadId, turn);
      const { files } = await recordStore().list(objectKeyOf(turnKey));
      const jsonFiles = files
        .filter((file) => file.endsWith(".json"))
        .sort()
        .map((file) => ({
          name: file,
          objectKey: objectKeyOf(joinKey(turnKey, file))
        }));

      return {
        name: turn,
        path: turnKey,
        files: jsonFiles
      };
    })
  );

  return ok({
    threadId,
    bucket: RECORD_BUCKET_LABEL,
    prefix: objectKeyOf(threadId),
    rootLabel: joinKey(RECORD_BUCKET_LABEL, prefix, threadId).replace(/\//gu, " / "),
    turns: turnNodes
  });
}

function parseObjectContent(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export async function getContentByObjectKey(objectKey: string) {
  if (!objectKey) {
    throw new HTTPException(400, { message: "objectKey is required" });
  }

  const raw = await recordStore().getText(objectKey);
  const content = parseObjectContent(raw);

  return ok({
    bucket: RECORD_BUCKET_LABEL,
    objectKey,
    content,
    parsed: ParsedLlmExchangeContentSchema.parse(
      await parseLlmExchangeContent(content, { bucket: RECORD_BUCKET_LABEL, objectKey })
    )
  });
}

export async function getLlmExchangeContent(id: string) {
  const record = await prismaClient.llmExchangeRecord.findUnique({ where: { id } });
  if (!record) {
    throw new HTTPException(404, { message: "Exchange record not found" });
  }

  const raw = await recordStore().getText(record.objectKey);
  const content = parseObjectContent(raw);

  return ok({
    record: serializeRecord(record),
    content,
    parsed: ParsedLlmExchangeContentSchema.parse(
      await parseLlmExchangeContent(content, {
        bucket: record.bucket,
        objectKey: record.objectKey
      })
    )
  });
}
