import { EventEmitter } from "node:events";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SuspendType } from "@/mastra/types/suspend";
import { allocateStepSlot, type StepSlot } from "@/recording/recording-scope";

const mocks = vi.hoisted(() => ({
  resume: vi.fn(),
  attachTaskStream: vi.fn(),
  detachTaskStream: vi.fn()
}));

vi.mock("@/mastra/index", () => ({
  mastra: {
    backgroundTaskManager: { resume: mocks.resume },
    getStorage: () => ({
      getStore: async () => ({ loadWorkflowSnapshot: async () => ({ status: "suspended" }) })
    })
  }
}));
vi.mock("@/mastra/services/chat/session-registry", () => ({
  sessionRegistry: {
    find: () => ({ attachTaskStream: mocks.attachTaskStream, detachTaskStream: mocks.detachTaskStream })
  }
}));

import { handleBiChatResumeTask } from "@/mastra/services/chat/handle-bi-chat";

let recordDir: string;

beforeEach(() => {
  recordDir = fs.mkdtempSync(path.join(os.tmpdir(), "llm-records-"));
  vi.stubEnv("RECORD_LLM", "true");
  vi.stubEnv("RECORD_SINK", "fs");
  vi.stubEnv("LLM_RECORD_DIR", recordDir);
});

afterEach(() => {
  vi.unstubAllEnvs();
  fs.rmSync(recordDir, { recursive: true, force: true });
});

describe("恢复后台任务时的录制归属", () => {
  it("恢复出来的子 agent 的模型往返记进本 thread 的 turn，而不是落到 step_-1", async () => {
    // 照 Mastra 的同进程 pubsub：resume 同步投递给 worker，worker 稍后才发起模型调用
    const pubsub = new EventEmitter();
    const slot = new Promise<StepSlot>((resolve) => {
      pubsub.once("dispatch", () => setTimeout(() => resolve(allocateStepSlot()), 10));
    });
    mocks.resume.mockImplementation(async () => {
      pubsub.emit("dispatch");
    });

    expect(
      await handleBiChatResumeTask({ threadId: "resume-thread", taskId: "task-1", suspendType: SuspendType.CanvasOps })
    ).toEqual({ piped: true });

    const { turnIndex, turnDir, step } = await slot;
    expect(turnIndex).toBeGreaterThanOrEqual(0);
    expect(step).toBeGreaterThanOrEqual(0);
    expect(turnDir).toMatch(/^resume-thread\/turn_\d+$/);
  });
});
