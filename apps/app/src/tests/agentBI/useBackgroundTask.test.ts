import { describe, expect, it, vi } from "vitest";

import { shallowRef } from "vue";

import type { UIMessage, UIMessageChunk } from "ai";

vi.mock("@screenwright/server/rpc", () => ({ apiClient: {} }));
vi.mock("@/views/build/components/agentBI/hooks/stream/useChunkSideEffects", () => ({
  useChunkSideEffects: () => ({ createSideEffectTransform: () => new TransformStream(), resolveSuspend: vi.fn() })
}));

import { useAgentBIStream } from "@/views/build/components/agentBI/hooks/stream/useAgentBIStream";
import { useBackgroundTask } from "@/views/build/components/agentBI/hooks/stream/useBackgroundTask";

const run = async (terminal: string, data: Record<string, unknown>, toolName = "searchMediaAssetsTool") => {
  const background = useBackgroundTask("session-1");
  const messages = shallowRef<UIMessage[]>([]);
  const chunks = [
    { type: "start", messageId: "message-1" },
    { type: "tool-input-available", toolCallId: "collect-1", toolName, input: {} },
    { type: "tool-output-available", toolCallId: "collect-1", output: "Background task started. Task ID: task-1" },
    { type: terminal, data: { toolCallId: "collect-1", toolName, ...data } },
    { type: "finish", finishReason: "stop" }
  ] as UIMessageChunk[];
  await useAgentBIStream().consumeMessageStream(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(chunk));
        controller.close();
      }
    }),
    [background.splitBackgroundTaskChunkFromMainStream()],
    {
      messages,
      updateMessagesBy: (update) => {
        messages.value = update();
      }
    }
  );
  return messages.value[0].parts.find((part) => part.type === `tool-${toolName}`);
};

describe("后台素材工具回执", () => {
  it.each(["searchMediaAssetsTool", "importMediaAssetsTool"])("%s 完成后替换占位并触发消息更新", async (name) => {
    const result = { assets: [{ type: "video", url: "http://platform/video.mp4" }] };
    const part = await run("data-background-task-completed", { result }, name);
    expect(part).toMatchObject({ state: "output-available", output: result });
  });

  it("兼容序列化的任务结果", async () => {
    const result = { assets: [{ type: "image", url: "http://platform/image.png" }] };
    expect(await run("data-background-task-completed", { result: JSON.stringify(result) })).toMatchObject({
      output: result
    });
  });

  it.each([
    ["data-background-task-failed", { error: { message: "素材转存失败" } }, "素材转存失败"],
    ["data-background-task-completed", { isError: true, result: "搜索失败" }, "搜索失败"],
    ["data-background-task-cancelled", {}, "素材任务未完成，请重试"]
  ])("%s 会显示失败原因", async (terminal, data, errorText) => {
    expect(await run(terminal, data)).toMatchObject({ state: "output-error", errorText });
  });

  it("没有结果的完成事件保留占位，避免空结果覆盖", async () => {
    expect(await run("data-background-task-completed", {})).toMatchObject({
      output: "Background task started. Task ID: task-1"
    });
  });
});
