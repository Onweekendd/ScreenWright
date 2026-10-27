import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

const { store, files } = vi.hoisted(() => ({
  store: { get: vi.fn(), head: vi.fn(), put: vi.fn(), publicUrl: vi.fn(), keyFromUrl: vi.fn() },
  files: { findMany: vi.fn(), update: vi.fn() }
}));
vi.mock("@/lib/storage", () => ({ assetStore: () => store }));
vi.mock("@/mastra/storage/prisma", () => ({ prismaClient: { minioFile: files } }));

import {
  makeSystemMaterialThumbnail,
  optimizeSystemMaterialThumbnails
} from "@/mastra/services/ai-assets/system-material-thumbnails";

beforeEach(() => {
  vi.resetAllMocks();
  store.head.mockResolvedValue(null);
  store.publicUrl.mockImplementation((key) => `http://assets/${key}`);
});

describe("系统素材缩略图", () => {
  it("缩放到列表尺寸且保留透明通道，不改变原始像素文件", async () => {
    const original = await sharp({
      create: { width: 1200, height: 600, channels: 4, background: { r: 20, g: 80, b: 200, alpha: 0.5 } }
    })
      .png()
      .toBuffer();
    const thumbnail = await makeSystemMaterialThumbnail(original);
    const meta = await sharp(thumbnail).metadata();
    expect(meta).toMatchObject({ format: "webp", width: 320, height: 160, hasAlpha: true });
    expect(thumbnail.length).toBeLessThan(original.length);
    expect(await sharp(original).metadata()).toMatchObject({ width: 1200, height: 600, format: "png" });
  });

  it("只更新列表封面，原图地址保持不变", async () => {
    files.findMany.mockResolvedValue([{ id: 1, blobKey: "system/image.png", resourceType: 1, cover: null }]);
    store.get.mockResolvedValue(
      await sharp({ create: { width: 20, height: 20, channels: 4, background: "transparent" } })
        .png()
        .toBuffer()
    );
    const result = await optimizeSystemMaterialThumbnails();
    expect(result.created).toBe(1);
    expect(store.put).toHaveBeenCalledWith(
      expect.stringMatching(/^system-thumbnails\/v1\/.*\.webp$/),
      expect.any(Buffer),
      { contentType: "image/webp" }
    );
    const data = files.update.mock.calls[0][0].data;
    expect(data.cover).toContain("/system-thumbnails/v1/");
    expect(data).not.toHaveProperty("url");
    expect(data).not.toHaveProperty("blobKey");
  });

  it("重复执行跳过已存在的缩略图，不修改记录", async () => {
    files.findMany.mockResolvedValue([
      { id: 1, blobKey: "system/image.png", resourceType: 1, cover: "http://assets/system-thumbnails/v1/hash.webp" }
    ]);
    store.keyFromUrl.mockReturnValue("system-thumbnails/v1/hash.webp");
    store.head.mockResolvedValue({ size: 200 });
    expect(await optimizeSystemMaterialThumbnails()).toMatchObject({ created: 0, skipped: 1, failed: 0 });
    expect(files.update).not.toHaveBeenCalled();
    expect(store.get).not.toHaveBeenCalled();
  });

  it("将中文封面 URL 解码为对象存储实际使用的 key", async () => {
    files.findMany.mockResolvedValue([
      { id: 2, blobKey: "system/天气/01.png", resourceType: 1, cover: "http://assets/system/天气/cover_01.png" }
    ]);
    store.keyFromUrl.mockReturnValue("system/%E5%A4%A9%E6%B0%94/cover_01.png");
    store.get.mockResolvedValue(
      await sharp({ create: { width: 10, height: 10, channels: 4, background: "transparent" } })
        .png()
        .toBuffer()
    );
    expect(await optimizeSystemMaterialThumbnails()).toMatchObject({ created: 1, failed: 0 });
    expect(store.get).toHaveBeenCalledWith("system/天气/cover_01.png");
  });
});
