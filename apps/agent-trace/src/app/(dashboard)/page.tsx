import type { LlmExchangeRecord, ParsedLlmExchangeContent, ThreadFileTree } from "@screenwright/server/rpc";

import { SessionsView } from "@/components/sessions/sessions-view";

import {
  allStepObjectKeys,
  buildFullToolResults,
  fetchObjectContent,
  fetchThreadRecords,
  fetchThreads,
  fetchThreadTree,
  findTurn,
  isClearedResultContent,
  latestTurnName,
  resolveObjectLabel,
  type ThreadsPage
} from "./data";

export const dynamic = "force-dynamic";

export default async function SessionsPage({
  searchParams
}: {
  searchParams: Promise<{ thread?: string; turn?: string; object?: string; evalRun?: string }>;
}) {
  const { thread: threadParam, turn: turnParam, object: objectParam, evalRun: evalRunParam } = await searchParams;

  let threads: ThreadsPage | null = null;
  let error: string | null = null;

  try {
    // 带 evalRun 就切到那一批 eval 的会话域——eval 的 thread 不在真实会话列表里，
    // 不切的话左侧没有它的列表项，也就没有文件树可点（只剩右侧一段对话）。
    threads = await fetchThreads(1, 100, evalRunParam);
  } catch (err) {
    error = err instanceof Error ? err.message : "加载会话列表失败，请确认 Screenwright 已启动";
  }

  // 选中的会话：优先取 URL，其次回退到列表首项。
  const selectedThreadId = threadParam ?? threads?.items[0]?.threadId ?? null;

  let tree: ThreadFileTree | null = null;
  let records: LlmExchangeRecord[] = [];
  if (selectedThreadId) {
    // records 是无条件拉的：执行泳道要靠每行的 branchKey / step / token 画，
    // 而泳道在会话级视图（没有 turn / object 参数）下同样要显示。一次 findMany,行数=step 数。
    const [treeResult, recordsResult] = await Promise.allSettled([
      fetchThreadTree(selectedThreadId),
      fetchThreadRecords(selectedThreadId)
    ]);
    if (treeResult.status === "fulfilled") {
      tree = treeResult.value;
    }
    if (recordsResult.status === "fulfilled") {
      records = recordsResult.value;
    }
  }

  // 视图模式：
  // - object 指定 → 单步原始视图（调试用）。
  // - turn 指定 → 整轮合并对话视图。
  // - 两者均未指定 → 会话级选中，使用最新 step 重建完整对话。
  const singleStepMode = Boolean(objectParam);
  const usageScope = singleStepMode ? "step" : turnParam ? "turn" : "thread";
  const selectedTurn = singleStepMode ? null : (turnParam ?? latestTurnName(tree));

  let parsedContent: ParsedLlmExchangeContent | null = null;
  let rawContent: unknown = null;
  let transcript: ParsedLlmExchangeContent | null = null;
  let resultOverrides: Record<string, string> = {};
  let selectedLabel = "";

  if (singleStepMode && objectParam) {
    // 单步原始视图：按 objectKey 拉取该 step 文件内容（忠实还原该次请求，压缩即压缩）。
    selectedLabel = resolveObjectLabel(selectedThreadId ?? "", tree, objectParam);
    try {
      const data = await fetchObjectContent(objectParam);
      parsedContent = data.parsed;
      rawContent = data.content;
    } catch (err) {
      rawContent = err instanceof Error ? err.message : "加载 MinIO 内容失败";
    }
  } else if (selectedTurn) {
    // 合并对话视图：以该轮最后一个 step 为骨架（其 messages 已是整轮完整历史）。
    const stepKeys = allStepObjectKeys(findTurn(tree, selectedTurn));
    if (stepKeys.length > 0) {
      selectedLabel =
        usageScope === "thread"
          ? `${selectedThreadId ?? ""} · 完整对话`
          : `${selectedThreadId ?? ""} / ${selectedTurn} · 合并对话`;
      try {
        const data = await fetchObjectContent(stepKeys[stepKeys.length - 1]);
        transcript = data.parsed;
        // 对话级视图要显示完整工具结构：末 step 若含被 compaction 清除的旧结果，
        // 从更早 step 还原未压缩原文（无压缩则跳过，省去全量拉取）。
        const hasCleared = transcript.messages.some(
          (message) => message.role === "tool" && isClearedResultContent(message.content)
        );
        if (hasCleared && stepKeys.length > 1) {
          resultOverrides = await buildFullToolResults(stepKeys.slice(0, -1));
        }
      } catch {
        // 该轮内容加载失败：视图展示空态提示，不阻塞列表。
      }
    }
  } else if (selectedThreadId) {
    selectedLabel = selectedThreadId;
  }

  return (
    <SessionsView
      threads={threads?.items ?? []}
      evalRunId={evalRunParam ?? null}
      error={error}
      selectedThreadId={selectedThreadId}
      tree={tree}
      records={records}
      selectedTurn={selectedTurn}
      usageScope={usageScope}
      selectedObjectKey={objectParam ?? null}
      selectedLabel={selectedLabel}
      parsedContent={parsedContent}
      rawContent={rawContent}
      transcript={transcript}
      resultOverrides={resultOverrides}
    />
  );
}
