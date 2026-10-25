import { Tokenizer } from "@huggingface/tokenizers";

const HUGGING_FACE_BASE_URL = "https://huggingface.co";
const TOKENIZER_FETCH_TIMEOUT_MS = 10_000;

const tokenizerPromises = new Map<string, Promise<Tokenizer>>();

export interface ToolTokenUsage {
  total: number;
  byTool: number[];
  estimated: boolean;
  tokenizer: string | null;
}

export interface JsonTokenUsage {
  total: number;
  byItem: number[];
  estimated: boolean;
  tokenizer: string | null;
}

function stringifyJson(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * DeepSeek 官方给出的通用回退比例：中文字符约 0.6 Token，其余字符约 0.3 Token。
 * 仅在没有匹配 tokenizer 或 tokenizer 加载失败时使用。
 */
function estimateTokenCount(text: string): number {
  const cjkCharacterCount = (text.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/g) ?? [])
    .length;
  const otherCharacterCount = text.length - cjkCharacterCount;

  return Math.ceil(cjkCharacterCount * 0.6 + otherCharacterCount * 0.3);
}

function resolveTokenizerModelId(model: string | undefined): string | null {
  const normalizedModel = model?.toLowerCase();
  if (!normalizedModel) {
    return null;
  }
  if (normalizedModel.includes("deepseek-v4")) {
    return "deepseek-ai/DeepSeek-V4-Pro";
  }
  if (
    normalizedModel.includes("deepseek-v3") ||
    normalizedModel.includes("deepseek-chat") ||
    normalizedModel.includes("deepseek-reasoner")
  ) {
    return "deepseek-ai/DeepSeek-V3";
  }
  return null;
}

async function fetchJsonRecord(url: string): Promise<Record<PropertyKey, unknown>> {
  const response = await fetch(url, { signal: AbortSignal.timeout(TOKENIZER_FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`Failed to load tokenizer asset (${response.status})`);
  }
  return (await response.json()) as Record<PropertyKey, unknown>;
}

function loadTokenizer(modelId: string): Promise<Tokenizer> {
  const cached = tokenizerPromises.get(modelId);
  if (cached) {
    return cached;
  }

  const baseUrl = `${HUGGING_FACE_BASE_URL}/${modelId}/resolve/main`;
  const promise = Promise.all([
    fetchJsonRecord(`${baseUrl}/tokenizer.json`),
    fetchJsonRecord(`${baseUrl}/tokenizer_config.json`)
  ]).then(([tokenizerJson, tokenizerConfig]) => new Tokenizer(tokenizerJson, tokenizerConfig));
  tokenizerPromises.set(modelId, promise);
  return promise;
}

function countWithTokenizer(tokenizer: Tokenizer, serializedValues: string[]): JsonTokenUsage {
  return {
    total: tokenizer.encode(`[${serializedValues.join(",")}]`).ids.length,
    byItem: serializedValues.map((value) => tokenizer.encode(value).ids.length),
    estimated: false,
    tokenizer: null
  };
}

function estimateJsonTokenUsage(serializedValues: string[]): JsonTokenUsage {
  return {
    total: estimateTokenCount(`[${serializedValues.join(",")}]`),
    byItem: serializedValues.map(estimateTokenCount),
    estimated: true,
    tokenizer: null
  };
}

export async function countJsonValuesTokens(values: unknown[], model: string | undefined): Promise<JsonTokenUsage> {
  if (values.length === 0) {
    return { total: 0, byItem: [], estimated: false, tokenizer: null };
  }

  const serializedValues = values.map(stringifyJson);
  const tokenizerModelId = resolveTokenizerModelId(model);
  if (!tokenizerModelId) {
    return estimateJsonTokenUsage(serializedValues);
  }

  try {
    const tokenizer = await loadTokenizer(tokenizerModelId);
    return { ...countWithTokenizer(tokenizer, serializedValues), tokenizer: tokenizerModelId };
  } catch (error) {
    console.error(`[llm-exchange] Failed to load tokenizer ${tokenizerModelId}:`, error);
    return estimateJsonTokenUsage(serializedValues);
  }
}

export async function countToolDefinitionTokens(
  toolDefinitions: unknown[],
  model: string | undefined
): Promise<ToolTokenUsage> {
  const { byItem, ...usage } = await countJsonValuesTokens(toolDefinitions, model);
  return { ...usage, byTool: byItem };
}
