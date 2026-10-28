import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ put: vi.fn(), get: vi.fn() }));
vi.mock("@/lib/storage", () => ({
  assetStore: () => ({
    put: mocks.put,
    get: mocks.get,
    keyFromUrl: (url: string) =>
      url.startsWith("http://assets.test/blobs/") ? url.slice("http://assets.test/blobs/".length) : null
  })
}));

import { limitReadFileResult } from "@/mastra/lib/compaction/tool-result/limitReadFileResult";
import { inlineImages, TOOL_IMAGES_FIELD } from "@/mastra/provider/image-middleware";
import { readStoredImage } from "@/mastra/services/ai-assets/chat-image.server";
import { readFileTool } from "@/mastra/tools/file/read-file";
import { readFileState } from "@/mastra/tools/file/state";

interface ReadResult {
  type?: "image";
  content: string;
  totalLines?: number;
  encoding?: string;
  lineEnding?: string;
  isPartialView?: boolean;
  startCharOffset?: number;
  endCharOffset?: number;
  totalCharacters?: number;
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  size?: number;
  imagesForModel?: Array<{ url: string; label: string }>;
}
const read = readFileTool.execute as unknown as (input: {
  path: string;
  offset?: number;
  limit?: number;
  charOffset?: number;
  charLimit?: number;
}) => Promise<ReadResult>;
const tempRoot = path.resolve(os.tmpdir());
let workspace: string;
const stored = new Map<string, Buffer>();
const local = (name: string) => path.join(workspace, name);

beforeEach(async () => {
  vi.clearAllMocks();
  readFileState.clear();
  stored.clear();
  workspace = await fsp.mkdtemp(path.join(tempRoot, "read-file-test-"));
  vi.stubEnv("MASTRA_WORKSPACE_PATH", workspace);
  mocks.put.mockImplementation(async (key: string, bytes: Buffer) => {
    stored.set(key, Buffer.from(bytes));
    return { key, url: `http://assets.test/blobs/${key}`, size: bytes.length };
  });
  mocks.get.mockImplementation(async (key: string) => {
    const bytes = stored.get(key);
    if (!bytes) {
      throw new Error("missing stored image");
    }
    return bytes;
  });
});

afterEach(async () => {
  vi.unstubAllEnvs();
  readFileState.clear();
  const relative = path.relative(tempRoot, path.resolve(workspace));
  if (!relative.startsWith("read-file-test-") || relative.includes(path.sep)) {
    throw new Error(`Unexpected test workspace: ${workspace}`);
  }
  await fsp.rm(workspace, { recursive: true, force: true });
});

const image = () => sharp({ create: { width: 16, height: 8, channels: 3, background: "#735dff" } });

