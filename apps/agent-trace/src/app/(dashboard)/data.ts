import type {
  LlmExchangeRecord,
  LlmExchangeThreadSummary,
  ParsedLlmExchangeContent,
  ThreadFileTree,
  ThreadFileTreeTurn
} from "@screenwright/server/rpc";

import { serverRpc } from "@/lib/server-rpc";

import "server-only";

export interface ThreadsPage {
  items: LlmExchangeThreadSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ObjectContent {
  bucket: string;
  objectKey: string;
  content: unknown;
  parsed: ParsedLlmExchangeContent;
}

/**
 * 通过 Screenwright RPC 拉取会话（thread）分页列表。仅在服务端组件中调用。
 *
 * `evalRunId` 把列表切成互不重叠的两域（见 `llm-exchange.server.ts:70`）：不传是真实用户
 * 会话，传了是那一批 eval 的会话。**必须显式传**才看得到 eval——文件树是嵌在列表项里渲染的
 * （`sessions-view.tsx:134`），thread 不在列表里就没有渲染树的位置，右侧只剩一段孤零零的
 * 对话，点不进单步原始视图。
 */
export async function fetchThreads(page = 1, pageSize = 100, evalRunId?: string): Promise<ThreadsPage> {
  const res = await serverRpc.customApi["llm-exchanges"].threads.$get({
    query: { page: String(page), pageSize: String(pageSize), ...(evalRunId ? { evalRunId } : {}) }
  });
  if (!res.ok) {
    throw new Error(`加载会话列表失败 (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * 拉取指定 thread 在 MinIO 中的 turn/文件目录树。仅在服务端组件中调用。
 */
export async function fetchThreadTree(threadId: string): Promise<ThreadFileTree> {
  const res = await serverRpc.customApi["llm-exchanges"].threads[":threadId"].tree.$get({
    param: { threadId }
  });
  if (!res.ok) {
    throw new Error(`加载文件结构失败 (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * 拉取指定 thread 下全部 LLM step 记录，用于按会话、turn 或 step 汇总真实 usage。
 */
export async function fetchThreadRecords(threadId: string): Promise<LlmExchangeRecord[]> {
  const res = await serverRpc.customApi["llm-exchanges"].threads[":threadId"].$get({
    param: { threadId }
  });
  if (!res.ok) {
    throw new Error(`加载会话步骤记录失败 (${res.status})`);
  }
  const json = await res.json();
  return json.data.items;
}

/**
 * 按 objectKey 拉取 MinIO 中的单条 LLM 交换记录内容（含解析结果）。仅在服务端组件中调用。
 */
export async function fetchObjectContent(objectKey: string): Promise<ObjectContent> {
  const res = await serverRpc.customApi["llm-exchanges"].objects.content.$get({
    query: { objectKey }
  });
  if (!res.ok) {
    throw new Error(`加载 MinIO 内容失败 (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * 从文件树中反查 objectKey 对应的展示标签（`threadId/turn/file`）。
 */
export function resolveObjectLabel(threadId: string, tree: ThreadFileTree | null, objectKey: string): string {
  if (!tree) {
    return objectKey;
  }
  for (const turn of tree.turns) {
    const file = turn.files.find((item) => item.objectKey === objectKey);
    if (file) {
      return `${threadId}/${turn.name}/${file.name}`;
    }
  }
  return objectKey;
}

/** 按名称在文件树中定位某个 turn 目录。 */
export function findTurn(tree: ThreadFileTree | null, turnName: string | null): ThreadFileTreeTurn | null {
  if (!tree || !turnName) {
    return null;
  }
  return tree.turns.find((turn) => turn.name === turnName) ?? null;
}

/** 取文件树中最后（最新）一个 turn 的名称，用于重建会话的完整对话。 */
export function latestTurnName(tree: ThreadFileTree | null): string | null {
  if (!tree || tree.turns.length === 0) {
    return null;
  }
  return tree.turns[tree.turns.length - 1].name;
}

/**
 * 取某个 turn 内最后一个 `step_NN.json` 的 objectKey。
 *
 * 该文件的 request.messages 即整轮累积的完整历史（含所有工具调用与其结果），
 * 加上它的 summary 就是本轮最终输出——合并对话视图只需这一个文件即可重建整轮。
 * 文件名两位补零（step_00..step_99），字典序即步骤序，排除 ui_step_*。
 */
export function lastStepObjectKey(turn: ThreadFileTreeTurn | null): string | null {
  const keys = allStepObjectKeys(turn);
  return keys.length ? keys[keys.length - 1] : null;
}

/** 取某个 turn 内所有 `step_NN.json` 的 objectKey（按步骤序，排除 ui_step_*）。 */
export function allStepObjectKeys(turn: ThreadFileTreeTurn | null): string[] {
  if (!turn) {
    return [];
  }
  return turn.files
    .filter((file) => /^step_\d+\.json$/.test(file.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((file) => file.objectKey);
}

/** 工具结果内容是否为 compaction 清除占位（`{__cleared:true,...}` 的 JSON 字符串）。 */
export function isClearedResultContent(content: unknown): boolean {
  if (typeof content !== "string") {
    return false;
  }
  try {
    const obj = JSON.parse(content) as { __cleared?: boolean };
    return Boolean(obj && typeof obj === "object" && obj.__cleared);
  } catch {
    return false;
  }
}

/**
 * 重建该轮「未压缩」的工具结果映射（toolCallId → 完整结果文本）。
 *
 * 对话级视图要显示完整工具结构，但末 step 里的旧结果可能已被 compaction 清除。
 * 逐个扫描给定 step 文件，只收非清除结果——更早 step 保留着原文，据此还原被清除的结果。
 * 仅在末 step 确实含压缩时才需调用（拉取全部 step 有成本）。
 */
export async function buildFullToolResults(stepKeys: string[]): Promise<Record<string, string>> {
  const overrides: Record<string, string> = {};
  const parsedList = await Promise.all(stepKeys.map((key) => fetchObjectContent(key).catch(() => null)));
  for (const data of parsedList) {
    if (!data) {
      continue;
    }
    for (const message of data.parsed.messages) {
      if (message.role === "tool" && message.toolCallId && !isClearedResultContent(message.content)) {
        overrides[message.toolCallId] = message.content;
      }
    }
  }
  return overrides;
}
