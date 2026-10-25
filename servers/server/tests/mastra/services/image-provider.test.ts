import { describe, expect, it } from "vitest";

import {
  buildImageRequest,
  buildOpenAiRequest,
  extractImage,
  imagesEndpoint,
  resolveGptImageSize,
  resolveImageApiStyle
} from "@/mastra/services/ai-generation/image-provider";

const input = { prompt: "画一张大屏背景", seed: 7, width: 1920, height: 1080 };
const args = { baseUrl: "https://llm-api.net/v1", apiKey: "k", modelId: "gpt-image-2", input };

describe("resolveImageApiStyle", () => {
  it("gpt-image / dall-e 系列走 openai，其余（seedream 等）走 ark", () => {
    expect(resolveImageApiStyle("gpt-image-2", {})).toBe("openai");
    expect(resolveImageApiStyle("GPT-Image-1", {})).toBe("openai");
    expect(resolveImageApiStyle("dall-e-3", {})).toBe("openai");
    expect(resolveImageApiStyle("doubao-seedream-5-0-pro-260628", {})).toBe("ark");
  });

  it("IMAGE_API_STYLE 可以强制指定——网关给模型改了名时用得上", () => {
    expect(resolveImageApiStyle("my-image-model", { IMAGE_API_STYLE: "openai" })).toBe("openai");
    expect(resolveImageApiStyle("gpt-image-2", { IMAGE_API_STYLE: "ark" })).toBe("ark");
    expect(resolveImageApiStyle("gpt-image-2", { IMAGE_API_STYLE: "乱写" })).toBe("openai");
  });
});

/**
 * gpt-image 中转的 size 规则（来自接口文档）：宽高是 16 的倍数、最长边 ≤3840、长短边比 ≤3:1、
 * 总像素 65.5 万~829 万；自定义分辨率只有部分分组可用。1920×1080 的 1080 不是 16 的倍数，直接发会被拒。
 */
describe("resolveGptImageSize", () => {
  it("1920×1080 落到文档列出的 2048×1152（同为 16:9，任何分组都能用）", () => {
    expect(resolveGptImageSize(1920, 1080)).toBe("2048x1152");
  });

  it("接近 16:9 的卡片尺寸也落到 16:9 的预设，并取面积最接近的那个", () => {
    expect(resolveGptImageSize(465, 259)).toBe("2048x1152");
    expect(resolveGptImageSize(3840, 2160)).toBe("3840x2160");
  });

  it("方形、3:2、竖版落到对应预设", () => {
    expect(resolveGptImageSize(1024, 1024)).toBe("1024x1024");
    expect(resolveGptImageSize(2000, 2000)).toBe("2048x2048");
    expect(resolveGptImageSize(1500, 1000)).toBe("1536x1024");
    expect(resolveGptImageSize(1000, 1500)).toBe("1024x1536");
  });

  it("与预设都对不上的比例走自定义：取 16 的倍数", () => {
    const [w, h] = resolveGptImageSize(1800, 600).split("x").map(Number);

    expect(w % 16).toBe(0);
    expect(h % 16).toBe(0);
  });

  it("不管输入多离谱，输出都满足文档的全部约束", () => {
    const sizes = [16, 100, 300, 465, 512, 777, 1080, 1366, 1920, 2500, 3840, 5000, 9000];
    for (const w of sizes) {
      for (const h of sizes) {
        const [rw, rh] = resolveGptImageSize(w, h).split("x").map(Number);
        const label = `${w}x${h} → ${rw}x${rh}`;
        expect(rw % 16, label).toBe(0);
        expect(rh % 16, label).toBe(0);
        expect(Math.max(rw, rh), label).toBeLessThanOrEqual(3840);
        expect(Math.max(rw, rh) / Math.min(rw, rh), label).toBeLessThanOrEqual(3);
        expect(rw * rh, label).toBeGreaterThanOrEqual(655_360);
        expect(rw * rh, label).toBeLessThanOrEqual(8_294_400);
      }
    }
  });
});

describe("buildOpenAiRequest（文生图）", () => {
  it("只发文档列出的字段：不带 seed / watermark / response_format（gpt-image 收到未知参数会 400）", () => {
    const req = buildOpenAiRequest(args);

    expect(req.url).toBe("https://llm-api.net/v1/images/generations");
    expect(JSON.parse(req.body as string)).toEqual({
      model: "gpt-image-2",
      prompt: "画一张大屏背景",
      n: 1,
      size: "2048x1152"
    });
  });

  it("鉴权与内容类型头齐全", () => {
    const { headers } = buildOpenAiRequest(args);

    expect(headers).toMatchObject({
      Authorization: "Bearer k",
      "Content-Type": "application/json",
      Accept: "application/json"
    });
  });

  it("baseUrl 误填了完整路径也落到同一个地址", () => {
    const req = buildOpenAiRequest({ ...args, baseUrl: "https://llm-api.net/v1/images/generations/" });

    expect(req.url).toBe("https://llm-api.net/v1/images/generations");
  });

  it("IMAGE_MODEL_QUALITY 取值合法才发 quality，乱写的忽略", () => {
    const ok = buildOpenAiRequest({ ...args, env: { IMAGE_MODEL_QUALITY: "high" } });
    const bad = buildOpenAiRequest({ ...args, env: { IMAGE_MODEL_QUALITY: "ultra" } });

    expect(JSON.parse(ok.body as string).quality).toBe("high");
    expect(JSON.parse(bad.body as string)).not.toHaveProperty("quality");
  });
});