describe("read_file 图片读取", () => {
  it("读取本地 PNG 并返回中间件约定，不将图片字节写入文本或编辑状态", async () => {
    const bytes = await image().png().toBuffer();
    await fsp.writeFile(local("picture.PNG"), bytes);
    const result = await read({ path: "picture.PNG", offset: 100, limit: 1 });
    expect(result).toMatchObject({ type: "image", width: 16, height: 8, mimeType: "image/png", size: bytes.length });
    expect(result.imagesForModel).toEqual([{ url: result.url, label: "read_file：picture.PNG 16×8" }]);
    expect(result.content).not.toContain(bytes.toString("base64"));
    expect(readFileState.has(local("picture.PNG"))).toBe(false);
    expect(await fsp.readFile(local("picture.PNG"))).toEqual(bytes);
    const validation = await readFileTool.outputSchema!["~standard"].validate(result);
    expect(validation.issues).toBeUndefined();
  });

  it("工具返回结果经过现有中间件后，模型收到真实图片字节", async () => {
    const bytes = await image().jpeg().toBuffer();
    await fsp.writeFile(local("photo.jpg"), bytes);
    const result = await read({ path: "photo.jpg" });
    const prompt: Parameters<typeof inlineImages>[0] = [
      {
        role: "assistant",
        content: [
          { type: "tool-call", toolCallId: "read-image", toolName: "readFileTool", input: { path: "photo.jpg" } }
        ]
      },
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "read-image",
            toolName: "readFileTool",
            output: { type: "json", value: result as never }
          }
        ]
      }
    ];
    const messages = await inlineImages(prompt, readStoredImage);
    expect(messages.map((message) => message.role)).toEqual(["assistant", "tool", "user"]);
    const content = messages[2].content as Array<{ type: string; mediaType?: string; data?: Uint8Array }>;
    const file = content.find((part) => part.type === "file");
    expect(file?.mediaType).toBe("image/jpeg");
    expect(Buffer.from(file!.data!)).toEqual(bytes);
  });

  it("TIFF 转为 PNG 供已有中间件识别，原文件保持不变", async () => {
    const bytes = await image().tiff().toBuffer();
    await fsp.writeFile(local("photo.tiff"), bytes);
    const result = await read({ path: "photo.tiff" });
    expect(result.mimeType).toBe("image/png");
    const loaded = await readStoredImage(result.url!);
    expect(await sharp(loaded!.buffer).metadata()).toMatchObject({ format: "png", width: 16, height: 8 });
    expect(await fsp.readFile(local("photo.tiff"))).toEqual(bytes);
  });

  it("同内容使用同一个存储 key，文件被覆盖后旧工具结果仍指向原图", async () => {
    await fsp.writeFile(local("photo.png"), await image().png().toBuffer());
    const first = await read({ path: "photo.png" });
    const repeated = await read({ path: "photo.png" });
    expect(repeated.url).toBe(first.url);
    await fsp.writeFile(local("photo.png"), await image().resize(8, 4).png().toBuffer());
    const changed = await read({ path: "photo.png" });
    expect(changed.url).not.toBe(first.url);
    const old = await readStoredImage(first.url!);
    expect(await sharp(old!.buffer).metadata()).toMatchObject({ width: 16, height: 8 });
  });

  it("损坏图片明确报错，不返回假的可视结果", async () => {
    await fsp.writeFile(local("broken.png"), "not an image");
    await expect(read({ path: "broken.png" })).rejects.toThrow("Cannot decode image");
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("超过 50 MB 的图片在读取字节前被拒绝", async () => {
    await fsp.writeFile(local("large.png"), "");
    await fsp.truncate(local("large.png"), 50 * 1024 * 1024 + 1);
    await expect(read({ path: "large.png" })).rejects.toThrow("50 MB");
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("文本仍支持分页、换行信息和完整编辑状态", async () => {
    await fsp.writeFile(local("notes.txt"), "first\r\nsecond\r\nthird");
    const result = await read({ path: "notes.txt", offset: 2, limit: 1 });
    expect(result).toMatchObject({
      content: "second",
      totalLines: 3,
      encoding: "utf8",
      lineEnding: "CRLF",
      isPartialView: true
    });
    expect(result[TOOL_IMAGES_FIELD]).toBeUndefined();
    expect(readFileState.get(local("notes.txt"))?.content).toBe("first\nsecond\nthird");
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("行范围与字符范围使用同一套 LF 原文位置", async () => {
    await fsp.writeFile(local("ranges.txt"), "first\r\nsecond\r\nthird");
    const lines = await read({ path: "ranges.txt", offset: 2, limit: 1 });
    expect(lines).toMatchObject({ content: "second", startCharOffset: 6, endCharOffset: 12, totalCharacters: 18 });
    const chars = await read({ path: "ranges.txt", charOffset: 6, charLimit: 6 });
    expect(chars).toMatchObject({ content: "second", startCharOffset: 6, endCharOffset: 12, isPartialView: true });
    await expect(read({ path: "ranges.txt", offset: 2, charLimit: 2 })).rejects.toThrow("not both");
  });

  it("字符范围不截断 emoji，且越界读取返回空内容", async () => {
    await fsp.writeFile(local("unicode.txt"), "A😀B");
    expect(await read({ path: "unicode.txt", charOffset: 1, charLimit: 1 })).toMatchObject({
      content: "😀",
      startCharOffset: 1,
      endCharOffset: 3
    });
    expect(await read({ path: "unicode.txt", charOffset: 2, charLimit: 1 })).toMatchObject({
      content: "😀",
      startCharOffset: 1,
      endCharOffset: 3
    });
    expect(await read({ path: "unicode.txt", charOffset: 99, charLimit: 1 })).toMatchObject({
      content: "",
      startCharOffset: 4,
      endCharOffset: 4
    });
  });

  it("巨大单行 JSON 可以按限长结果的游标完整读回，不反复读取同一段", async () => {
    const content = JSON.stringify({ text: '中文😀\\"'.repeat(2000) });
    await fsp.writeFile(local("single-line.json"), content);
    const archiveOriginal = vi.fn().mockResolvedValue(".tool-results/archived.json");
    const budget = 1500;
    let next: { path: string; charOffset?: number; charLimit?: number } = { path: "single-line.json" };
    let recovered = "";
    for (let step = 0; step < content.length; step++) {
      const raw = await read(next);
      const limited = await limitReadFileResult({
        toolName: "readFileTool",
        toolCallId: `call-${step}`,
        args: next,
        result: raw,
        maxBytes: budget,
        archiveOriginal
      });
      const shown = (limited?.result ?? raw) as ReadResult & { nextRead?: typeof next };
      expect(Buffer.byteLength(JSON.stringify(shown))).toBeLessThanOrEqual(budget);
      expect(Buffer.from(shown.content, "utf8").toString("utf8")).toBe(shown.content);
      recovered += shown.content;
      if (!shown.nextRead && shown.endCharOffset === content.length) {
        break;
      }
      const cursor = shown.nextRead?.charOffset ?? shown.endCharOffset!;
      expect(cursor).toBeGreaterThan(next.charOffset ?? 0);
      next = shown.nextRead ?? { path: next.path, charOffset: cursor, charLimit: 100 };
    }
    expect(recovered).toBe(content);
    expect(archiveOriginal).toHaveBeenCalled();
    expect(readFileState.get(local("single-line.json"))?.content).toBe(content);
  });
});
