"use client";

import { useMemo, useState } from "react";
import Markdown from "react-markdown";

import type { ParsedExchangeMessage, ParsedLlmExchangeContent } from "@screenwright/server/rpc";
import { Archive, Bot, ChevronDown, ChevronRight, User, Wrench } from "lucide-react";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { cn, formatDateTime, formatTokenCount } from "@/lib/utils";

type ToolCall = { id?: string; name?: string; arguments?: string };

/** 合并后用于渲染的一条消息（补：最终输出标记、时间线序号、所属轮次）。 */
type TranscriptMessage = ParsedExchangeMessage & { finalOutput?: boolean; tokenCount?: number };

/** 把 assistant 文本里内联的 `<think>…</think>` 拆成思考 + 正文两段。 */
function splitReasoning(content: string): { reasoning: string; text: string } {
  const match = content.match(/^<think>([\s\S]*?)<\/think>([\s\S]*)$/);
  if (match) {
    return { reasoning: match[1].trim(), text: match[2].trim() };
  }
  return { reasoning: "", text: content };
}

/** 工具结果内容若是 compaction 清除占位（`{__cleared:true,...}`），解析出占位文案。 */
function parseClearedResult(result: string | undefined): { cleared: boolean; placeholder?: string } {
  if (!result) {
    return { cleared: false };
  }
  try {
    const obj = JSON.parse(result) as { __cleared?: boolean; placeholder?: string };
    if (obj && typeof obj === "object" && obj.__cleared) {
      return { cleared: true, placeholder: obj.placeholder };
    }
  } catch {
    // 非 JSON 结果，按普通结果处理
  }
  return { cleared: false };
}

