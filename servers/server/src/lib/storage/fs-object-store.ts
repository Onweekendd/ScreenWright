/**
 * 本地文件系统实现。对象落在 `<root>/<key>`，通过 `blob.route` 的 `GET /blobs/<key>` 对外服务。
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { BlobList, HeadResult, ObjectStore, PutOptions, PutResult } from "./object-store";

export interface FsObjectStoreOptions {
  /** 存储根目录（绝对路径） */
  root: string;
  /** 可公开访问地址前缀，末尾不带 "/"（如 `http://localhost:4111`） */
  publicBase: string;
}

/** 把 key 解析成 root 下的绝对路径，越权（路径穿越）返回 null。 */
export function resolveUnder(root: string, key: string): string | null {
  const abs = path.join(root, key);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    return null;
  }
  return abs;
}

export class FsObjectStore implements ObjectStore {
  private readonly root: string;
  private readonly publicBase: string;

  constructor(opts: FsObjectStoreOptions) {
    this.root = opts.root;
    this.publicBase = opts.publicBase.replace(/\/$/, "");
  }

  private urlOf(key: string): string {
    return `${this.publicBase}/blobs/${key}`;
  }

  private absOf(key: string): string {
    const abs = resolveUnder(this.root, key);
    if (!abs) {
      throw new Error(`[FsObjectStore] 非法 key（路径穿越）: ${key}`);
    }
    return abs;
  }

  async put(key: string, data: Buffer, _opts?: PutOptions): Promise<PutResult> {
    const abs = this.absOf(key);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, data);
    return { key, url: this.urlOf(key), size: data.length };
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.absOf(key));
  }

  async getText(key: string, encoding: BufferEncoding = "utf-8"): Promise<string> {
    return readFile(this.absOf(key), encoding);
  }

  async head(key: string): Promise<HeadResult | null> {
    try {
      const s = await stat(this.absOf(key));
      return { size: s.size };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const abs = resolveUnder(this.root, key);
    if (abs && existsSync(abs)) {
      await rm(abs, { force: true }).catch(() => {});
    }
  }

  async list(prefix: string): Promise<BlobList> {
    const abs = prefix ? this.absOf(prefix) : this.root;
    try {
      const entries = await readdir(abs, { withFileTypes: true });
      return {
        dirs: entries.filter((e) => e.isDirectory()).map((e) => e.name),
        files: entries.filter((e) => e.isFile()).map((e) => e.name)
      };
    } catch {
      return { dirs: [], files: [] };
    }
  }

  publicUrl(key: string): string {
    return this.urlOf(key);
  }

  async signedUrl(key: string): Promise<string> {
    return this.urlOf(key);
  }

  keyFromUrl(url: string): string | null {
    try {
      const { pathname } = new URL(url);
      const marker = "/blobs/";
      const at = pathname.indexOf(marker);
      if (at < 0) {
        return null;
      }
      return decodeURIComponent(pathname.slice(at + marker.length)).replace(/^\/+/, "");
    } catch {
      return null;
    }
  }
}
