/**
 * 流回放工具
 *
 * 读取 tests/fixtures/sessions/{threadId}.json（由 RECORD_FIXTURES=true 录制），
 * 将每个 step 的 chunks 还原为 SSE Response，供 processMessageStream 直接消费。
 *
 * 使用示例：
 *   const session = loadSession("822a0cd8-7ddd-4859-b0ce-2726320f1b6f");
 *   const step0 = makeStepResponse(session, 0);
 *   const step1 = makeStepResponse(session, 1);
 *   const { runId } = session.steps[1]; // resume 时传给 bi-chat
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── 类型（与 stream-recorder.ts 保持镜像） ────────────────────────────────────

export interface StepRecord {
  step: number;
  runId?: string;
  request: Record<string, unknown>;
  chunks: unknown[];
}

export interface SessionRecord {
  threadId: string;
  recordedAt: string;
  steps: StepRecord[];
}

// ── 路径解析 ──────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** monorepo 根目录下 tests/fixtures/sessions/ */
const FIXTURES_DIR = path.resolve(__dirname, "./recodeStream");

// ── 公开 API ──────────────────────────────────────────────────────────────────

/**
 * 按 threadId（即文件名，不含 .json）加载录制的 session。
 */
export function loadSession(threadId: string): SessionRecord {
  const filePath = path.join(FIXTURES_DIR, `${threadId}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as SessionRecord;
}

/**
 * 将 chunk 数组序列化为 SSE 格式 Response，供 parseChatSseStream 消费。
 * 与 bi-chat.server.ts 的输出格式完全一致：每行 `data: <json>`，结尾 `data: [DONE]`。
 */
export function chunksToSseResponse(chunks: unknown[]): Response {
  const lines = chunks.map((c) => `data: ${JSON.stringify(c)}`).join("\n") + "\ndata: [DONE]\n";
  const encoder = new TextEncoder();
  return {
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(lines));
        controller.close();
      }
    })
  } as unknown as Response;
}

/**
 * 从 session 中取出指定 step 的 chunks，包装为 SSE Response。
 *
 * @param session - loadSession() 返回的 session 对象
 * @param stepIndex - 0 = 初始流，1+ = resume 流
 */
export function makeStepResponse(session: SessionRecord, stepIndex: number): Response {
  const step = session.steps[stepIndex];
  if (!step) {
    throw new RangeError(`Session "${session.threadId}" has no step ${stepIndex} (total: ${session.steps.length})`);
  }
  return chunksToSseResponse(step.chunks);
}