describe("buildOpenAiRequest（图生图）", () => {
  const reference = Buffer.from([0xff, 0xd8, 0xff, 1, 2, 3]);

  it("走 /images/edits，multipart 上传参考图文件", async () => {
    const req = buildOpenAiRequest({ ...args, references: [reference] });

    expect(req.url).toBe("https://llm-api.net/v1/images/edits");
    const form = req.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("model")).toBe("gpt-image-2");
    expect(form.get("prompt")).toBe("画一张大屏背景");
    expect(form.get("size")).toBe("2048x1152");
    const file = form.get("image") as File;
    expect(file.type).toBe("image/jpeg");
    expect(file.name).toBe("reference.jpg");
    expect(Array.from(new Uint8Array(await file.arrayBuffer()))).toEqual(Array.from(reference));
  });

  it("不手写 Content-Type：multipart 的 boundary 要交给 fetch 生成", () => {
    const { headers } = buildOpenAiRequest({ ...args, references: [reference] });

    expect(headers).not.toHaveProperty("Content-Type");
    expect(headers.Authorization).toBe("Bearer k");
  });

  it("多张参考图按顺序重复传 image[]，不再传单数的 image", async () => {
    const second = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const req = buildOpenAiRequest({ ...args, references: [reference, second] });

    const form = req.body as FormData;
    expect(form.get("image")).toBeNull();
    const files = form.getAll("image[]") as File[];
    expect(files.map((file) => [file.name, file.type])).toEqual([
      ["reference-1.jpg", "image/jpeg"],
      ["reference-2.png", "image/png"]
    ]);
    expect(Array.from(new Uint8Array(await files[1].arrayBuffer()))).toEqual(Array.from(second));
  });
});

describe("buildImageRequest 按风格分发", () => {
  it("方舟（seedream）保持原样：带 seed / watermark / response_format，图生图是 JSON 里的 data URL", () => {
    const req = buildImageRequest({
      ...args,
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
      modelId: "doubao-seedream-5-0-pro-260628",
      references: [Buffer.from([1, 2, 3])]
    });

    expect(req.url).toBe("https://ark.cn-beijing.volces.com/api/v3/images/generations");
    const body = JSON.parse(req.body as string);
    expect(body).toMatchObject({ seed: 7, watermark: false, response_format: "url", size: "1920x1080" });
    expect(body.image).toMatch(/^data:image\/png;base64,/);
  });

  it("方舟多张参考图：image 是按顺序排的 data URL 数组", () => {
    const req = buildImageRequest({
      ...args,
      baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
      modelId: "doubao-seedream-5-0-pro-260628",
      references: [Buffer.from([0xff, 0xd8, 0xff, 1]), Buffer.from([1, 2, 3])]
    });

    const { image } = JSON.parse(req.body as string);
    expect(image).toHaveLength(2);
    expect(image[0]).toMatch(/^data:image\/jpeg;base64,/);
    expect(image[1]).toMatch(/^data:image\/png;base64,/);
  });

  it("gpt-image 走 openai 风格", () => {
    expect(buildImageRequest(args).url).toBe("https://llm-api.net/v1/images/generations");
    expect(JSON.parse(buildImageRequest(args).body as string)).not.toHaveProperty("seed");
  });
});

describe("imagesEndpoint", () => {
  it("两种写法落到同一个地址", () => {
    expect(imagesEndpoint("https://llm-api.net/v1")).toBe("https://llm-api.net/v1/images/generations");
    expect(imagesEndpoint("https://llm-api.net/v1/images/generations")).toBe(
      "https://llm-api.net/v1/images/generations"
    );
  });
});

/**
 * 这个网关文档把响应写成了对话补全格式（choices），而标准图片接口回的是 data[]。
 * 文档多半是复制错了，但不能赌——两种都得认。
 */
describe("extractImage", () => {
  it("标准形态：data[0].url / b64_json", () => {
    expect(extractImage({ data: [{ url: "https://cdn/x.png" }] })).toEqual({
      url: "https://cdn/x.png",
      b64_json: undefined
    });
    expect(extractImage({ data: [{ b64_json: "QUJD" }] })).toEqual({ url: undefined, b64_json: "QUJD" });
  });

  it("对话补全形态：markdown 图片链接", () => {
    const payload = {
      choices: [{ message: { content: "好的，已生成：\n\n![image](https://cdn.example.com/a/b.png?x=1&y=2)" } }]
    };

    expect(extractImage(payload)).toEqual({ url: "https://cdn.example.com/a/b.png?x=1&y=2" });
  });

  it("对话补全形态：裸链接、data URL", () => {
    expect(extractImage({ choices: [{ message: { content: "https://cdn/x.webp" } }] })).toEqual({
      url: "https://cdn/x.webp"
    });
    expect(extractImage({ choices: [{ message: { content: "data:image/png;base64,QUJDRA==" } }] })).toEqual({
      b64_json: "QUJDRA=="
    });
  });

  it("什么图都没有时返回 null，让上层报「没有返回任何图片」", () => {
    expect(extractImage({ data: [] })).toBeNull();
    expect(extractImage({ choices: [{ message: { content: "抱歉，无法生成" } }] })).toBeNull();
    expect(extractImage(null)).toBeNull();
    expect(extractImage({ error: { message: "x" } })).toBeNull();
  });
});
