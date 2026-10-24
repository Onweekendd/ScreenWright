import { beforeEach, describe, expect, it, vi } from "vitest";

const storage = vi.hoisted(() => ({ put: vi.fn() }));
vi.mock("@/lib/storage", () => ({ assetStore: () => ({ put: storage.put }) }));

const db = vi.hoisted(() => ({
  screen: { findUnique: vi.fn() },
  group: { findFirst: vi.fn(), create: vi.fn() },
  file: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn() }
}));

vi.mock("@/mastra/storage/prisma", () => ({
  prismaClient: { largeScreen: db.screen, minioGroup: db.group, minioFile: db.file }
}));

import { addAiAsset, addWorkspaceAsset, AI_GROUP_NAME, largeIdOf } from "@/mastra/services/ai-asset-library";

const input = { largeId: 5, name: "卡片底板", url: "http://store/generated-images/abc.png", generatedImageId: "img-1" };

beforeEach(() => {
  vi.clearAllMocks();
  db.screen.findUnique.mockResolvedValue({ userId: 7 });
  db.group.findFirst.mockResolvedValue({ id: 30 });
  db.file.findFirst.mockResolvedValue(null);
  db.file.findMany.mockResolvedValue([]);
  db.file.create.mockResolvedValue({ id: 100 });
  storage.put.mockImplementation(async (key: string, data: Buffer) => ({
    key,
    url: `http://store/${key}`,
    size: data.length
  }));
});

describe("largeIdOf", () => {
  it("工具入参 5_1 和蓝图的 screen_5_1 都取出大屏 id 5，格式不对返回 null", () => {
    expect(largeIdOf("5_1")).toBe(5);
    expect(largeIdOf("screen_29445_1")).toBe(29445);
    expect(largeIdOf("abc")).toBeNull();
  });
});

describe("addAiAsset", () => {
  it("联网素材可以指定独立分组", async () => {
    await addAiAsset({ ...input, groupName: "联网素材" });
    expect(db.group.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 7, type: 1, name: "联网素材" } })
    );
  });
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

describe("addAiAsset 传了 blobKey（文件归素材库自己）", () => {
  it("记下 blobKey 和文件大小：删素材时连带清掉文件、已用空间也算得对", async () => {
    await addAiAsset({ ...input, blobKey: "bi-assets/ai-7/h.png", resourceSize: 2048 });

    expect(db.file.create.mock.calls[0][0].data).toMatchObject({ blobKey: "bi-assets/ai-7/h.png", resourceSize: 2048 });
  });
});

describe("addWorkspaceAsset", () => {
  const upload = {
    largeId: 5,
    name: "卡片",
    bytes: Buffer.from("abc"),
    extension: ".png",
    contentType: "image/png",
    resourceType: 1 as const
  };

  it("key 带用户 id 和内容哈希；上传后进「AI 生成」分组，记 blobKey 和大小，返回最终 url", async () => {
    const result = await addWorkspaceAsset(upload);

    const [key, data, options] = storage.put.mock.calls[0];
    expect(key).toMatch(/^bi-assets\/ai-7\/[0-9a-f]{32}\.png$/);
    expect(data).toEqual(upload.bytes);
    expect(options).toEqual({ contentType: "image/png" });
    expect(db.file.create.mock.calls[0][0].data).toMatchObject({
      userId: 7,
      groupId: 30,
      largeId: 5,
      name: "卡片",
      url: `http://store/${key}`,
      blobKey: key,
      resourceSize: 3
    });
    expect(result).toEqual({ id: 100, reused: false, url: `http://store/${key}`, size: 3 });
  });

  it("同一个用户重复传同样的内容：同一个 key、同一个 url，素材库里不新建", async () => {
    db.file.findFirst.mockResolvedValue({ id: 55 });

    const first = await addWorkspaceAsset(upload);
    const second = await addWorkspaceAsset(upload);

    expect(storage.put.mock.calls[0][0]).toBe(storage.put.mock.calls[1][0]);
    expect(first).toMatchObject({ id: 55, reused: true });
    expect(second).toMatchObject({ id: 55, reused: true });
    expect(db.file.create).not.toHaveBeenCalled();
  });

  it("内容不同 key 不同；不同用户的同样内容也不共用文件", async () => {
    await addWorkspaceAsset(upload);
    await addWorkspaceAsset({ ...upload, bytes: Buffer.from("abd") });
    db.screen.findUnique.mockResolvedValue({ userId: 8 });
    await addWorkspaceAsset(upload);

    const keys = storage.put.mock.calls.map(([key]) => key as string);
    expect(new Set(keys).size).toBe(3);
    expect(keys[2]).toContain("/ai-8/");
  });

  it("大屏不存在：不上传文件，直接报错", async () => {
    db.screen.findUnique.mockResolvedValue(null);

    await expect(addWorkspaceAsset(upload)).rejects.toThrow("大屏 5 不存在");
    expect(storage.put).not.toHaveBeenCalled();
  });
});
