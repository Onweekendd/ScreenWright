"use client";

import { useState } from "react";

import type { ParsedLlmExchangeContent } from "@screenwright/server/rpc";

import { JsonMonacoViewer } from "@/components/sessions/json-monaco-viewer";
import { TurnTranscript } from "@/components/sessions/turn-transcript";
import { Button } from "@/components/ui/button";
import { formatTokenCount } from "@/lib/utils";

type TabKey = "messages" | "tools" | "raw";

interface ToolDefinitionView {
  name: string;
  description: string | null;
  schema: unknown;
  showsFullDefinition: boolean;
  tokenCount: number;
}

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "messages", label: "消息" },
  { key: "tools", label: "工具" },
  { key: "raw", label: "原始 JSON" }
];

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyJson(value: unknown, space?: number): string {
  try {
    return JSON.stringify(value, null, space) ?? String(value);
  } catch {
    return String(value);
  }
}

function toToolDefinitionView(definition: unknown, index: number, tokenCount: number): ToolDefinitionView {
  if (!isRecord(definition)) {
    return {
      name: `tool_${index + 1}`,
      description: null,
      schema: definition,
      showsFullDefinition: true,
      tokenCount
    };
  }

  const functionDefinition = isRecord(definition.function) ? definition.function : definition;
  const name = typeof functionDefinition.name === "string" ? functionDefinition.name : `tool_${index + 1}`;
  const description = typeof functionDefinition.description === "string" ? functionDefinition.description : null;
  const schema =
    functionDefinition.parameters ??
    functionDefinition.inputSchema ??
    functionDefinition.input_schema ??
    functionDefinition.schema;
  const hasSchema = schema !== undefined && schema !== null;

  return {
    name,
    description,
    schema: hasSchema ? schema : definition,
    showsFullDefinition: !hasSchema,
    tokenCount
  };
}

function formatJson(value: unknown): string {
  return stringifyJson(value, 2);
}

export function ExchangeContentPanel({
  parsed,
  rawContent,
  loading
}: {
  parsed: ParsedLlmExchangeContent | null;
  rawContent: unknown;
  loading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("messages");

  if (loading) {
    return <p className="text-muted-foreground text-sm">正在从 MinIO 加载内容...</p>;
  }

  if (!parsed) {
    return null;
  }

  const tools = parsed.toolDefinitions.map((definition, index) =>
    toToolDefinitionView(definition, index, parsed.toolTokenUsage.byTool[index] ?? 0)
  );
  const tokenCountPrefix = parsed.toolTokenUsage.estimated ? "约 " : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={activeTab === tab.key ? "default" : "outline"}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.key === "tools" ? `${tab.label} (${tools.length})` : tab.label}
          </Button>
        ))}
      </div>

      {/* 消息视图复用 TurnTranscript：该 step 的 messages + summary 按对话时间线渲染，
          工具调用与结果就近配对、卡片默认折叠，与整轮合并视图完全一致。 */}
      {activeTab === "messages" && <TurnTranscript parsed={parsed} />}

      {activeTab === "tools" && (
        <div className="space-y-3">
          {tools.length > 0 ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <p className="text-muted-foreground text-sm">
                  当前对话携带 {tools.length} 个工具。展开工具可查看其 JSON Schema。
                </p>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-sm font-semibold">
                    {tokenCountPrefix}
                    {formatTokenCount(parsed.toolTokenUsage.total)} Token
                  </p>
                  <p className="text-muted-foreground text-[11px]">工具定义合计</p>
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                {parsed.toolTokenUsage.estimated
                  ? "当前模型没有匹配的 tokenizer，Token 为基于工具定义 JSON 的估算值。"
                  : `由 ${parsed.toolTokenUsage.tokenizer} tokenizer 按完整工具定义 JSON 计算。`}
              </p>
              {tools.map((tool, index) => (
                <details key={`${tool.name}-${index}`} className="group overflow-hidden rounded-lg border">
                  <summary className="hover:bg-muted/40 cursor-pointer list-none px-4 py-3 transition-colors [&::-webkit-details-marker]:hidden">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-medium">{tool.name}</p>
                        {tool.description && (
                          <p className="text-muted-foreground mt-1 text-xs leading-5">{tool.description}</p>
                        )}
                      </div>
                      <div className="text-muted-foreground flex shrink-0 flex-col items-end gap-1 text-xs">
                        <span>{tool.showsFullDefinition ? "完整定义" : "JSON Schema"}</span>
                        <span>
                          {tokenCountPrefix}
                          {formatTokenCount(tool.tokenCount)} Token
                        </span>
                      </div>
                    </div>
                  </summary>
                  <div className="border-t p-4">
                    <pre className="bg-muted/30 max-h-[32rem] overflow-auto rounded-md p-3 font-mono text-xs leading-5">
                      {formatJson(tool.schema)}
                    </pre>
                  </div>
                </details>
              ))}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">当前对话没有携带工具定义</p>
          )}
        </div>
      )}

      {activeTab === "raw" && <JsonMonacoViewer value={rawContent} />}
    </div>
  );
}