function Collapsible({
  title,
  defaultOpen = false,
  children,
  className
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs font-medium transition-colors"
      >
        {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        {title}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  return (
    <pre
      className={cn(
        "bg-muted/40 max-h-72 overflow-auto rounded-md p-2.5 text-xs leading-6 break-all whitespace-pre-wrap",
        className
      )}
    >
      {children}
    </pre>
  );
}

function AssistantMarkdown({ children }: { children: string }) {
  return (
    <div
      className={cn(
        "text-sm leading-6 wrap-break-word",
        "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
        "[&_h1]:mt-5 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h1:first-child]:mt-0",
        "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2:first-child]:mt-0",
        "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-semibold [&_h3:first-child]:mt-0",
        "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:my-1 [&_li>p]:my-0",
        "[&_blockquote]:text-muted-foreground [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_hr]:border-border [&_hr]:my-4",
        "[&_pre]:bg-muted/40 [&_pre]:my-2 [&_pre]:max-h-96 [&_pre]:overflow-auto [&_pre]:rounded-md [&_pre]:p-3",
        "[&_code]:bg-muted/50 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
        "[&_table]:my-2 [&_table]:block [&_table]:max-w-full [&_table]:border-collapse [&_table]:overflow-x-auto",
        "[&_th]:bg-muted/40 [&_th]:border [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left",
        "[&_td]:border [&_td]:px-2.5 [&_td]:py-1.5",
        "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md"
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]}>{children}</Markdown>
    </div>
  );
}

/** 单个工具调用卡片：入参 + 配对到的执行结果（就近内联）；结果被压缩时给出压缩占位。 */
function ToolCallCard({ call, result }: { call: ToolCall; result: string | undefined }) {
  const { cleared, placeholder } = parseClearedResult(result);
  return (
    <div className="bg-muted/30 rounded-md border p-2.5">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Wrench className="size-3.5 shrink-0 text-amber-500" />
        <span className="font-mono text-xs font-medium">{call.name ?? "unknown_tool"}</span>
      </div>
      <p className="text-muted-foreground mb-1 text-[11px]">入参</p>
      <CodeBlock className="max-h-48">{call.arguments || "{}"}</CodeBlock>
      <p className="text-muted-foreground mt-2 mb-1 text-[11px]">结果</p>
      {cleared ? (
        <div className="flex items-center gap-1.5 rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400">
          <Archive className="size-3.5 shrink-0" />
          <span>工具结果已被 compaction 压缩清除</span>
          {placeholder && <span className="text-muted-foreground truncate font-mono text-[11px]">{placeholder}</span>}
        </div>
      ) : result != null ? (
        <CodeBlock className="max-h-48">{result || "（空结果）"}</CodeBlock>
      ) : (
        <p className="text-muted-foreground text-xs italic">（本轮最终调用，结果未在本轮记录）</p>
      )}
    </div>
  );
}

const ROLE_META: Record<string, { label: string; accent: string; icon: React.ReactNode }> = {
  user: {
    label: "用户",
    accent: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
    icon: <User className="size-3.5 text-blue-500" />
  },
  assistant: {
    label: "助手",
    accent: "border-l-emerald-500",
    icon: <Bot className="size-3.5 text-emerald-500" />
  }
};

/** 折叠态下的一行预览：优先正文首行，其次工具名列表。 */
function previewOf(message: TranscriptMessage): string {
  const { text } = message.role === "assistant" ? splitReasoning(message.content) : { text: message.content };
  const flat = text.trim().replace(/\s+/g, " ");
  if (flat) {
    return flat.length > 80 ? `${flat.slice(0, 80)}…` : flat;
  }
  if (message.toolCalls.length > 0) {
    return `🔧 ${message.toolCalls
      .map((c) => c.name)
      .filter(Boolean)
      .join(", ")}`;
  }
  return "（无文本内容）";
}

function MessageCard({
  message,
  open,
  onToggle,
  resultByToolCallId,
  tokenCountEstimated
}: {
  message: TranscriptMessage;
  open: boolean;
  onToggle: () => void;
  resultByToolCallId: Map<string, string>;
  tokenCountEstimated: boolean;
}) {
  const meta = ROLE_META[message.role] ?? {
    label: message.role,
    accent: "border-l-muted-foreground/40",
    icon: <Bot className="text-muted-foreground size-3.5" />
  };
  const { reasoning, text } =
    message.role === "assistant" ? splitReasoning(message.content) : { reasoning: "", text: message.content };
  const clearedCount = message.toolCalls.filter(
    (c) => c.id && parseClearedResult(resultByToolCallId.get(c.id)).cleared
  ).length;

  return (
    <div className={cn("rounded-lg border border-l-4", meta.accent)}>
      {/* 折叠头：始终可见，点击切换展开 */}
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-muted/20 flex w-full cursor-pointer items-center gap-1.5 rounded-t-lg px-3 py-2 text-left"
      >
        {open ? (
          <ChevronDown className="text-muted-foreground size-3.5 shrink-0" />
        ) : (
          <ChevronRight className="text-muted-foreground size-3.5 shrink-0" />
        )}
        {meta.icon}
        <span className="text-xs font-semibold">{meta.label}</span>
        {message.finalOutput && (
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            本轮最终输出
          </span>
        )}
        {message.toolCalls.length > 0 && (
          <span className="text-muted-foreground text-[10px]">{message.toolCalls.length} 个工具调用</span>
        )}
        {clearedCount > 0 && (
          <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">
            已压缩 {clearedCount}
          </span>
        )}
        {!open && <span className="text-muted-foreground ml-1 flex-1 truncate text-xs">{previewOf(message)}</span>}
        {message.tokenCount !== undefined && (
          <span className="text-muted-foreground ml-auto shrink-0 text-[11px]">
            {tokenCountEstimated ? "约 " : ""}
            {formatTokenCount(message.tokenCount)} Token
          </span>
        )}
      </button>

      {open && (
        <div className="px-3 pt-1 pb-3">
          {reasoning && (
            <Collapsible title="思考过程" className="mb-2">
              <CodeBlock className="text-muted-foreground">{reasoning}</CodeBlock>
            </Collapsible>
          )}

          {text ? (
            message.role === "assistant" ? (
              <AssistantMarkdown>{text}</AssistantMarkdown>
            ) : (
              <div className="text-sm leading-6 wrap-break-word whitespace-pre-wrap">{text}</div>
            )
          ) : (
            message.toolCalls.length === 0 && <p className="text-muted-foreground text-xs">（无文本内容）</p>
          )}

          {message.toolCalls.length > 0 && (
            <div className="mt-2.5 space-y-2">
              {message.toolCalls.map((call, index) => (
                <ToolCallCard
                  key={call.id ?? `${call.name}-${index}`}
                  call={call}
                  result={call.id ? resultByToolCallId.get(call.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 压缩边界分隔条：其上（至第 round 轮）的工具结果已被 compaction 清除。 */
function CompactionDivider({ round }: { round: number }) {
  return (
    <div className="flex items-center gap-3 py-1 text-[11px] text-amber-600 dark:text-amber-400">
      <div className="h-px flex-1 bg-amber-500/30" />
      <span className="flex items-center gap-1 whitespace-nowrap">
        <Archive className="size-3" />第 {round} 轮及更早的工具结果已被压缩清除，以下为完整记录
      </span>
      <div className="h-px flex-1 bg-amber-500/30" />
    </div>
  );
}

/**
 * 整轮合并对话视图。
 *
 * 数据来自该轮最后一个 step 文件：`parsed.messages` 是整条 thread 的完整历史（含所有工具调用
 * 与其结果），`parsed.summary` 是本轮最终输出。这里把二者合并成一条时间线，并把每个 assistant
 * 的工具调用与其后的 `role:tool` 结果按 id 就近配对内联，避免在多个 step 文件间来回翻找。
 *
 * 消息卡片默认折叠（点击展开）；被 compaction 清除的旧工具结果标出压缩占位，并在压缩边界
 * （按 user→assistant 轮次计）插入分隔条标注「第 x 轮及更早已压缩」。
 */
export function TurnTranscript({
  parsed,
  resultOverrides
}: {
  parsed: ParsedLlmExchangeContent | null;
  /** 对话级视图专用：toolCallId → 未压缩完整结果，覆盖 messages 里被清除的旧结果。 */
  resultOverrides?: Record<string, string>;
}) {
  const { timeline, resultByToolCallId, rounds, lastClearedIndex, finalIndex } = useMemo(() => {
    const resultMap = new Map<string, string>();
    const resultTokenCountMap = new Map<string, number>();
    const paired = new Set<string>();

    if (!parsed) {
      return {
        timeline: [] as TranscriptMessage[],
        resultByToolCallId: resultMap,
        rounds: [] as number[],
        lastClearedIndex: -1,
        finalIndex: -1
      };
    }

    parsed.messages.forEach((message, index) => {
      if (message.role === "tool" && message.toolCallId) {
        resultMap.set(message.toolCallId, message.content);
        resultTokenCountMap.set(message.toolCallId, parsed.messageTokenUsage.byMessage[index] ?? 0);
      }
      for (const call of message.toolCalls) {
        if (call.id) {
          paired.add(call.id);
        }
      }
    });

    // 覆盖被压缩清除的旧结果为完整原文（对话级视图）；非清除的近期结果通常一致。
    // 覆盖后压缩检测自然落空——已还原的结果不再标「已压缩」，无法还原的仍保留占位与分隔条。
    if (resultOverrides) {
      for (const [id, content] of Object.entries(resultOverrides)) {
        resultMap.set(id, content);
      }
    }

    // 合并时间线：历史消息（跳过已内联的 tool 结果）+ 本轮最终输出。
    const list: TranscriptMessage[] = parsed.messages.flatMap((message, index) => {
      if (message.role === "tool" && message.toolCallId && paired.has(message.toolCallId)) {
        return [];
      }

      const resultTokenCount = message.toolCalls.reduce(
        (total, call) => total + (call.id ? (resultTokenCountMap.get(call.id) ?? 0) : 0),
        0
      );
      return [
        {
          ...message,
          tokenCount: (parsed.messageTokenUsage.byMessage[index] ?? 0) + resultTokenCount
        }
      ];
    });

    let final = -1;
    if (parsed.summary && (parsed.summary.text || parsed.summary.reasoning || parsed.summary.toolCalls.length > 0)) {
      const reasoningPrefix = parsed.summary.reasoning ? `<think>${parsed.summary.reasoning}</think>` : "";
      list.push({
        role: "assistant",
        content: reasoningPrefix + (parsed.summary.text ?? ""),
        toolCalls: parsed.summary.toolCalls,
        finalOutput: true,
        tokenCount: parsed.messageTokenUsage.finalOutput ?? undefined
      });
      final = list.length - 1;
    }

    // 轮次编号（每遇到一条 user 消息 +1）；压缩边界取「含被清除结果」的最后一条消息。
    let round = 0;
    const roundOf: number[] = [];
    let lastCleared = -1;
    list.forEach((message, index) => {
      if (message.role === "user") {
        round += 1;
      }
      roundOf.push(round);
      const hasCleared = message.toolCalls.some((c) => c.id && parseClearedResult(resultMap.get(c.id)).cleared);
      if (hasCleared) {
        lastCleared = index;
      }
    });

    return {
      timeline: list,
      resultByToolCallId: resultMap,
      rounds: roundOf,
      lastClearedIndex: lastCleared,
      finalIndex: final
    };
  }, [parsed, resultOverrides]);

  // 默认折叠所有卡片，仅展开「本轮最终输出」。
  const [openSet, setOpenSet] = useState<Set<number>>(() => (finalIndex >= 0 ? new Set([finalIndex]) : new Set()));

  if (!parsed) {
    return <p className="text-muted-foreground text-sm">该轮暂无可展示的对话内容</p>;
  }

  const toggle = (index: number) => {
    setOpenSet((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  const expandAll = () => setOpenSet(new Set(timeline.map((_, index) => index)));
  const collapseAll = () => setOpenSet(new Set());

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>模型：{parsed.meta.model ?? "-"}</span>
          <span>时间：{formatDateTime(parsed.meta.at)}</span>
          <span>消息数：{timeline.length}</span>
          <span>
            可见消息 Token：{parsed.messageTokenUsage.estimated ? "约 " : ""}
            {formatTokenCount(parsed.messageTokenUsage.total)}
          </span>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={expandAll}>
            展开全部
          </Button>
          <Button size="sm" variant="outline" onClick={collapseAll}>
            折叠全部
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {timeline.map((message, index) => (
          <div key={`${message.role}-${index}`} className="space-y-2">
            <MessageCard
              message={message}
              open={openSet.has(index)}
              onToggle={() => toggle(index)}
              resultByToolCallId={resultByToolCallId}
              tokenCountEstimated={parsed.messageTokenUsage.estimated}
            />
            {index === lastClearedIndex && <CompactionDivider round={rounds[index]} />}
          </div>
        ))}
      </div>
    </div>
  );
}
