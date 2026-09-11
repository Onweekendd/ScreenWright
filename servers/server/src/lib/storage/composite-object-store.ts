/**
 * 组合 store：写主 + 镜像，读主回落镜像。
 *
 * 录制归档用它：主 = 本地文件系统（唯一事实来源，恒写），镜像 = MinIO（可选，集中存放供
 * agent-trace / 离线评估读）。镜像写失败只告警不阻断——录制是旁路，绝不能拖垮主流程。
 * 列举只看主：跨重启推导 turn/step 序号读本地即可，既快又不占对象存储请求配额。
 */
import type { BlobList, HeadResult, ObjectStore, PutOptions, PutResult } from "./object-store";

export class CompositeObjectStore implements ObjectStore {
  constructor(
    private readonly primary: ObjectStore,
    private readonly mirror: ObjectStore
  ) {}

  async put(key: string, data: Buffer, opts?: PutOptions): Promise<PutResult> {
    const result = await this.primary.put(key, data, opts);
    await this.mirror.put(key, data, opts).catch((e) => {
      console.warn(`[CompositeObjectStore] 镜像写入失败，保留主副本: ${key}`, e);
    });
    return result;
  }

  async get(key: string): Promise<Buffer> {
    try {
      return await this.primary.get(key);
    } catch (e) {
      try {
        return await this.mirror.get(key);
      } catch {
        throw e;
      }
    }
  }

  async getText(key: string, encoding?: BufferEncoding): Promise<string> {
    try {
      return await this.primary.getText(key, encoding);
    } catch (e) {
      try {
        return await this.mirror.getText(key, encoding);
      } catch {
        throw e;
      }
    }
  }

  async head(key: string): Promise<HeadResult | null> {
    return (await this.primary.head(key)) ?? (await this.mirror.head(key));
  }

  async delete(key: string): Promise<void> {
    await this.primary.delete(key);
    await this.mirror.delete(key).catch(() => {});
  }

  list(prefix: string): Promise<BlobList> {
    return this.primary.list(prefix);
  }

  publicUrl(key: string): string {
    return this.primary.publicUrl(key);
  }

  signedUrl(key: string, expirySec?: number): Promise<string> {
    return this.primary.signedUrl(key, expirySec);
  }

  keyFromUrl(url: string): string | null {
    return this.primary.keyFromUrl(url) ?? this.mirror.keyFromUrl(url);
  }
}
