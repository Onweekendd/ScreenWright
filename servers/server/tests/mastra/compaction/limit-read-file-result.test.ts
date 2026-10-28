import { describe, expect, it, vi } from "vitest";

import { limitReadFileResult } from "@/mastra/lib/compaction/tool-result/limitReadFileResult";

const textResult = (content: string) => ({
  content,
  totalLines: content.split("\n").length,
  encoding: "utf8",
  lineEnding: "LF",
  isPartialView: false,
  startCharOffset: 0,
  endCharOffset: content.length,
  totalCharacters: content.length,
  schemaDoc: "skills/text.md"
});
const input = (content: string, maxBytes = 1500) => ({
  toolName: "readFileTool",
  toolCallId: "call",
  args: { path: "screen_1/component/1.json" },
  result: textResult(content),
  maxBytes,
  archiveOriginal: vi.fn().mockResolvedValue(".tool-results/original.json")
});

describe("readFileTool 新结果限长", () => {
  it("只统计返回内容；入参再大也不改变未超限的结果", async () => {
    const value = input("small");
    value.args.path = "x".repeat(100_000);
    expect(await limitReadFileResult(value)).toBeUndefined();
    expect(value.archiveOriginal).not.toHaveBeenCalled();
  });

  it("恰好达到字节预算时保持原样", async () => {
    const value = input("中文😀");
    value.maxBytes = Buffer.byteLength(JSON.stringify(value.result));
    expect(await limitReadFileResult(value)).toBeUndefined();
  });

  it.each(["中文😀".repeat(2000), '"\\\t\n'.repeat(2000), "\n" + "x".repeat(10000)])(
    "超限时连同元数据、转义与继续读取指令一起满足预算（案例 %#）",
    async (content) => {
      const value = input(content);
      const replacement = (await limitReadFileResult(value))!.result as ReturnType<typeof textResult> & {
        truncated: boolean;
        archivePath: string;
        nextRead: { path: string; charOffset: number; charLimit: number };
      };
      expect(Buffer.byteLength(JSON.stringify(replacement))).toBeLessThanOrEqual(value.maxBytes);
      expect(replacement.content.length).toBeGreaterThan(0);
      expect(content.startsWith(replacement.content)).toBe(true);
      expect(Buffer.from(replacement.content, "utf8").toString("utf8")).toBe(replacement.content);
      expect(replacement).toMatchObject({
        encoding: "utf8",
        lineEnding: "LF",
        isPartialView: true,
        truncated: true,
        schemaDoc: "skills/text.md",
        archivePath: ".tool-results/original.json"
      });
      expect(replacement.nextRead).toMatchObject({ path: value.args.path, charOffset: replacement.content.length });
      expect(value.result.content).toBe(content);
    }
  );

  it("已读取的局部范围继续使用原文件绝对字符位置", async () => {
    const value = input("many lines\n".repeat(1000));
    value.result.startCharOffset = 500;
    value.result.endCharOffset = 500 + value.result.content.length;
    const replacement = (await limitReadFileResult(value))!.result as {
      content: string;
      nextRead: { charOffset: number };
    };
    expect(replacement.content.endsWith("\n")).toBe(true);
    expect(replacement.nextRead.charOffset).toBe(500 + replacement.content.length);
  });

  it("图片、其他工具和未知结构不做文本裁剪", async () => {
    const archiveOriginal = vi.fn();
    const base = { ...input("large".repeat(10000)), archiveOriginal };
    expect(await limitReadFileResult({ ...base, toolName: "editFilesTool" })).toBeUndefined();
    expect(
      await limitReadFileResult({ ...base, result: { ...base.result, type: "image", imagesForModel: [] } })
    ).toBeUndefined();
    expect(await limitReadFileResult({ ...base, result: "plain string" })).toBeUndefined();
    expect(archiveOriginal).not.toHaveBeenCalled();
  });

  it("预算连元数据也放不下时明确失败，交给外围保留原结果", async () => {
    await expect(limitReadFileResult(input("large".repeat(1000), 10))).rejects.toThrow("budget is too small");
  });
});
