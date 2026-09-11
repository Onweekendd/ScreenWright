/**
 * 给 Pi 的模型 provider 套上录制。
 *
 * 取样点选在 HTTP fetch 层，与 Mastra 侧完全一致：Pi 内置的 deepseek provider 走的同样是
 * OpenAI chat-completions（pi-ai 的 openAICompletionsApi），因此两套 agent 系统落地的档案
 * 天然同构，共用 @/recording 下的同一份格式、sink 与索引，不需要任何格式转换。
 */
import type { ModelRuntime } from "@earendil-works/pi-coding-agent";

import { createRecordingFetch, type FetchFunction } from "@/recording/recording-fetch";

/** pi-ai 的 Provider 类型；pi-coding-agent 没有再导出它，这里从 ModelRuntime 上取回来。 */
export type PiProvider = NonNullable<ReturnType<ModelRuntime["getProvider"]>>;

/**
 * 包一层 provider：每次 stream 调用注入录制用的 fetch，其余成员原样透传。
 *
 * pi-ai 的 `ProviderRequestOptions.fetch` 就是为代理 / 自定义传输准备的口子，
 * openai-completions 会把它交给底层 client，所以这里拿到的是真实请求体与原始 SSE。
 */
export function withExchangeRecording(
  provider: PiProvider,
  recordingFetch: FetchFunction = createRecordingFetch({ source: "pi" })
): PiProvider {
  const withRecordingFetch = <T>(options: T | undefined): T => ({ ...(options ?? {}), fetch: recordingFetch }) as T;

  return {
    ...provider,
    stream: (model, context, options) => provider.stream(model, context, withRecordingFetch(options)),
    streamSimple: (model, context, options) => provider.streamSimple(model, context, withRecordingFetch(options))
  };
}
