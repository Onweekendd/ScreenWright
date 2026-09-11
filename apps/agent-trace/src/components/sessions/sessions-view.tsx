"use client";

import { useMemo } from "react";

import type {
  LlmExchangeRecord,
  LlmExchangeThreadSummary,
  ParsedLlmExchangeContent,
  ThreadFileTree
} from "@screenwright/server/rpc";
import {
  ChevronDown,
  ChevronRight,
  Clock3,
  Coins,
  FileJson,
  FlaskConical,
  Folder,
  FolderOpen,
  Loader2,
  RefreshCw
} from "lucide-react";
import Link from "next/link";

import { ExchangeContentPanel } from "@/components/sessions/exchange-content-panel";
import { TurnGraphPanel } from "@/components/sessions/turn-graph";
import { TurnTranscript } from "@/components/sessions/turn-transcript";
import { useSessionsView } from "@/components/sessions/use-sessions-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildTurnGraphs } from "@/lib/turn-graph";
import { cn, formatDateTime, formatDuration, formatTokenCount } from "@/lib/utils";

/**
 * 会话浏览页展示组件：数据全部由服务端组件（sessions/page.tsx）经 props 注入，
 * 交互（选中会话/轮次/文件、刷新、折叠）委托给 useSessionsView（URL 查询参数驱动）。
 *
 * 内容区三种模式：
 * - 仅选中会话 → 使用最新 step 重建完整对话，顶部展示会话汇总。
 * - 选中某个 step 文件（selectedObjectKey）→ 单步原始视图（ExchangeContentPanel）。
 * - 选中 turn → 展示整轮合并对话（TurnTranscript）。
 */
interface UsageSummary {
  generationTimeMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
}

type UsageScope = "thread" | "turn" | "step";

function sumNullable(values: Array<number | null>): number | null {
  const presentValues = values.filter((value): value is number => value !== null);
  return presentValues.length > 0 ? presentValues.reduce((total, value) => total + value, 0) : null;
}

function summarizeRecords(records: LlmExchangeRecord[]): UsageSummary | null {
  if (records.length === 0) {
    return null;
  }
  return {
    generationTimeMs: sumNullable(records.map((record) => record.generationTimeMs)),
    promptTokens: sumNullable(records.map((record) => record.promptTokens)),
    completionTokens: sumNullable(records.map((record) => record.completionTokens)),
    totalTokens: sumNullable(records.map((record) => record.totalTokens))
  };
}

