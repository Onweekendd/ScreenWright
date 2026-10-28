import { describe, expect, it } from "vitest";

import { createUsageFlusher, type UsageRef } from "@/mastra/services/chat/usage-flusher";

describe("createUsageFlusher", () => {
  it("还没有 usage 时不下发", () => {
    const sent: unknown[] = [];
    const flush = createUsageFlusher({ current: undefined }, (chunk) => sent.push(chunk));

    flush();

    expect(sent).toEqual([]);
  });

  it("每步 usage 变化各下发一次，未变化不重复下发", () => {
    const usageRef: UsageRef = { current: undefined };
    const sent: unknown[] = [];
    const flush = createUsageFlusher(usageRef, (chunk) => sent.push(chunk));
    const step1 = { inputTokens: 207_912 };
    const step2 = { inputTokens: 98_000 };

    usageRef.current = step1;
    flush();
    flush();
    usageRef.current = step2;
    flush();
    flush();

    expect(sent).toEqual([
      { type: "data-usage", data: step1 },
      { type: "data-usage", data: step2 }
    ]);
  });
});
