import { beforeEach, describe, expect, it, vi } from "vitest";

import { SubAgentSnapshotCollector } from "@/mastra/services/chat/sub-agent-collector";
import type { CustomStorageThreadType } from "@/mastra/types/bi-chat";

// thread-metadata 会拉起整个 storage（Postgres + 向量库），这里只关心「写了什么」
const { patchThreadMetadata } = vi.hoisted(() => ({ patchThreadMetadata: vi.fn() }));
vi.mock("@/mastra/services/chat/thread-metadata", () => ({ patchThreadMetadata }));

type ThreadMetadata = CustomStorageThreadType["metadata"];

/** 取出本次 persist 交给 patchThreadMetadata 的 patch 构造器，喂给它一份"磁盘现状" */
const patchAgainst = (current: ThreadMetadata | undefined) => {
  const [, buildPatch] = patchThreadMetadata.mock.calls[0] as [
    string,
    (current: ThreadMetadata | undefined) => Partial<ThreadMetadata>
  ];
  return buildPatch(current);
};

/** 一帧 data-tool-agent 的 data：steps[] 里每步带文本与它发起的 toolCall */
const frame = (steps: { text?: string; reasoningText?: string; toolCallId: string }[]) => ({
  steps: steps.map(({ text, reasoningText, toolCallId }) => ({
    text,
    reasoningText,
    toolCalls: [{ toolCallId }]
  }))
});

describe("SubAgentSnapshotCollector", () => {
  beforeEach(() => {
    patchThreadMetadata.mockReset();
    patchThreadMetadata.mockResolvedValue(undefined);
  });

  it("按内层 toolCallId 累积，后一帧 steps[] 不全量也不会抹掉早先的步骤", async () => {
    const collector = new SubAgentSnapshotCollector();

    collector.collect(frame([{ text: "第一步", toolCallId: "call_a" }]));
    // 下一帧只带了第二步——Mastra 不保证每帧都回全量 steps[]
    collector.collect(frame([{ text: "第二步", toolCallId: "call_b" }]));

    await collector.persist("thread-1");

    expect(patchAgainst(undefined)).toEqual({
      subAgentSnapshots: {
        call_a: { text: "第一步", reasoning: "" },
        call_b: { text: "第二步", reasoning: "" }
      }
    });
  });

  it("同一 toolCallId 后到的帧覆盖先到的（同一步的文本在增量补全）", async () => {
    const collector = new SubAgentSnapshotCollector();

    collector.collect(frame([{ text: "分", toolCallId: "call_a" }]));
    collector.collect(frame([{ text: "分析完成", reasoningText: "先看表结构", toolCallId: "call_a" }]));

    await collector.persist("thread-1");

    expect(patchAgainst(undefined)).toEqual({
      subAgentSnapshots: { call_a: { text: "分析完成", reasoning: "先看表结构" } }
    });
  });

  it("一条都没收到就不写库——别为了空对象平白起一次读改写", async () => {
    await new SubAgentSnapshotCollector().persist("thread-1");

    expect(patchThreadMetadata).not.toHaveBeenCalled();
  });

  it("与磁盘已有快照合并：别的轮次写的保留，本轮同 key 的覆盖", async () => {
    const collector = new SubAgentSnapshotCollector();
    collector.collect(frame([{ text: "本轮的 a", toolCallId: "call_a" }]));

    await collector.persist("thread-1");

    const patch = patchAgainst({
      subAgentSnapshots: { call_a: { text: "上一轮的 a" }, call_z: { text: "上一轮的 z" } }
    } as ThreadMetadata);

    expect(patch).toEqual({
      subAgentSnapshots: {
        call_a: { text: "本轮的 a", reasoning: "" },
        call_z: { text: "上一轮的 z", reasoning: "" }
      }
    });
  });

  it("磁盘上是旧的两层结构（outer runId → inner）时先展平再合并", async () => {
    const collector = new SubAgentSnapshotCollector();
    collector.collect(frame([{ text: "本轮的 a", toolCallId: "call_a" }]));

    await collector.persist("thread-1");

    const patch = patchAgainst({
      subAgentSnapshots: { "sub-run-old": { call_z: "只有字符串的更旧格式" } }
    } as unknown as ThreadMetadata);

    expect(patch).toEqual({
      subAgentSnapshots: {
        call_a: { text: "本轮的 a", reasoning: "" },
        call_z: { text: "只有字符串的更旧格式" }
      }
    });
  });

  it("写库失败只记日志不抛——快照是锦上添花，不该让整条流以 error 收场", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    patchThreadMetadata.mockRejectedValueOnce(new Error("数据库炸了"));

    const collector = new SubAgentSnapshotCollector();
    collector.collect(frame([{ text: "第一步", toolCallId: "call_a" }]));

    await expect(collector.persist("thread-1")).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalled();

    logged.mockRestore();
  });
});
