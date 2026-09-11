/**
 * 对象存储抽象。
 *
 * 下游（素材上传、聊天贴图、Figma 资源、LLM 录制归档）只依赖这个接口，
 * 不直接碰 `node:fs` 或 `minio`。具体走哪个后端由 `./index` 里的工厂按环境变量决定：
 *   - fs   ：本地文件系统（开源 / 桌面版默认）
 *   - minio：对象存储
 *   - 组合 ：录制归档恒写 fs，另按需镜像一份到 minio（见 CompositeObjectStore）
 *
 * key 一律用 "/" 分层，且由调用方给出**完整逻辑 key**（含各自业务前缀，如
 * `chat-images/<conv>/<uuid>.png`、`llm-records/<thread>/turn_00/step_00.json`），
 * store 不再自行拼接前缀。
 */

export interface PutOptions {
  /** MIME 类型；fs 后端忽略，minio 后端写进对象元数据 */
  contentType?: string;
}

export interface PutResult {
  /** 回显传入的 key */
  key: string;
  /** 可公开访问 URL */
  url: string;
  /** 写入字节数 */
  size: number;
}

export interface HeadResult {
  size: number;
  contentType?: string;
}

/** 非递归列出某前缀下的直接子项，只返回末段名 */
export interface BlobList {
  /** 子"目录"末段名 */
  dirs: string[];
  /** 直属对象末段名 */
  files: string[];
}

export interface ObjectStore {
  /** 写对象（覆盖）。返回可公开访问 URL。 */
  put(key: string, data: Buffer, opts?: PutOptions): Promise<PutResult>;

  /** 读为 Buffer；对象不存在时抛错。 */
  get(key: string): Promise<Buffer>;

  /** 读为字符串；对象不存在时抛错。 */
  getText(key: string, encoding?: BufferEncoding): Promise<string>;

  /** 元信息；对象不存在时返回 null。 */
  head(key: string): Promise<HeadResult | null>;

  /** 删除；对象不存在时静默返回。 */
  delete(key: string): Promise<void>;

  /** 非递归列出某前缀下的直接子项。 */
  list(prefix: string): Promise<BlobList>;

  /** key → 可公开访问 URL。 */
  publicUrl(key: string): string;

  /**
   * key → 临时授权 URL。fs 后端没有"授权"概念，等价于 publicUrl。
   * @param expirySec 有效期（秒），默认 3600
   */
  signedUrl(key: string, expirySec?: number): Promise<string>;

  /**
   * 可公开访问 URL → key，解析不出时返回 null。
   * 用于只拿到 URL、需要反查对象的场景（如聊天贴图取回原图）。
   */
  keyFromUrl(url: string): string | null;
}
