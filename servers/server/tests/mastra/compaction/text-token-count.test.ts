import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 使用真实 HF Tokenizer + 小词表测试，不联网下载生产模型资产。
const tokenizerJson = {
  version: "1.0",
  truncation: null,
  padding: null,
  added_tokens: [],
  normalizer: null,
  pre_tokenizer: { type: "Whitespace" },
  post_processor: null,
  decoder: null,
  model: {
    type: "WordPiece",
    unk_token: "[UNK]",
    continuing_subword_prefix: "##",
    max_input_chars_per_word: 100,
    vocab: { "[UNK]": 0, hello: 1, world: 2 }
  }
};

beforeEach(() => {
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("纯文本 Token 计数", () => {
  it("复用模型 tokenizer，直接编码文本，重复计数只加载一次资产", async () => {
    const fetchMock = vi.fn(
      async (url: string) => new Response(JSON.stringify(url.endsWith("tokenizer.json") ? tokenizerJson : {}))
    );
    vi.stubGlobal("fetch", fetchMock);
    const { countTextTokens, countJsonValuesTokens } = await import(
      "@/mastra/services/llm-exchange/llm-exchange-token-count"
    );
    expect(await countTextTokens("hello world", "deepseek-v4-flash")).toEqual({
      total: 2,
      estimated: false,
      tokenizer: "deepseek-ai/DeepSeek-V4-Pro"
    });
    expect((await countTextTokens("hello", "deepseek-v4-flash")).total).toBe(1);
    const json = await countJsonValuesTokens(["hello world"], "deepseek-v4-flash");
    expect(json.byItem[0]).toBeGreaterThan(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("空文本不加载 tokenizer", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { countTextTokens } = await import("@/mastra/services/llm-exchange/llm-exchange-token-count");
    expect(await countTextTokens("", "deepseek-v4-flash")).toEqual({ total: 0, estimated: false, tokenizer: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("未知模型明确标注为字符估算", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { countTextTokens } = await import("@/mastra/services/llm-exchange/llm-exchange-token-count");
    expect(await countTextTokens("中文abc", "unknown-model")).toEqual({ total: 3, estimated: true, tokenizer: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("资产加载失败时回退并标注估算，不中断压缩", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { countTextTokens } = await import("@/mastra/services/llm-exchange/llm-exchange-token-count");
    expect(await countTextTokens("中文abc", "deepseek-v4-flash")).toEqual({
      total: 3,
      estimated: true,
      tokenizer: null
    });
  });
});
