/**
 * LLM 往返档案的规范格式。
 *
 * Mastra 与 Pi 两套 agent 系统都在 provider 的 fetch 层取样，落地的都是 OpenAI
 * chat-completions 的 wire 格式（Pi 内置 deepseek provider 同样走 openai-completions），
 * 因此共用同一份契约、同一套 sink / 索引 / 阅卷链路。
 *
 * 【字段顺序即落盘 JSON 的顺序】新增字段一律追加在末尾：MinIO 里的历史档案、
 * Postgres 索引指针与阅卷室读取端（services/llm-exchange-content.ts）都按这个形状读，
 * 重排会让新旧档案失去可比性。
 */

/** 记录来源：哪套 agent 系统产生了这次往返。 */
export type ExchangeSource = "mastra" | "pi";

/** 档案格式版本；字段语义发生不兼容变化时才 +1。 */
export const EXCHANGE_FORMAT_VERSION = 1;

/** 模型回报的 token 用量（不是本地 tokenizer estimate，口径与账单一致）。 */
export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cachedPromptTokens?: number;
  reasoningTokens?: number;
}

export interface ExchangeToolCall {
  id: string;
  name: string;
  arguments: string;
}

/** 从 SSE 增量拼回的可读摘要，便于不解析原始流也能看懂这一步做了什么。 */
export interface ExchangeSummary {
  reasoning: string;
  text: string;
  toolCalls: ExchangeToolCall[];
}

/** 一次 LLM 往返的完整档案，对应一个 step_NN.json 文件。 */
export interface ExchangeRecord {
  /** 本 turn 内的步骤序号；-1 表示这次调用发生在 turn 上下文之外 */
  step: number;
  /** 响应到达、开始记录的时刻 */
  at: string;
  /** 请求发出的时刻 */
  startedAt: string;
  threadId?: string;
  /** resume 请求才有值 */
  runId?: string;
  url: string;
  status: number;
  ok: boolean;
  /** 完整请求体（messages / tools / provider 注入的字段都在里面） */
  request: unknown;
  /** 响应抽干完成的时刻 */
  completedAt: string;
  generationTimeMs: number;
  tokenUsage?: TokenUsage;
  summary: ExchangeSummary;
  /** 原始响应：SSE 拆成的 chunk 数组，非 SSE 则为原文 */
  response: unknown;
  formatVersion: number;
  source: ExchangeSource;
  /**
   * 分支键，用于标识不同的执行分支。
   */
  branchKey?: string;
}

/** LLM 往返录制总开关（环境变量 RECORD_LLM=true）。 */
export function isLlmRecordingEnabled(): boolean {
  return process.env.RECORD_LLM === "true";
}
