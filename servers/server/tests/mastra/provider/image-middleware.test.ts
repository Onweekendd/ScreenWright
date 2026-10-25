import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/mastra/services/ai-assets/chat-image.server", () => ({ readStoredImage: vi.fn() }));

import { type ImageReader, inlineImages, MAX_TOOL_IMAGES, TOOL_IMAGES_FIELD } from "@/mastra/provider/image-middleware";

type Prompt = Parameters<typeof inlineImages>[0];

const INTERNAL = "http://localhost:9000/bucket/chat-images/c1/a.png";
const EXTERNAL = "https://example.com/pic.png";

/** 本系统资源返回二进制，其它一律视为外部图 */
const reader: ImageReader = async (url) =>
  url.includes("/chat-images/") ? { buffer: Buffer.from([1, 2, 3]), mime: "image/png" } : null;

const userWithImages = (...urls: string[]): Prompt[number] => ({
  role: "user",
  content: [
    { type: "text", text: "看看这张图" },
    ...urls.map((url) => ({ type: "file" as const, mediaType: "image/png", data: new URL(url) }))
  ]
});

const toolCall = (id: string): Prompt[number] => ({
  role: "assistant",
  content: [{ type: "tool-call", toolCallId: id, toolName: "captureCanvasTool", input: {} }]
});

const toolResult = (id: string, value: Record<string, unknown>): Prompt[number] => ({
  role: "tool",
  content: [
    {
      type: "tool-result",
      toolCallId: id,
      toolName: "captureCanvasTool",
      output: { type: "json", value: value as never }
    }
  ]
});

/** prompt 内容是联合类型，断言里只关心字段，统一摊平成记录数组 */
const partsOf = (msg: Prompt[number]) => msg.content as unknown as Array<Record<string, unknown>>;

const shot = (url: string, label = "画布截图") => ({ ok: true, [TOOL_IMAGES_FIELD]: [{ url, label }] });

describe("inlineImages：用户消息里的图", () => {
  it("本系统图换成二进制，并在末尾附 <attached-images> 保留 URL", async () => {
    const [msg] = await inlineImages([userWithImages(INTERNAL)], reader);

    const content = partsOf(msg);
    expect(content[1]).toMatchObject({ type: "file", mediaType: "image/png" });
    expect(content[1].data).toBeInstanceOf(Uint8Array);
    expect(content[2]).toMatchObject({ type: "text" });
    expect(content[2].text).toContain(`url="${INTERNAL}"`);
  });

  it("外部图原样放行 URL", async () => {
    const [msg] = await inlineImages([userWithImages(EXTERNAL)], reader);

    const file = partsOf(msg)[1];
    expect(file.data).toBeInstanceOf(URL);
    expect((file.data as URL).href).toBe(EXTERNAL);
  });

  it("同一 URL 出现两次（parts + experimental_attachments）只保留一张", async () => {
    const [msg] = await inlineImages([userWithImages(INTERNAL, INTERNAL)], reader);

    const files = partsOf(msg).filter((p) => p.type === "file");
    expect(files).toHaveLength(1);
  });

  it("读图失败时换成文字占位，不让整次请求失败", async () => {
    const failing: ImageReader = async () => {
      throw new Error("object not found");
    };
    const [msg] = await inlineImages([userWithImages(INTERNAL)], failing);

    const content = partsOf(msg);
    expect(content.some((p) => p.type === "file")).toBe(false);
    expect(content[1].text).toContain("图片读取失败");
  });

  it("已是二进制的图不处理，也不附 URL 列表", async () => {
    const prompt: Prompt = [
      { role: "user", content: [{ type: "file", mediaType: "image/png", data: new Uint8Array([9]) }] }
    ];
    const [msg] = await inlineImages(prompt, reader);

    expect(msg).toEqual(prompt[0]);
  });
});

