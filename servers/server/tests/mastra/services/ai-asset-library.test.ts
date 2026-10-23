import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  screen: { findUnique: vi.fn() },
  group: { findFirst: vi.fn(), create: vi.fn() },
  file: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() }
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: { largeScreen: db.screen, minioGroup: db.group, minioFile: db.file }
}));

import { addAiAsset, AI_GROUP_NAME, largeIdOf } from "@/mastra/services/ai-asset-library";

const input = { largeId: 5, name: "卡片底板", url: "http://store/generated-images/abc.png", generatedImageId: "img-1" };

beforeEach(() => {
  vi.clearAllMocks();
  db.screen.findUnique.mockResolvedValue({ userId: 7 });
  db.group.findFirst.mockResolvedValue({ id: 30 });
  db.file.findFirst.mockResolvedValue(null);
  db.file.findMany.mockResolvedValue([]);
  db.file.create.mockResolvedValue({ id: 100 });
});

describe("largeIdOf", () => {
  it("工具入参 5_1 和蓝图的 screen_5_1 都取出大屏 id 5，格式不对返回 null", () => {
    expect(largeIdOf("5_1")).toBe(5);
    expect(largeIdOf("screen_29445_1")).toBe(29445);
    expect(largeIdOf("abc")).toBeNull();
  });
});

describe("addAiAsset", () => {
  it("放进大屏所有者的「AI 生成」分组，算个人页面资产（所有大屏通用），不记 blobKey", async () => {
    const result = await addAiAsset(input);

    expect(result).toEqual({ id: 100, reused: false });
    const { data } = db.file.create.mock.calls[0][0];
    expect(data).toMatchObject({
      userId: 7,
      name: "卡片底板",
      fileName: "png",
      url: input.url,
      resourceType: 1,
      fileType: 2,
      groupId: 30,
      largeId: 5,
      generatedImageId: "img-1"
    });
    // 文件归生图缓存所有：素材库删素材会删 blobKey 指向的文件
    expect(data).not.toHaveProperty("blobKey");
  });

  it("同一个用户已经有这个 url 就不再新建", async () => {
    db.file.findFirst.mockResolvedValue({ id: 55 });

    expect(await addAiAsset(input)).toEqual({ id: 55, reused: true });
    expect(db.file.create).not.toHaveBeenCalled();
  });

  it("参考图里是素材库素材的，按参考图顺序记成素材 id；截图之类找不到的跳过", async () => {
    db.file.findMany.mockResolvedValue([
      { id: 2, url: "http://store/b.png" },
      { id: 1, url: "http://store/a.png" }
    ]);

    await addAiAsset({
      ...input,
      referenceUrls: ["http://store/a.png", "http://store/shot.jpg", "http://store/b.png"]
    });

    expect(db.file.create.mock.calls[0][0].data.referenceFileIds).toEqual([1, 2]);
  });

  it("用户还没有「AI 生成」分组时自动建；同时进来的几次只建一个", async () => {
    db.group.findFirst.mockResolvedValue(null);
    let release!: (value: { id: number }) => void;
    db.group.create.mockReturnValue(new Promise((resolve) => (release = resolve)));

    const pending = Promise.all([addAiAsset(input), addAiAsset({ ...input, url: "http://store/other.png" })]);
    await vi.waitFor(() => expect(db.group.create).toHaveBeenCalled());
    release({ id: 31 });
    await pending;

    expect(db.group.create).toHaveBeenCalledTimes(1);
    expect(db.group.create.mock.calls[0][0].data).toMatchObject({ userId: 7, name: AI_GROUP_NAME, type: 1 });
    expect(db.file.create.mock.calls.map((call) => call[0].data.groupId)).toEqual([31, 31]);
  });

  it("大屏不存在时报错，不建素材", async () => {
    db.screen.findUnique.mockResolvedValue(null);

    await expect(addAiAsset(input)).rejects.toThrow("大屏 5 不存在");
    expect(db.file.create).not.toHaveBeenCalled();
  });
});
