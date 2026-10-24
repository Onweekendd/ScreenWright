import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { ResourceTypeEnum } from "@screenwright/types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  head: vi.fn(),
  get: vi.fn(),
  keyFromUrl: vi.fn(),
  addWorkspaceAsset: vi.fn()
}));

vi.mock("@/lib/storage", () => ({
  assetStore: () => ({ head: mocks.head, get: mocks.get, keyFromUrl: mocks.keyFromUrl })
}));
vi.mock("@/mastra/services/ai-asset-library", () => ({ addWorkspaceAsset: mocks.addWorkspaceAsset }));

import { MAX_ASSET_BYTES, pullAsset, pushAsset, safeFileName, screenKeyOf } from "@/mastra/services/workspace-assets";

const SCREEN = "9_1";
const ASSETS = "screen_9_1/assets";

let workspace: string;
const previousEnv = process.env.MASTRA_WORKSPACE_PATH;

beforeEach(async () => {
  vi.clearAllMocks();
  workspace = await fsp.mkdtemp(path.join(os.tmpdir(), "sw-assets-"));
  process.env.MASTRA_WORKSPACE_PATH = workspace;
  // 大屏工作区由数据同步建出来：测试里先放好 screen_9_1 和 screen_10_1
  await put("screen_9_1/info.json", "{}");
  await put("screen_10_1/info.json", "{}");
  // 默认：url 形如 http://blobs/<key>，能解析出 key；文件存在且很小
  mocks.keyFromUrl.mockImplementation((url: string) => (url.startsWith("http://blobs/") ? url.slice(13) : null));
  mocks.head.mockResolvedValue({ size: 3 });
  mocks.get.mockResolvedValue(Buffer.from("abc"));
});

afterEach(async () => {
  process.env.MASTRA_WORKSPACE_PATH = previousEnv;
  await fsp.rm(workspace, { recursive: true, force: true });
});

const read = (relative: string) => fsp.readFile(path.join(workspace, relative));
const put = async (relative: string, content: string | Buffer) => {
  const target = path.join(workspace, relative);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.writeFile(target, content);
};

describe("screenKeyOf", () => {
  it("带不带 screen_ 前缀都认；格式不对报错", () => {
    expect(screenKeyOf("9_1")).toBe("9_1");
    expect(screenKeyOf("screen_29445_2")).toBe("29445_2");
    expect(() => screenKeyOf("abc")).toThrow("screenId 格式不对");
    expect(() => screenKeyOf("../9_1")).toThrow("screenId 格式不对");
  });
});

describe("safeFileName", () => {
  it("去掉路径、系统不允许的字符和开头的点，限长，空了给默认名", () => {
    expect(safeFileName("a/b\\c.png")).toBe("c.png");
    expect(safeFileName('we:ir*d?"<>|.png')).toBe("we_ir_d_____.png");
    expect(safeFileName("..hidden.png")).toBe("hidden.png");
    expect(safeFileName("a\u0001b.png")).toBe("a_b.png");
    expect(safeFileName("字".repeat(300))).toHaveLength(120);
    expect(safeFileName("///")).toBe("asset");
  });
});

