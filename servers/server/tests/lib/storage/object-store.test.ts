import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CompositeObjectStore } from "@/lib/storage/composite-object-store";
import { FsObjectStore } from "@/lib/storage/fs-object-store";
import type { ObjectStore } from "@/lib/storage/object-store";

let root: string;
let store: ObjectStore;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), "obj-store-"));
  store = new FsObjectStore({ root, publicBase: "http://localhost:4111" });
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

describe("FsObjectStore", () => {
  it("put 落盘并返回 /blobs/<key> URL", async () => {
    const res = await store.put("chat-images/c1/a.png", Buffer.from("hi"), { contentType: "image/png" });

    expect(res).toEqual({
      key: "chat-images/c1/a.png",
      url: "http://localhost:4111/blobs/chat-images/c1/a.png",
      size: 2
    });
    expect(fs.readFileSync(path.join(root, "chat-images/c1/a.png"), "utf-8")).toBe("hi");
  });

  it("get / getText 读回内容，缺失时抛错", async () => {
    await store.put("x/y.txt", Buffer.from("内容"));
    expect(await store.getText("x/y.txt")).toBe("内容");
    await expect(store.get("x/missing.txt")).rejects.toThrow();
  });

  it("head 返回大小，缺失返回 null", async () => {
    await store.put("a.bin", Buffer.alloc(10));
    expect(await store.head("a.bin")).toEqual({ size: 10 });
    expect(await store.head("nope.bin")).toBeNull();
  });

  it("list 非递归列出直接子项", async () => {
    await store.put("llm-records/t1/turn_00/step_00.json", Buffer.from("{}"));
    await store.put("llm-records/t1/turn_01/step_00.json", Buffer.from("{}"));
    await store.put("llm-records/t1/meta.json", Buffer.from("{}"));

    expect(await store.list("llm-records/t1")).toEqual({
      dirs: expect.arrayContaining(["turn_00", "turn_01"]),
      files: ["meta.json"]
    });
    expect(await store.list("llm-records/does-not-exist")).toEqual({ dirs: [], files: [] });
  });

  it("delete 幂等；路径穿越被挡下", async () => {
    await store.put("f.txt", Buffer.from("x"));
    await store.delete("f.txt");
    await store.delete("f.txt"); // 再删一次不报错
    expect(await store.head("f.txt")).toBeNull();
    await expect(store.get("../../etc/passwd")).rejects.toThrow(/路径穿越/);
  });

  it("keyFromUrl 从 /blobs/ URL 反解 key", () => {
    expect(store.keyFromUrl("http://host/blobs/chat-images/c1/a.png")).toBe("chat-images/c1/a.png");
    expect(store.keyFromUrl("http://host/screenwright/c1/a.png")).toBeNull();
  });
});

describe("CompositeObjectStore", () => {
  it("写主 + 镜像；镜像失败不阻断", async () => {
    const primary = new FsObjectStore({ root: path.join(root, "primary"), publicBase: "http://p" });
    const mirrorRoot = path.join(root, "mirror");
    const mirror = new FsObjectStore({ root: mirrorRoot, publicBase: "http://m" });
    const composite = new CompositeObjectStore(primary, mirror);

    const res = await composite.put("k.json", Buffer.from("v"));
    expect(res.url).toBe("http://p/blobs/k.json"); // 返回主副本信息
    expect(await mirror.getText("k.json")).toBe("v"); // 镜像也写了

    // 镜像后端坏掉：put 仍然成功（主副本写入），只打一条 warn
    fs.rmSync(mirrorRoot, { recursive: true, force: true });
    fs.writeFileSync(mirrorRoot, ""); // 占住路径，让镜像 mkdir 失败
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(composite.put("k2.json", Buffer.from("v2"))).resolves.toMatchObject({ key: "k2.json" });
    expect(await primary.getText("k2.json")).toBe("v2");
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("读主，主缺失时回落镜像", async () => {
    const primary = new FsObjectStore({ root: path.join(root, "p2"), publicBase: "http://p" });
    const mirror = new FsObjectStore({ root: path.join(root, "m2"), publicBase: "http://m" });
    const composite = new CompositeObjectStore(primary, mirror);

    await mirror.put("only-in-mirror.json", Buffer.from("fromMirror"));
    expect(await composite.getText("only-in-mirror.json")).toBe("fromMirror");
    await expect(composite.get("nowhere.json")).rejects.toThrow();
  });

  it("list 只看主", async () => {
    const primary = new FsObjectStore({ root: path.join(root, "p3"), publicBase: "http://p" });
    const mirror = new FsObjectStore({ root: path.join(root, "m3"), publicBase: "http://m" });
    const composite = new CompositeObjectStore(primary, mirror);

    await mirror.put("t/turn_00/s.json", Buffer.from("{}"));
    expect(await composite.list("t")).toEqual({ dirs: [], files: [] });

    await primary.put("t/turn_00/s.json", Buffer.from("{}"));
    expect(await composite.list("t")).toEqual({ dirs: ["turn_00"], files: [] });
  });
});
