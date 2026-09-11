import { describe, expect, it, vi } from "vitest";

import { type PiProvider, withExchangeRecording } from "@/artifact-app/agent/record/pi-recording-provider";
import type { FetchFunction } from "@/recording/recording-fetch";

function createProviderStub() {
  const stream = vi.fn().mockReturnValue("stream-result");
  const streamSimple = vi.fn().mockReturnValue("simple-result");
  const provider = {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com",
    auth: {},
    getModels: () => ["deepseek-v4-flash"],
    stream,
    streamSimple
  } as unknown as PiProvider;

  return { provider, stream, streamSimple };
}

const recordingFetch = vi.fn() as unknown as FetchFunction;
const model = { id: "deepseek-v4-flash" } as never;
const context = { messages: [] } as never;

describe("withExchangeRecording", () => {
  it("应原样透传 provider 的身份信息与模型列表", () => {
    // Arrange
    const { provider } = createProviderStub();

    // Act
    const wrapped = withExchangeRecording(provider, recordingFetch);

    // Assert
    expect({ id: wrapped.id, name: wrapped.name, baseUrl: wrapped.baseUrl, models: wrapped.getModels() }).toEqual({
      id: "deepseek",
      name: "DeepSeek",
      baseUrl: "https://api.deepseek.com",
      models: ["deepseek-v4-flash"]
    });
  });

  it("stream：应注入录制 fetch，并保留调用方原有的 options", () => {
    // Arrange
    const { provider, stream } = createProviderStub();
    const wrapped = withExchangeRecording(provider, recordingFetch);
    const signal = new AbortController().signal;

    // Act
    const result = wrapped.stream(model, context, { signal } as never);

    // Assert
    expect(result).toBe("stream-result");
    expect(stream).toHaveBeenCalledWith(model, context, { signal, fetch: recordingFetch });
  });

  it("streamSimple：未传 options 时也应注入录制 fetch", () => {
    // Arrange
    const { provider, streamSimple } = createProviderStub();
    const wrapped = withExchangeRecording(provider, recordingFetch);

    // Act
    const result = wrapped.streamSimple(model, context);

    // Assert
    expect(result).toBe("simple-result");
    expect(streamSimple).toHaveBeenCalledWith(model, context, { fetch: recordingFetch });
  });
});