export function SessionsView({
  threads,
  evalRunId,
  error,
  selectedThreadId,
  tree,
  records,
  selectedTurn,
  usageScope,
  selectedObjectKey,
  selectedLabel,
  parsedContent,
  rawContent,
  transcript,
  resultOverrides
}: {
  threads: LlmExchangeThreadSummary[];
  /** 非 null 表示正在看某一批 eval 的会话域，而不是真实用户会话 */
  evalRunId: string | null;
  error: string | null;
  selectedThreadId: string | null;
  tree: ThreadFileTree | null;
  records: LlmExchangeRecord[];
  selectedTurn: string | null;
  usageScope: UsageScope;
  selectedObjectKey: string | null;
  selectedLabel: string;
  parsedContent: ParsedLlmExchangeContent | null;
  rawContent: unknown;
  transcript: ParsedLlmExchangeContent | null;
  resultOverrides: Record<string, string>;
}) {
  const { isPending, selectThread, selectTurn, selectObject, refresh, toggleTurn, isTurnExpanded } = useSessionsView();

  const singleStepMode = selectedObjectKey !== null;
  const contentLoading = isPending && singleStepMode;
  const selectedThread = threads.find((thread) => thread.threadId === selectedThreadId);
  const selectedStepRecord = singleStepMode
    ? records.find((record) => record.objectKey === selectedObjectKey)
    : undefined;
  const selectedTurnNode = selectedTurn ? tree?.turns.find((turn) => turn.name === selectedTurn) : undefined;
  const selectedTurnObjectKeys = new Set(selectedTurnNode?.files.map((file) => file.objectKey) ?? []);
  const selectedTurnUsage =
    usageScope === "turn" && selectedTurn
      ? summarizeRecords(records.filter((record) => selectedTurnObjectKeys.has(record.objectKey)))
      : null;
  const selectedUsage: UsageSummary | null =
    usageScope === "step"
      ? (selectedStepRecord ?? null)
      : usageScope === "turn"
        ? selectedTurnUsage
        : (selectedThread ?? null);
  const usageScopeLabel = usageScope === "step" ? "Step" : usageScope === "turn" ? "Turn" : "会话";

  // 泳道按轮次画。单步模式下 selectedTurn 为 null,改用该 step 所属轮次——
  // 否则点开一个 step 图就没了,而这张图恰恰是用来在 step 之间跳的。
  const graphTurnName =
    selectedTurn ??
    (selectedObjectKey ? (/turn_\d+/u.exec(selectedObjectKey)?.[0] ?? null) : null) ??
    tree?.turns[tree.turns.length - 1]?.name ??
    null;
  const turnGraph = useMemo(() => {
    if (!selectedThreadId || !graphTurnName) {
      return null;
    }
    return buildTurnGraphs(records, selectedThreadId).find((g) => g.turnName === graphTurnName) ?? null;
  }, [records, selectedThreadId, graphTurnName]);

  return (
    <Card className="flex h-[calc(100vh-7rem)] flex-col shadow-none">
      <CardHeader className="flex shrink-0 flex-col gap-3 border-b pb-4">
        <div className="flex flex-row items-center justify-between gap-4">
          <CardTitle>会话记录</CardTitle>
          <Button variant="outline" size="sm" disabled={isPending} onClick={refresh}>
            <RefreshCw className={cn("size-4", isPending && "animate-spin")} />
            刷新
          </Button>
        </div>
        {error && (
          <div className="border-destructive/20 bg-destructive/5 text-destructive rounded-lg border px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 gap-0 p-0">
        <aside className="bg-muted/10 flex w-80 shrink-0 flex-col border-r">
          <div className="text-muted-foreground border-b px-4 py-3 text-xs font-medium">
            {evalRunId ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <FlaskConical className="size-3 shrink-0" />
                  <span>评估批次的会话</span>
                </div>
                <span className="font-mono text-[11px] break-all">{evalRunId}</span>
                <Link href="/sessions" className="text-primary hover:underline">
                  ← 回到真实用户会话
                </Link>
              </div>
            ) : (
              "会话列表"
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {threads.length === 0 ? (
              <p className="text-muted-foreground px-2 py-4 text-sm">
                {evalRunId ? "这一批 eval 没有会话记录" : "暂无会话记录"}
              </p>
            ) : (
              <div className="space-y-1">
                {threads.map((thread) => {
                  const selected = selectedThreadId === thread.threadId;
                  const threadTree = selected ? tree : null;
                  const isTreeLoading = selected && isPending && !tree;
                  const title = thread.title && thread.title !== "新对话" ? thread.title : null;

                  return (
                    <div key={thread.threadId}>
                      <button
                        type="button"
                        onClick={() => selectThread(thread.threadId)}
                        className={cn(
                          "hover:bg-muted/50 active:bg-muted/70 flex w-full cursor-pointer items-start gap-2 rounded-lg px-2 py-2 text-left transition-colors",
                          selected && "bg-primary/10 ring-primary/20 ring-1"
                        )}
                      >
                        {selected ? (
                          <FolderOpen className="mt-0.5 size-4 shrink-0 text-amber-500" />
                        ) : (
                          <Folder className="mt-0.5 size-4 shrink-0 text-amber-500" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{title ?? thread.threadId}</p>
                          <p className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
                            {title ? thread.threadId : `${thread.exchangeCount} 步`}
                          </p>
                          <p className="text-muted-foreground mt-0.5 text-[11px]">
                            {thread.exchangeCount} 步 · {formatDateTime(thread.lastAt)}
                          </p>
                          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-[11px]">
                            <Clock3 className="size-3 shrink-0" />
                            <span>{formatDuration(thread.generationTimeMs)}</span>
                            <span>·</span>
                            <Coins className="size-3 shrink-0" />
                            <span>{formatTokenCount(thread.totalTokens)} Token</span>
                          </p>
                        </div>
                      </button>

                      {selected && (
                        <div className="mt-1 ml-3 border-l pl-2">
                          {isTreeLoading && (
                            <p className="text-muted-foreground flex items-center gap-2 px-2 py-2 text-xs">
                              <Loader2 className="size-3.5 animate-spin" />
                              加载 turn 目录中...
                            </p>
                          )}

                          {threadTree?.turns.map((turn) => {
                            const turnKey = `${thread.threadId}/${turn.name}`;
                            const turnExpanded = isTurnExpanded(turnKey);
                            const turnSelected = usageScope === "turn" && selectedTurn === turn.name && !singleStepMode;

                            return (
                              <div key={turnKey} className="mb-1">
                                <div
                                  className={cn(
                                    "flex items-center rounded-md pr-2",
                                    turnSelected && "bg-primary/10 text-primary"
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => toggleTurn(turnKey)}
                                    className="hover:bg-muted/40 cursor-pointer rounded-md p-1.5"
                                    aria-label={turnExpanded ? "折叠" : "展开"}
                                  >
                                    {turnExpanded ? (
                                      <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
                                    ) : (
                                      <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => selectTurn(turn.name)}
                                    className="flex flex-1 cursor-pointer items-center gap-2 py-1.5 text-left text-sm"
                                  >
                                    <Folder className="size-3.5 shrink-0 text-sky-500" />
                                    <span>{turn.name}</span>
                                    <span className="text-muted-foreground ml-auto text-[11px]">
                                      {turn.files.length}
                                    </span>
                                  </button>
                                </div>

                                {turnExpanded && (
                                  <div className="ml-5 space-y-0.5">
                                    {turn.files.map((file) => {
                                      const active = selectedObjectKey === file.objectKey;
                                      return (
                                        <button
                                          key={file.objectKey}
                                          type="button"
                                          onClick={() => selectObject(file.objectKey)}
                                          className={cn(
                                            "hover:bg-muted/40 active:bg-muted/60 flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                                            active && "bg-primary/10 text-primary"
                                          )}
                                        >
                                          <FileJson className="size-3.5 shrink-0" />
                                          <span className="truncate">{file.name}</span>
                                        </button>
                                      );
                                    })}
                                    {turn.files.length === 0 && (
                                      <p className="text-muted-foreground px-2 py-1 text-xs">空目录</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {threadTree && threadTree.turns.length === 0 && !isTreeLoading && (
                            <p className="text-muted-foreground px-2 py-2 text-xs">MinIO 中暂无 turn 目录</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          {selectedLabel && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-5 py-3">
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{selectedLabel}</p>
              {isPending && <Loader2 className="text-muted-foreground size-3.5 animate-spin" />}
              {selectedUsage && (
                <div className="text-muted-foreground flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock3 className="size-3.5" />
                    {usageScopeLabel}耗时 {formatDuration(selectedUsage.generationTimeMs)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Coins className="size-3.5" />
                    {usageScopeLabel} Token {formatTokenCount(selectedUsage.totalTokens)}
                    <span className="hidden xl:inline">
                      （输入 {formatTokenCount(selectedUsage.promptTokens)} / 输出{" "}
                      {formatTokenCount(selectedUsage.completionTokens)}）
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {turnGraph && (
              <TurnGraphPanel graph={turnGraph} selectedObjectKey={selectedObjectKey} onSelectStep={selectObject} />
            )}
            {singleStepMode ? (
              <ExchangeContentPanel parsed={parsedContent} rawContent={rawContent} loading={contentLoading} />
            ) : transcript ? (
              <TurnTranscript
                key={`${selectedThreadId}/${selectedTurn}`}
                parsed={transcript}
                resultOverrides={resultOverrides}
              />
            ) : (
              <p className="text-muted-foreground text-sm">
                选择左侧任一轮次查看合并对话，或展开后点击单个 step 查看原始记录
              </p>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