describe("inlineImages：工具产出的图", () => {
  it("在一整串连续 tool 消息之后插入一条 user 图片消息", async () => {
    const prompt: Prompt = [
      userWithImages(),
      toolCall("a"),
      toolResult("a", shot(INTERNAL, "画布截图 1920×1080")),
      toolResult("b", { ok: true })
    ];
    const result = await inlineImages(prompt, reader);

    expect(result.map((m) => m.role)).toEqual(["user", "assistant", "tool", "tool", "user"]);
    const injected = partsOf(result[4]);
    expect(injected[0].text).toContain("不是用户发言");
    expect(injected[0].text).toContain("画布截图 1920×1080");
    expect(injected[1]).toMatchObject({ type: "file", mediaType: "image/png" });
  });

  it("注入的消息插在 tool 消息之后、下一条 assistant 之前", async () => {
    const prompt: Prompt = [toolCall("a"), toolResult("a", shot(INTERNAL)), toolCall("b")];
    const result = await inlineImages(prompt, reader);

    expect(result.map((m) => m.role)).toEqual(["assistant", "tool", "user", "assistant"]);
  });

  it(`只注入最近 ${MAX_TOOL_IMAGES} 张，更早的不再重发`, async () => {
    const prompt: Prompt = [];
    for (let i = 0; i < MAX_TOOL_IMAGES + 2; i++) {
      prompt.push(toolCall(`c${i}`), toolResult(`c${i}`, shot(`${INTERNAL}?n=${i}`, `截图${i}`)));
    }
    const result = await inlineImages(prompt, reader);

    const injected = result.filter((m) => m.role === "user");
    expect(injected).toHaveLength(MAX_TOOL_IMAGES);
    const firstLabel = partsOf(injected[0])[0].text;
    expect(firstLabel).toContain("截图2");
  });

  it("text 类型的工具结果按 JSON 解析", async () => {
    const prompt: Prompt = [
      toolCall("a"),
      {
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: "a",
            toolName: "captureCanvasTool",
            output: { type: "text", value: JSON.stringify(shot(INTERNAL)) }
          }
        ]
      }
    ];
    const result = await inlineImages(prompt, reader);

    expect(result).toHaveLength(3);
  });

  describe("大图先缩小再给模型", () => {
    /** 高斯噪声压不下去，PNG 轻松到几 MB——和方舟生成的大屏效果图一个量级 */
    const bigPng = () =>
      sharp({
        create: {
          width: 2400,
          height: 1600,
          channels: 3,
          background: "#000",
          noise: { type: "gaussian", mean: 128, sigma: 40 }
        }
      })
        .png()
        .toBuffer();

    it("超过阈值的本系统图缩到长边 ≤1280 并转 JPEG", async () => {
      const buffer = await bigPng();
      expect(buffer.length).toBeGreaterThan(300 * 1024);
      const big: ImageReader = async () => ({ buffer, mime: "image/png" });

      const result = await inlineImages([toolCall("a"), toolResult("a", shot(INTERNAL))], big);

      const file = partsOf(result[2])[1];
      expect(file.mediaType).toBe("image/jpeg");
      const meta = await sharp(file.data as Uint8Array).metadata();
      expect(meta).toMatchObject({ format: "jpeg", width: 1280, height: 853 });
      expect((file.data as Uint8Array).length).toBeLessThan(buffer.length);
    });

    it("小图原样给，不重新编码", async () => {
      const result = await inlineImages([toolCall("a"), toolResult("a", shot(INTERNAL))], reader);

      const file = partsOf(result[2])[1];
      expect(file.mediaType).toBe("image/png");
      expect(Array.from(file.data as Uint8Array)).toEqual([1, 2, 3]);
    });

    it("大但解码不了的数据原样给，不因此丢图", async () => {
      const garbage: ImageReader = async () => ({ buffer: Buffer.alloc(400 * 1024, 7), mime: "image/png" });

      const result = await inlineImages([toolCall("a"), toolResult("a", shot(INTERNAL))], garbage);

      const file = partsOf(result[2])[1];
      expect(file.mediaType).toBe("image/png");
      expect((file.data as Uint8Array).length).toBe(400 * 1024);
    });
  });

  it("不带约定字段或字段不合法的工具结果不注入", async () => {
    const prompt: Prompt = [
      toolCall("a"),
      toolResult("a", { ok: true, url: INTERNAL }),
      toolCall("b"),
      toolResult("b", { [TOOL_IMAGES_FIELD]: [{ url: "data:image/png;base64,AAA", label: "x" }, { url: INTERNAL }] })
    ];
    const result = await inlineImages(prompt, reader);

    expect(result).toEqual(prompt);
  });
});
