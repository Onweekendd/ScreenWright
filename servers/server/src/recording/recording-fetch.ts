/**
 * fetch 层的取样件：拿到响应后复写一份交给档案，原样把响应交还给下游。
 *
 * 两种用法：
 *   - recordExchange(input)        provider 已经自己发过请求（Mastra 的 createDeepseekFetch 等），
 *                                  只把响应交给录制，拿回应该继续消费的 body 分支。
 *   - createRecordingFetch(...)    直接得到一个可注入的 fetch（Pi 的 provider 用 options.fetch 接）。
 */
import { ExchangeArchive, type OpenExchange } from "./exchange-archive";
import { type ExchangeSource, isLlmRecordingEnabled } from "./exchange-record";
import { drainToText, safeParse } from "./openai-sse";

export type FetchFunction = typeof globalThis.fetch;

export interface RecordExchangeInput {
  /** 请求 URL */
  url: string;
  /** 发给 LLM 的最终请求体（provider 注入 thinking 等字段之后的 init.body） */
  requestBody: unknown;
  /** 上游响应：流式 tee 其 body，非流式走 clone */
  res: Response;
  /** 是否为 SSE 流式响应 */
  isStream: boolean;
  /** 请求发起时刻（Date.now()），用于算 generationTimeMs */
  requestStartedAt: number;
  /** 记录来源，默认 mastra */
  source?: ExchangeSource;
}

/**
 * 取样一份完整响应文本交给已开档的往返（后台进行，不阻塞下游）。
 *
 * - 流式：tee 原始 body，一支后台抽干，另一支作为返回值交还上层继续消费。
 * - 非流式 / 无 body：走 res.clone() 读文本，返回 null 表示上层沿用原响应。
 */
function sampleResponseText(
  res: Response,
  isStream: boolean,
  exchange: OpenExchange
): ReadableStream<Uint8Array> | null {
  // 录制是旁路，任何解析/读取异常都不该冒泡成 unhandledRejection
  const archive = (raw: string): void => {
    try {
      exchange.commit(raw);
    } catch (e) {
      console.error("[recording-fetch] 归档失败:", e);
    }
  };

  if (!isStream || !res.body) {
    void res
      .clone()
      .text()
      .then(archive)
      .catch((e) => console.error("[recording-fetch] 读取响应失败:", e));
    return null;
  }

  const [forRecord, forClient] = res.body.tee();
  void drainToText(forRecord).then(archive);
  return forClient;
}

/**
 * 记录一次 LLM 往返。
 *
 * 返回应继续向下游使用的「响应 body 流」：流式时为 tee 出的客户端分支；非流式时为 null。
 */
export function recordExchange(input: RecordExchangeInput): ReadableStream<Uint8Array> | null {
  const { url, requestBody, res, isStream, requestStartedAt, source = "mastra" } = input;
  const request = safeParse(requestBody);

  const exchange = new ExchangeArchive(source).open({
    url,
    status: res.status,
    ok: res.ok,
    model: (request as { model?: string } | undefined)?.model,
    request,
    requestStartedAt
  });

  return sampleResponseText(res, isStream, exchange);
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  return input instanceof URL ? input.toString() : input.url;
}

/** 取出请求体文本；Request 形式的入参克隆一份读，避免消费掉真正要发出去的 body。 */
async function resolveRequestBody(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  if (init?.body !== undefined) {
    return init.body;
  }
  if (typeof input === "string" || input instanceof URL) {
    return undefined;
  }
  try {
    return await input.clone().text();
  } catch {
    return undefined;
  }
}

/**
 * 造一个带录制的 fetch：透明代理内层 fetch，顺带把往返归档。
 * 未开启 RECORD_LLM 时直接透传，零开销。
 */
export function createRecordingFetch(options: { source: ExchangeSource; fetch?: FetchFunction }): FetchFunction {
  const { source } = options;
  // 不要直接把 globalThis.fetch 解构出来当默认值：脱离宿主对象调用在部分运行时会丢 this
  const inner: FetchFunction = options.fetch ?? ((input, init) => globalThis.fetch(input, init));

  return async (input, init) => {
    if (!isLlmRecordingEnabled()) {
      return inner(input, init);
    }

    const requestBody = await resolveRequestBody(input, init);
    const requestStartedAt = Date.now();
    const res = await inner(input, init);
    const isStream = res.ok && !!res.body && (res.headers.get("content-type") ?? "").includes("text/event-stream");

    const clientBranch = recordExchange({
      url: resolveUrl(input),
      requestBody,
      res,
      isStream,
      requestStartedAt,
      source
    });

    if (!clientBranch) {
      return res;
    }

    return new Response(clientBranch, { status: res.status, statusText: res.statusText, headers: res.headers });
  };
}