describe("pullAsset 拉到大屏自己的 assets 目录", () => {
  it("落在 screen_{id}/assets/ 下，返回最终位置（相对工作区、正斜杠）和绝对路径，内容一致", async () => {
    const pulled = await pullAsset({ url: "http://blobs/generated-images/a.png" }, SCREEN);

    expect(pulled).toMatchObject({ path: `${ASSETS}/a.png`, size: 3, reused: false });
    expect(pulled.absolutePath).toBe(path.join(workspace, "screen_9_1", "assets", "a.png"));
    expect((await read(`${ASSETS}/a.png`)).toString()).toBe("abc");
  });

  it("不同大屏各有各的 assets，同名文件互不影响", async () => {
    mocks.get.mockResolvedValueOnce(Buffer.from("for-9")).mockResolvedValueOnce(Buffer.from("for-10"));

    const first = await pullAsset({ url: "http://blobs/a.png" }, "9_1");
    const second = await pullAsset({ url: "http://blobs/a.png" }, "10_1");

    expect(first.path).toBe("screen_9_1/assets/a.png");
    expect(second.path).toBe("screen_10_1/assets/a.png");
    expect((await read("screen_9_1/assets/a.png")).toString()).toBe("for-9");
    expect((await read("screen_10_1/assets/a.png")).toString()).toBe("for-10");
  });

  it("可以直接给对象存储的 key", async () => {
    const pulled = await pullAsset({ url: "bi-assets/x/b.png" }, SCREEN);

    expect(mocks.head).toHaveBeenCalledWith("bi-assets/x/b.png");
    expect(pulled.path).toBe(`${ASSETS}/b.png`);
  });

  it("name 指定落地文件名，子目录 dir 在 assets/ 下（写不写 assets/ 前缀都行）", async () => {
    const named = await pullAsset({ url: "http://blobs/a.png", name: "ref.png" }, SCREEN, "refs");
    const prefixed = await pullAsset({ url: "http://blobs/a.png", name: "ref2.png" }, SCREEN, "assets/refs");

    expect(named.path).toBe(`${ASSETS}/refs/ref.png`);
    expect(prefixed.path).toBe(`${ASSETS}/refs/ref2.png`);
  });

  it("工作区里已有同名、内容一样的文件：复用，不重复写", async () => {
    await put(`${ASSETS}/a.png`, "abc");

    const pulled = await pullAsset({ url: "http://blobs/a.png" }, SCREEN);

    expect(pulled).toMatchObject({ path: `${ASSETS}/a.png`, reused: true });
  });

  it("同名但内容不同：改名避让，旧文件原样保留，返回新位置", async () => {
    await put(`${ASSETS}/a.png`, "old");
    await put(`${ASSETS}/a-1.png`, "also different");

    const pulled = await pullAsset({ url: "http://blobs/a.png" }, SCREEN);

    expect(pulled.path).toBe(`${ASSETS}/a-2.png`);
    expect((await read(`${ASSETS}/a.png`)).toString()).toBe("old");
    expect((await read(`${ASSETS}/a-2.png`)).toString()).toBe("abc");
  });

  it("dir 想跳出 assets/ 就拒绝", async () => {
    await expect(pullAsset({ url: "http://blobs/a.png" }, SCREEN, "../component")).rejects.toThrow(
      "目录只能在 screen_9_1/assets/ 里面"
    );
  });

  it("大屏工作区不存在：不替它建目录，直接说明", async () => {
    await expect(pullAsset({ url: "http://blobs/a.png" }, "999_1")).rejects.toThrow("大屏工作区不存在：screen_999_1");
    await expect(fsp.stat(path.join(workspace, "screen_999_1"))).rejects.toThrow();
  });

  it("screenId 格式不对拒绝", async () => {
    await expect(pullAsset({ url: "http://blobs/a.png" }, "../x")).rejects.toThrow("screenId 格式不对");
  });

  it("不是本系统存储里的地址（外部 url）拒绝，不去下载", async () => {
    await expect(pullAsset({ url: "https://evil.example/x.png" }, SCREEN)).rejects.toThrow("不是本系统存储里的文件");
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("key 里带 .. 拒绝", async () => {
    await expect(pullAsset({ url: "bi-assets/../secret.png" }, SCREEN)).rejects.toThrow("不是本系统存储里的文件");
  });

  it("存储里没有这个文件：说明是 url 抄错的可能", async () => {
    mocks.head.mockResolvedValue(null);

    await expect(pullAsset({ url: "http://blobs/typo.png" }, SCREEN)).rejects.toThrow("存储里没有这个文件");
  });

  it("文件超过上限拒绝，不读进内存", async () => {
    mocks.head.mockResolvedValue({ size: MAX_ASSET_BYTES + 1 });

    await expect(pullAsset({ url: "http://blobs/big.mp4" }, SCREEN)).rejects.toThrow("文件太大");
    expect(mocks.get).not.toHaveBeenCalled();
  });
});

describe("pushAsset 传到存储并进素材库", () => {
  beforeEach(() => {
    mocks.addWorkspaceAsset.mockResolvedValue({
      id: 42,
      reused: false,
      url: "http://blobs/bi-assets/ai-1/h.png",
      size: 3
    });
  });

  it("读这个大屏 assets/ 里的文件，带上类型交给素材库，返回最终 url 和素材 id", async () => {
    await put(`${ASSETS}/card.png`, "abc");

    const pushed = await pushAsset({ path: `${ASSETS}/card.png` }, SCREEN, 5);

    expect(mocks.addWorkspaceAsset).toHaveBeenCalledWith({
      largeId: 5,
      name: "card",
      bytes: Buffer.from("abc"),
      extension: ".png",
      contentType: "image/png",
      resourceType: ResourceTypeEnum.image
    });
    expect(pushed).toEqual({ libraryFileId: 42, url: "http://blobs/bi-assets/ai-1/h.png", size: 3, reused: false });
  });

  it("只写 assets/ 里的相对路径也行", async () => {
    await put(`${ASSETS}/refs/a.png`, "abc");

    await pushAsset({ path: "refs/a.png" }, SCREEN, 5);

    expect(mocks.addWorkspaceAsset).toHaveBeenCalledWith(expect.objectContaining({ name: "a" }));
  });

  it("name 指定素材名；视频按视频类型传", async () => {
    await put(`${ASSETS}/loop.mp4`, "v");

    await pushAsset({ path: `${ASSETS}/loop.mp4`, name: "动态背景" }, SCREEN, 5);

    expect(mocks.addWorkspaceAsset).toHaveBeenCalledWith(
      expect.objectContaining({ name: "动态背景", contentType: "video/mp4", resourceType: ResourceTypeEnum.video })
    );
  });

  it("只收这个大屏 assets/ 里的文件：组件文件、别的大屏的素材、跳出目录的路径都拒绝", async () => {
    await put("screen_9_1/component/1_a.json", "{}");
    await put("screen_10_1/assets/other.png", "x");
    await put("screen_9_1/outside.png", "x");

    await expect(pushAsset({ path: "screen_9_1/component/1_a.json" }, SCREEN, 5)).rejects.toThrow(
      "只能上传 screen_9_1/assets/ 目录里的文件"
    );
    await expect(pushAsset({ path: "screen_10_1/assets/other.png" }, SCREEN, 5)).rejects.toThrow(
      "只能上传 screen_9_1/assets/ 目录里的文件"
    );
    await expect(pushAsset({ path: "screen_9_1/outside.png" }, SCREEN, 5)).rejects.toThrow(
      "只能上传 screen_9_1/assets/ 目录里的文件"
    );
    await expect(pushAsset({ path: "../outside.png" }, SCREEN, 5)).rejects.toThrow("只能上传");
    expect(mocks.addWorkspaceAsset).not.toHaveBeenCalled();
  });

  it("符号链接指到 assets 之外，按真实位置拒绝", async () => {
    await put("screen_9_1/info-copy.png", "secret");
    await fsp.mkdir(path.join(workspace, "screen_9_1", "assets"), { recursive: true });
    try {
      await fsp.symlink(
        path.join(workspace, "screen_9_1", "info-copy.png"),
        path.join(workspace, "screen_9_1", "assets", "link.png")
      );
    } catch {
      return; // 没有创建符号链接的权限（Windows 普通用户）：这个环境测不了
    }

    await expect(pushAsset({ path: `${ASSETS}/link.png` }, SCREEN, 5)).rejects.toThrow("只能上传");
  });

  it("文件不存在、是目录、类型不支持、太大都拒绝", async () => {
    await put(`${ASSETS}/data.json`, "{}");
    await fsp.mkdir(path.join(workspace, "screen_9_1", "assets", "folder.png"), { recursive: true });
    await put(`${ASSETS}/big.png`, Buffer.alloc(1));
    await fsp.truncate(path.join(workspace, "screen_9_1", "assets", "big.png"), MAX_ASSET_BYTES + 1);

    await expect(pushAsset({ path: `${ASSETS}/none.png` }, SCREEN, 5)).rejects.toThrow("文件不存在");
    await expect(pushAsset({ path: `${ASSETS}/folder.png` }, SCREEN, 5)).rejects.toThrow("不是文件");
    await expect(pushAsset({ path: `${ASSETS}/data.json` }, SCREEN, 5)).rejects.toThrow("素材库只收图片和视频");
    await expect(pushAsset({ path: `${ASSETS}/big.png` }, SCREEN, 5)).rejects.toThrow("文件太大");
  });
});
