import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as WorkspaceAssets from "@/mastra/services/workspace-assets";

const mocks = vi.hoisted(() => ({ pullAsset: vi.fn(), pushAsset: vi.fn() }));

vi.mock("@/mastra/services/workspace-assets", async (importOriginal) => ({
  ...(await importOriginal<typeof WorkspaceAssets>()),
  pullAsset: mocks.pullAsset,
  pushAsset: mocks.pushAsset
}));

import { MAX_PULL_FILES, pullAssetsInputSchema, pullAssetsTool } from "@/mastra/tools/pull-assets";
import { MAX_PUSH_FILES, pushAssetsInputSchema, pushAssetsTool } from "@/mastra/tools/push-assets";

type Execute = (input: Record<string, unknown>) => Promise<{ files: Array<Record<string, unknown>> }>;
const pull = pullAssetsTool.execute as unknown as Execute;
const push = pushAssetsTool.execute as unknown as Execute;

beforeEach(() => {
  vi.clearAllMocks();
});

/** 把 n 个调用同时挂住，直到全部都开始了才放行：证明是并行，不是一个等一个 */
const gate = (count: number) => {
  let started = 0;
  let release!: () => void;
  const open = new Promise<void>((resolve) => (release = resolve));
  return {
    enter: async () => {
      started += 1;
      await open;
    },
    allStarted: () => vi.waitFor(() => expect(started).toBe(count)),
    release: () => release()
  };
};

describe("pullAssetsTool", () => {
  it("多个文件并行下载，结果按入参顺序，每个带最终位置", async () => {
    const g = gate(3);
    mocks.pullAsset.mockImplementation(async ({ url }: { url: string }) => {
      await g.enter();
      return { path: `assets/${url}.png`, absolutePath: `/w/assets/${url}.png`, size: 1, reused: false };
    });

    const pending = pull({ screenId: "5_1", files: [{ url: "a" }, { url: "b" }, { url: "c" }] });
    await g.allStarted();
    g.release();
    const result = await pending;

    expect(result.files.map((file) => [file.index, file.path])).toEqual([
      [0, "assets/a.png"],
      [1, "assets/b.png"],
      [2, "assets/c.png"]
    ]);
  });

  it("dir 原样带给每个文件", async () => {
    mocks.pullAsset.mockResolvedValue({ path: "assets/refs/a.png", absolutePath: "/w", size: 1, reused: false });

    await pull({ screenId: "5_1", files: [{ url: "a" }], dir: "refs" });

    expect(mocks.pullAsset).toHaveBeenCalledWith({ url: "a" }, "5_1", "refs");
  });

  it("部分失败：成功的照常返回，失败的写明原因，不连累其他", async () => {
    mocks.pullAsset.mockImplementation(async ({ url }: { url: string }) => {
      if (url === "bad") {
        throw new Error("存储里没有这个文件");
      }
      return { path: `assets/${url}.png`, absolutePath: "/w", size: 1, reused: false };
    });

    const result = await pull({ screenId: "5_1", files: [{ url: "a" }, { url: "bad" }] });

    expect(result.files[0]).toMatchObject({ index: 0, path: "assets/a.png" });
    expect(result.files[1]).toEqual({ index: 1, source: "bad", error: "存储里没有这个文件" });
  });

  it("全部失败才算工具失败，错误里写出每个的原因", async () => {
    mocks.pullAsset.mockRejectedValue(new Error("没有"));

    await expect(pull({ screenId: "5_1", files: [{ url: "a" }, { url: "b" }] })).rejects.toThrow(
      "2 个文件全部没拉下来：[1] 没有；[2] 没有"
    );
  });

  it(`入参至少 1 个、最多 ${MAX_PULL_FILES} 个`, () => {
    const many = (n: number) => ({ screenId: "5_1", files: Array.from({ length: n }, () => ({ url: "a" })) });

    expect(pullAssetsInputSchema.safeParse(many(MAX_PULL_FILES)).success).toBe(true);
    expect(pullAssetsInputSchema.safeParse(many(MAX_PULL_FILES + 1)).success).toBe(false);
    expect(pullAssetsInputSchema.safeParse(many(0)).success).toBe(false);
  });
});

describe("pushAssetsTool", () => {
  it("多个文件并行上传，结果按入参顺序，每个带最终 url 和素材 id；大屏 id 从 screenId 解析", async () => {
    const g = gate(2);
    mocks.pushAsset.mockImplementation(async ({ path }: { path: string }) => {
      await g.enter();
      return { libraryFileId: path === "assets/a.png" ? 1 : 2, url: `http://x/${path}`, size: 3, reused: false };
    });

    const pending = push({ screenId: "5_1", files: [{ path: "assets/a.png" }, { path: "assets/b.png" }] });
    await g.allStarted();
    g.release();
    const result = await pending;

    expect(mocks.pushAsset).toHaveBeenCalledWith({ path: "assets/a.png" }, "5_1", 5);
    expect(result.files.map((file) => [file.index, file.libraryFileId, file.url])).toEqual([
      [0, 1, "http://x/assets/a.png"],
      [1, 2, "http://x/assets/b.png"]
    ]);
  });

  it("部分失败：成功的照常返回，失败的写明原因", async () => {
    mocks.pushAsset.mockImplementation(async ({ path }: { path: string }) => {
      if (path === "assets/x.json") {
        throw new Error("素材库只收图片和视频");
      }
      return { libraryFileId: 1, url: "http://x/a.png", size: 3, reused: true };
    });

    const result = await push({ screenId: "5_1", files: [{ path: "assets/a.png" }, { path: "assets/x.json" }] });

    expect(result.files[0]).toMatchObject({ index: 0, libraryFileId: 1, reused: true });
    expect(result.files[1]).toEqual({ index: 1, path: "assets/x.json", error: "素材库只收图片和视频" });
  });

  it("全部失败才算工具失败", async () => {
    mocks.pushAsset.mockRejectedValue(new Error("大屏 5 不存在"));

    await expect(push({ screenId: "5_1", files: [{ path: "assets/a.png" }] })).rejects.toThrow(
      "1 个文件全部没传上去：[1] 大屏 5 不存在"
    );
  });

  it("screenId 格式不对：一个文件都不传，直接说明", async () => {
    await expect(push({ screenId: "abc", files: [{ path: "assets/a.png" }] })).rejects.toThrow("screenId 格式不对");
    expect(mocks.pushAsset).not.toHaveBeenCalled();
  });

  it(`入参至少 1 个、最多 ${MAX_PUSH_FILES} 个`, () => {
    const many = (n: number) => ({
      screenId: "5_1",
      files: Array.from({ length: n }, () => ({ path: "assets/a.png" }))
    });

    expect(pushAssetsInputSchema.safeParse(many(MAX_PUSH_FILES)).success).toBe(true);
    expect(pushAssetsInputSchema.safeParse(many(MAX_PUSH_FILES + 1)).success).toBe(false);
    expect(pushAssetsInputSchema.safeParse(many(0)).success).toBe(false);
  });
});
