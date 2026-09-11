/**
 * MinIO 实现。`minio` 包**懒加载**（`await import`）：只有当 STORAGE_DRIVER=minio
 * 或录制镜像开启时才会被 require，纯 fs 部署（开源 / 桌面版）不需要装这个包。
 *
 * 对象落在 `<bucket>/<key>`，key 由调用方给全（含业务前缀），本类不再拼前缀。
 */
import type { Client as MinioClient } from "minio";

import type { BlobList, HeadResult, ObjectStore, PutOptions, PutResult } from "./object-store";

export interface MinioObjectStoreOptions {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  bucket: string;
  /**
   * 对外可访问端点，形如 `cdn.example.com` 或 `https://cdn.example.com`。
   * 留空则用 `endPoint:port` 拼 `http://` URL。
   */
  publicEndpoint?: string;
}

async function drain(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (c: Buffer) => chunks.push(c));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return Buffer.concat(chunks);
}

export class MinioObjectStore implements ObjectStore {
  private readonly opts: MinioObjectStoreOptions;
  private readonly bucket: string;
  private readonly publicEndpoint: string;

  /** 懒加载 + 记忆化：首次真正用到时才 import minio 并建连接。 */
  private clientPromise?: Promise<MinioClient>;
  private bucketReady?: Promise<void>;

  constructor(opts: MinioObjectStoreOptions) {
    this.opts = opts;
    this.bucket = opts.bucket;
    this.publicEndpoint = opts.publicEndpoint || `${opts.endPoint}:${opts.port}`;
  }

  private client(): Promise<MinioClient> {
    if (!this.clientPromise) {
      this.clientPromise = import("minio").then(
        ({ Client }) =>
          new Client({
            endPoint: this.opts.endPoint,
            port: this.opts.port,
            useSSL: this.opts.useSSL,
            accessKey: this.opts.accessKey,
            secretKey: this.opts.secretKey
          })
      );
    }
    return this.clientPromise;
  }

  private ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        const c = await this.client();
        if (!(await c.bucketExists(this.bucket))) {
          await c.makeBucket(this.bucket);
        }
      })().catch((e) => {
        this.bucketReady = undefined; // 失败不缓存，下次重试
        throw e;
      });
    }
    return this.bucketReady;
  }

  private urlOf(key: string): string {
    return /^https?:\/\//i.test(this.publicEndpoint)
      ? `${this.publicEndpoint.replace(/\/$/, "")}/${this.bucket}/${key}`
      : `http://${this.publicEndpoint}/${this.bucket}/${key}`;
  }

  async put(key: string, data: Buffer, opts?: PutOptions): Promise<PutResult> {
    await this.ensureBucket();
    const c = await this.client();
    await c.putObject(this.bucket, key, data, data.length, {
      "Content-Type": opts?.contentType ?? "application/octet-stream"
    });
    return { key, url: this.urlOf(key), size: data.length };
  }

  async get(key: string): Promise<Buffer> {
    const c = await this.client();
    return drain(await c.getObject(this.bucket, key));
  }

  async getText(key: string, encoding: BufferEncoding = "utf-8"): Promise<string> {
    return (await this.get(key)).toString(encoding);
  }

  async head(key: string): Promise<HeadResult | null> {
    try {
      const c = await this.client();
      const s = await c.statObject(this.bucket, key);
      return { size: s.size, contentType: s.metaData?.["content-type"] };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const c = await this.client();
    await c.removeObject(this.bucket, key).catch(() => {});
  }

  async list(prefix: string): Promise<BlobList> {
    await this.ensureBucket();
    const c = await this.client();
    const p = prefix.endsWith("/") ? prefix : `${prefix}/`;
    const dirs: string[] = [];
    const files: string[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = c.listObjectsV2(this.bucket, p, false);
      stream.on("data", (item: { name?: string; prefix?: string }) => {
        if (item.prefix) {
          const name = item.prefix.slice(p.length).replace(/\/+$/, "");
          if (name) {
            dirs.push(name);
          }
        } else if (item.name) {
          const name = item.name.slice(p.length);
          if (name && !name.includes("/")) {
            files.push(name);
          }
        }
      });
      stream.on("end", () => resolve());
      stream.on("error", reject);
    });
    return { dirs, files };
  }

  publicUrl(key: string): string {
    return this.urlOf(key);
  }

  async signedUrl(key: string, expirySec = 3600): Promise<string> {
    const c = await this.client();
    return c.presignedGetObject(this.bucket, key, expirySec);
  }

  keyFromUrl(url: string): string | null {
    try {
      const { pathname } = new URL(url);
      const segments = pathname.replace(/^\/+/, "").split("/");
      // 首段是 bucket 名，其余拼回去就是 key
      return segments.length > 1 ? segments.slice(1).join("/") : null;
    } catch {
      return null;
    }
  }
}
