import { describe, expect, it } from "vitest";

import { chunksToSseResponse, loadSession, makeStepResponse } from "./streamReplay";

/** 已录制的 session threadId，用于验证 */
const RECORDED_THREAD_ID = "822a0cd8-7ddd-4859-b0ce-2726320f1b6f";

describe("streamReplay", () => {
  describe("loadSession", () => {
    it("能正确读取 session 文件", () => {
      const session = loadSession(RECORDED_THREAD_ID);
      expect(session.threadId).toBe(RECORDED_THREAD_ID);
      expect(session.steps.length).toBeGreaterThan(0);
    });

    it("每个 step 都包含 chunks 数组", () => {
      const session = loadSession(RECORDED_THREAD_ID);
      for (const step of session.steps) {
        expect(Array.isArray(step.chunks)).toBe(true);
        expect(step.chunks.length).toBeGreaterThan(0);
      }
    });

    it("step 0 无 runId，resume step 有 runId", () => {
      const session = loadSession(RECORDED_THREAD_ID);
      expect(session.steps[0].runId).toBeUndefined();
      if (session.steps.length > 1) {
        expect(session.steps[1].runId).toBeTruthy();
      }
    });
  });

  describe("chunksToSseResponse", () => {
    it("返回带 body 的 Response 对象", () => {
      const response = chunksToSseResponse([{ type: "finish" }]);
      expect(response.body).toBeDefined();
    });

    it("body 可读取为文本，每个 chunk 对应 data: <json> 行", async () => {
      const chunks = [{ type: "start", messageId: "m1" }, { type: "finish" }];
      const response = chunksToSseResponse(chunks);
      const text = await new Response(response.body).text();

      expect(text).toContain('data: {"type":"start","messageId":"m1"}');
      expect(text).toContain('data: {"type":"finish"}');
      expect(text).toContain("data: [DONE]");
    });
  });

  describe("makeStepResponse", () => {
    it("step 0 能提取到合法 Response，chunk 数量与录制一致", async () => {
      const session = loadSession(RECORDED_THREAD_ID);
      const response = makeStepResponse(session, 0);

      const text = await new Response(response.body).text();
      const dataLines = text.split("\n").filter((l) => l.startsWith("data:") && l !== "data: [DONE]");

      expect(dataLines.length).toBe(session.steps[0].chunks.length);
    });

    it("step 0 第一个 chunk 的 type 为 start", async () => {
      const session = loadSession(RECORDED_THREAD_ID);
      const response = makeStepResponse(session, 0);

      const text = await new Response(response.body).text();
      const firstLine = text.split("\n").find((l) => l.startsWith("data:") && l !== "data: [DONE]");
      const firstChunk = JSON.parse(firstLine!.slice("data: ".length));

      expect(firstChunk.type).toBe("start");
    });

    it("step 1 最后一个 chunk 的 type 为 finish", async () => {
      const session = loadSession(RECORDED_THREAD_ID);
      if (session.steps.length < 2) {
        return;
      }

      const response = makeStepResponse(session, 1);
      const text = await new Response(response.body).text();
      const dataLines = text.split("\n").filter((l) => l.startsWith("data:") && l !== "data: [DONE]");
      const lastChunk = JSON.parse(dataLines[dataLines.length - 1].slice("data: ".length));

      expect(lastChunk.type).toBe("finish");
    });

    it("越界 stepIndex 抛出 RangeError", () => {
      const session = loadSession(RECORDED_THREAD_ID);
      expect(() => makeStepResponse(session, 999)).toThrow(RangeError);
    });
  });
});
