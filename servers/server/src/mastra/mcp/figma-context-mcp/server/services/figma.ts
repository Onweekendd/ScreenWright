import type {
  GetFileNodesResponse,
  GetFileResponse,
  GetImageFillsResponse,
  GetImagesResponse
} from "@figma/rest-api-spec";
import path from "path";

import { FigmaKeyPoolManager } from "@/mastra/key/key-manager";
import {
  downloadAndProcessImage,
  type ImageProcessingResult
} from "@/mastra/mcp/figma-context-mcp/server/utils/image-processing";
import { Logger, writeLogsToWorkspace } from "@/mastra/mcp/figma-context-mcp/server/utils/logger";

// ============================================
// 常量配置
// ============================================

/** API 请求最大重试次数 */
const MAX_RETRIES = 7;

/** HTTP 429 状态码（请求过多） */
const HTTP_TOO_MANY_REQUESTS = 429;

/** HTTP 403 状态码（权限不足） */
const HTTP_FORBIDDEN = 403;

/** 请求过多和权限不足的 HTTP 状态码 */
const errorCodes = [HTTP_TOO_MANY_REQUESTS, HTTP_FORBIDDEN];

/**
 * SVG 图片导出选项
 */
interface SvgOptions {
  /** 是否将文本转换为轮廓（避免字体依赖） */
  outlineText: boolean;
  /** 是否在 SVG 中包含 Figma 节点 ID */
  includeId: boolean;
  /** 是否简化描边（减少 SVG 复杂度） */
  simplifyStroke: boolean;
}

/**
 * getRawNode 方法参数
 */
interface GetRawNodeParams {
  /** Figma 文件的唯一标识符 */
  fileKey: string;
  /** 要获取的节点 ID（格式：'1234:5678'） */
  nodeId: string;
  /** 遍历深度（可选，null 表示默认深度） */
  depth?: number | null;
  /** 工作流 ID（可选，用于日志追踪） */
  workflowId?: string;
}

/**
 * getRawFile 方法参数
 */
interface GetRawFileParams {
  /** Figma 文件的唯一标识符 */
  fileKey: string;
  /** 遍历深度（可选，null 表示默认深度） */
  depth?: number | null;
  /** 工作流 ID（可选，用于日志追踪） */
  workflowId?: string;
}

/**
 * Figma API 服务类（单例模式）
 *
 * @description
 * 提供与 Figma REST API 交互的核心功能，包括：
 * - 获取文件和节点数据
 * - 下载图片（PNG/SVG）
 * - 支持图片裁剪和后处理
 * - 集成 Key Pool 管理器，支持多 key 轮换
 * - 自动处理 429 错误并切换 key
 *
 * @example
 * ```typescript
 * const service = FigmaService.getInstance();
 * const fileData = await service.getRawFile('abc123');
 * ```
 */
export class FigmaService {
  private static instance: FigmaService | null = null;
  /** 当前使用的 API Key（可能被 Key Pool 动态更新） */
  private apiKey: string;
  /** Figma API 基础 URL */
  private readonly baseUrl = "https://api.figma.com/v1";
  /** Key Pool 管理器单例 */
  private readonly keyPoolManager: FigmaKeyPoolManager;
  /** 当前使用的 key ID（用于跟踪和统计） */
  private currentKeyId?: string;

  private constructor() {
    this.apiKey = "";
    this.keyPoolManager = FigmaKeyPoolManager.getInstance();
  }

  /**
   * 获取 FigmaService 单例实例
   *
   * @returns 返回单例实例
   */
  static getInstance(): FigmaService {
    if (!FigmaService.instance) {
      FigmaService.instance = new FigmaService();
    }
    return FigmaService.instance;
  }

  /**
   * 获取认证头（使用 Key Pool 动态选择 key）
   *
   * @returns 返回包含认证信息的请求头对象
   *
   * @description
   * 从 Key Pool 中动态选择最优的 API Key
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { keyValue, keyId } = await this.keyPoolManager.selectOptimalKey();
    this.apiKey = keyValue;
    this.currentKeyId = keyId;
    Logger.log(`Using key pool for authentication (keyId: ${keyId})`);
    return { "X-Figma-Token": this.apiKey };
  }

  /**
   * 过滤掉 Figma 图片响应中的空值
   *
   * @param images - 图片映射对象，可能包含 null 值
   * @returns 返回只包含有效图片 URL 的映射对象
   *
   * @description
   * 确保只处理有效的图片 URL，过滤掉所有 null 值
   */
  private filterValidImages(images: { [key: string]: string | null } | undefined): Record<string, string> {
    if (!images) {
      return {};
    }
    return Object.fromEntries(Object.entries(images).filter(([, value]) => !!value)) as Record<string, string>;
  }

  /**
   * 记录请求成功
   */
  private async recordSuccess(): Promise<void> {
    if (this.currentKeyId) {
      await this.keyPoolManager.recordSuccess(this.currentKeyId);
    }
  }

  /**
   * 记录请求失败
   */
  private async recordFailure(errorMessage: string): Promise<void> {
    if (this.currentKeyId) {
      await this.keyPoolManager.recordFailure(this.currentKeyId, errorMessage);
    }
  }

  /**
   * 处理 429 限流错误
   * @param response HTTP 响应
   * @param attempt 当前尝试次数
   * @returns 是否应该重试（切换 key 后继续）
   */
  private async handleRateLimitError(response: Response, attempt: number): Promise<boolean> {
    const retryAfter = response.headers.get("Retry-After");
    Logger.error(`[Attempt ${attempt}/${MAX_RETRIES}] 429 Rate limit hit, Retry-After: ${retryAfter}`);

    // 标记当前 key 被限流
    if (this.currentKeyId) {
      await this.keyPoolManager.markRateLimited(this.currentKeyId, retryAfter ? parseInt(retryAfter, 10) : undefined);
    }

    // 如果还有重试次数，切换到新的 key
    if (attempt < MAX_RETRIES) {
      Logger.log(`[KeyPool] 切换到新的 key 重试...`);
      this.currentKeyId = undefined;
      return true;
    }

    throw new Error(`Rate limited (429). Retry after: ${retryAfter || "unknown"} seconds`);
  }

  /**
   * 执行单次 HTTP 请求
   * @param endpoint API 端点
   * @param attempt 当前尝试次数
   * @returns 响应对象，或 null 表示需要重试
   */
  private async executeRequest<T>(endpoint: string, attempt: number): Promise<T | null> {
    Logger.log(`[Attempt ${attempt}/${MAX_RETRIES}] Calling ${this.baseUrl}${endpoint}`);
    const headers = await this.getAuthHeaders();

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (errorCodes.includes(response.status)) {
        const shouldRetry = await this.handleRateLimitError(response, attempt);
        return shouldRetry ? null : (undefined as never);
      }

      // 尝试读取错误响应体以获取更多信息
      let errorBody = "";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          errorBody = JSON.stringify(errorData);
        } else {
          errorBody = await response.text();
        }
      } catch {
        // 忽略读取响应体的错误
      }

      Logger.error(
        `[Request Failed] ${url}\n  Status: ${response.status} ${response.statusText}\n  Response: ${errorBody || "(no response body)"}`
      );
      throw new Error(
        `Fetch failed with status ${response.status}: ${response.statusText}${errorBody ? ` - ${errorBody}` : ""}`
      );
    }

    const result = (await response.json()) as T;
    await this.recordSuccess();
    return result;
  }

  /**
   * 发送 HTTP 请求到 Figma API
   *
   * @template T - 响应数据的类型
   * @param endpoint - API 端点路径（如 `/files/xxx`）
   * @returns 返回 API 响应数据
   * @throws {Error} 当请求失败或达到最大重试次数时抛出错误
   *
   * @description
   * 核心请求方法，支持：
   * - 自动重试（最多 3 次）
   * - 429 错误自动切换 Key Pool 中的 key
   * - 从响应头中读取 Retry-After 并持久化到数据库
   * - 记录请求成功/失败统计
   */
  private async request<T>(endpoint: string): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await this.executeRequest<T>(endpoint, attempt);
        if (result !== null) {
          return result;
        }
        // result === null 表示 429 错误且需要重试，继续下一次循环
      } catch (error) {
        const err = error as Error;
        lastError = err;

        // 非 429 错误，记录失败并立即抛出
        if (!err.message?.includes("429")) {
          await this.recordFailure(err.message);
          throw new Error(`Failed to make request to Figma API endpoint '${endpoint}': ${err.message}`);
        }
      }
    }

    throw new Error(
      `Failed to make request to Figma API endpoint '${endpoint}' after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  /**
   * 构建 SVG 图片请求的 URL 查询参数
   *
   * @param svgIds - SVG 节点 ID 数组
   * @param svgOptions - SVG 导出选项
   * @returns 返回格式化后的查询参数字符串
   */
  private buildSvgQueryParams(svgIds: string[], svgOptions: SvgOptions): string {
    const params = new URLSearchParams({
      ids: svgIds.join(","),
      format: "svg",
      svg_outline_text: String(svgOptions.outlineText),
      svg_include_id: String(svgOptions.includeId),
      svg_simplify_stroke: String(svgOptions.simplifyStroke)
    });
    return params.toString();
  }

  /**
   * 获取图片填充的下载 URL（不下载文件）
   *
   * @param fileKey - Figma 文件的唯一标识符
   * @returns 返回 imageRef 到下载 URL 的映射对象
   *
   * @description
   * 获取 Figma 文件中所有图片填充资源的下载链接，
   * 返回的 URL 可用于后续的文件下载
   */
  async getImageFillUrls(fileKey: string): Promise<Record<string, string>> {
    const endpoint = `/files/${fileKey}/images`;
    const response = await this.request<GetImageFillsResponse>(endpoint);
    return response.meta.images || {};
  }

  /**
   * 获取渲染节点的下载 URL（不下载文件）
   *
   * @param fileKey - Figma 文件的唯一标识符
   * @param nodeIds - 要渲染的节点 ID 数组
   * @param format - 图片格式，支持 "png" 或 "svg"
   * @param options - 可选配置项
   * @param options.pngScale - PNG 图片的导出倍数（默认 2）
   * @param options.svgOptions - SVG 导出选项
   * @returns 返回节点 ID 到下载 URL 的映射对象
   *
   * @description
   * 为指定的 Figma 节点生成渲染图片的下载链接，
   * 支持 PNG 和 SVG 两种格式
   */
  async getNodeRenderUrls(
    fileKey: string,
    nodeIds: string[],
    format: "png" | "svg",
    options: { pngScale?: number; svgOptions?: SvgOptions } = {}
  ): Promise<Record<string, string>> {
    if (nodeIds.length === 0) {
      return {};
    }

    // Figma API 单次请求 ID 数量限制，超出会返回 400 或 fetch failed（URL 过长）
    const BATCH_SIZE = 10;

    if (nodeIds.length > BATCH_SIZE) {
      const batchCount = Math.ceil(nodeIds.length / BATCH_SIZE);
      Logger.log(`[getNodeRenderUrls] ${nodeIds.length} 个节点超过批次限制，分 ${batchCount} 批请求`);
      const results: Record<string, string> = {};
      for (let i = 0; i < nodeIds.length; i += BATCH_SIZE) {
        const batch = nodeIds.slice(i, i + BATCH_SIZE);
        const batchIndex = Math.floor(i / BATCH_SIZE) + 1;
        Logger.log(`[getNodeRenderUrls] 批次 ${batchIndex}/${batchCount}: ${batch.length} 个节点`);
        const batchResult = await this.getNodeRenderUrls(fileKey, batch, format, options);
        Object.assign(results, batchResult);
      }
      return results;
    }

    // 复合实例 ID（如 "I453:2572;448:1250"）无法被 /images 端点直接渲染
    // 将其替换为父实例 ID（"453:2572"），并维护映射以便把结果返回给原始 ID
    const compositeToParent = new Map<string, string>(); // 原始复合 ID → 父实例 ID
    const resolvedIds = nodeIds.map((id) => {
      if (id.startsWith("I") && id.includes(";")) {
        const parentId = id.slice(1).split(";")[0]; // "I453:2572;448:1250" → "453:2572"
        compositeToParent.set(id, parentId);
        return parentId;
      }
      return id;
    });

    // 去重（多个复合 ID 可能映射到同一个父实例 ID）
    const uniqueIds = [...new Set(resolvedIds)];

    if (compositeToParent.size > 0) {
      Logger.log(`[getNodeRenderUrls] ${compositeToParent.size} 个复合实例 ID 已映射为父实例 ID`);
    }

    try {
      if (format === "png") {
        const scale = options.pngScale || 2;
        const endpoint = `/images/${fileKey}?ids=${uniqueIds.join(",")}&format=png&scale=${scale}`;
        const response = await this.request<GetImagesResponse>(endpoint);
        const urlMap = this.filterValidImages(response.images);

        // 记录获取到的 URL
        Logger.log(`[getNodeRenderUrls] 成功获取 ${Object.keys(urlMap).length} 个 PNG URL`);

        for (const [compositeId, parentId] of compositeToParent) {
          if (urlMap[parentId]) {
            urlMap[compositeId] = urlMap[parentId];
          }
        }
        return urlMap;
      } else {
        const svgOptions = options.svgOptions || {
          outlineText: true,
          includeId: false,
          simplifyStroke: true
        };
        const params = this.buildSvgQueryParams(uniqueIds, svgOptions);
        const endpoint = `/images/${fileKey}?${params}`;
        const response = await this.request<GetImagesResponse>(endpoint);
        const urlMap = this.filterValidImages(response.images);

        // 记录获取到的 URL
        Logger.log(`[getNodeRenderUrls] 成功获取 ${Object.keys(urlMap).length} 个 SVG URL`);

        for (const [compositeId, parentId] of compositeToParent) {
          if (urlMap[parentId]) {
            urlMap[compositeId] = urlMap[parentId];
          }
        }
        return urlMap;
      }
    } catch (error) {
      const err = error as Error;
      // 写入错误日志
      writeLogsToWorkspace("image-url-error.json", {
        timestamp: new Date().toISOString(),
        errorType: "get_render_urls_failed",
        fileKey,
        nodeIds,
        format,
        options,
        errorMessage: err.message,
        stack: err.stack
      });
      Logger.error(`[getNodeRenderUrls] 获取图片 URL 失败: ${err.message}`);
      throw err;
    }
  }

  /**
   * 下载 Figma 图片并支持后处理（裁剪和尺寸信息）
   *
   * @param fileKey - Figma 文件的唯一标识符
   * @param localPath - 本地存储目录的绝对路径
   * @param items - 要下载的图片项目数组
   * @param items[].imageRef - 图片填充的引用 ID（可选）
   * @param items[].nodeId - 要渲染的节点 ID（可选）
   * @param items[].fileName - 保存的文件名（需包含 .png 或 .svg 扩展名）
   * @param items[].needsCropping - 是否需要根据变换矩阵裁剪（可选）
   * @param items[].cropTransform - Figma 变换矩阵，用于裁剪（可选）
   * @param items[].requiresImageDimensions - 是否需要返回图片尺寸信息（可选）
   * @param options - 可选配置项
   * @param options.pngScale - PNG 图片的导出倍数（默认 2）
   * @param options.svgOptions - SVG 导出选项（可选）
   * @returns 返回成功下载的图片处理结果数组
   * @throws {Error} 当路径无效时抛出错误
   *
   * @description
   * 支持以下功能：
   * - 图片填充 vs 渲染节点（基于 imageRef 或 nodeId）
   * - PNG vs SVG 格式（基于文件扩展名）
   * - 基于变换矩阵的图片裁剪
   * - 为 CSS 变量生成图片尺寸信息
   *
   * @example
   * ```typescript
   * const results = await figmaService.downloadImages(
   *   'abc123',
   *   './images',
   *   [
   *     {
   *       nodeId: '1234:5678',
   *       fileName: 'icon.png',
   *       needsCropping: true,
   *       cropTransform: [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
   *     }
   *   ],
   *   { pngScale: 2 }
   * );
   * ```
   */
  async downloadImages(
    fileKey: string,
    localPath: string,
    items: Array<{
      imageRef?: string;
      nodeId?: string;
      fileName: string;
      needsCropping?: boolean;
      cropTransform?: any;
      requiresImageDimensions?: boolean;
    }>,
    options: { pngScale?: number; svgOptions?: SvgOptions } = {}
  ): Promise<ImageProcessingResult[]> {
    if (items.length === 0) {
      return [];
    }

    const sanitizedPath = path.normalize(localPath).replace(/^(\.\.(\/|\\|$))+/, "");
    const resolvedPath = path.resolve(sanitizedPath);
    if (!resolvedPath.startsWith(path.resolve(process.cwd()))) {
      throw new Error("Invalid path specified. Directory traversal is not allowed.");
    }

    const { pngScale = 2, svgOptions } = options;
    const downloadPromises: Promise<ImageProcessingResult[]>[] = [];

    // Separate items by type
    const imageFills = items.filter((item): item is typeof item & { imageRef: string } => !!item.imageRef);
    const renderNodes = items.filter((item): item is typeof item & { nodeId: string } => !!item.nodeId);

    // Download image fills with processing
    if (imageFills.length > 0) {
      const fillUrls = await this.getImageFillUrls(fileKey);
      Logger.log(`[downloadImages] 获取到 ${Object.keys(fillUrls).length} 个图片填充 URL`);

      const fillDownloads = imageFills
        .map(({ imageRef, fileName, needsCropping, cropTransform, requiresImageDimensions }) => {
          const imageUrl = fillUrls[imageRef];
          if (!imageUrl) {
            Logger.error(`[downloadImages] 未找到 imageRef=${imageRef} 的 URL (fileName: ${fileName})`);
            writeLogsToWorkspace("missing-image-url.json", {
              timestamp: new Date().toISOString(),
              errorType: "missing_image_fill_url",
              imageRef,
              fileName,
              availableRefs: Object.keys(fillUrls)
            });
          }
          return imageUrl
            ? downloadAndProcessImage(
                fileName,
                resolvedPath,
                imageUrl,
                needsCropping,
                cropTransform,
                requiresImageDimensions
              )
            : null;
        })
        .filter((promise): promise is Promise<ImageProcessingResult> => promise !== null);

      if (fillDownloads.length > 0) {
        downloadPromises.push(Promise.all(fillDownloads));
      }
    }

    // Download rendered nodes with processing
    if (renderNodes.length > 0) {
      const pngNodes = renderNodes.filter((node) => !node.fileName.toLowerCase().endsWith(".svg"));
      const svgNodes = renderNodes.filter((node) => node.fileName.toLowerCase().endsWith(".svg"));

      // Download PNG renders
      if (pngNodes.length > 0) {
        const pngUrls = await this.getNodeRenderUrls(
          fileKey,
          pngNodes.map((n) => n.nodeId),
          "png",
          { pngScale }
        );
        Logger.log(`[downloadImages] 获取到 ${Object.keys(pngUrls).length} 个 PNG 节点 URL`);

        const pngDownloads = pngNodes
          .map(({ nodeId, fileName, needsCropping, cropTransform, requiresImageDimensions }) => {
            const imageUrl = pngUrls[nodeId];
            if (!imageUrl) {
              Logger.error(`[downloadImages] 未找到 nodeId=${nodeId} 的 PNG URL (fileName: ${fileName})`);
              writeLogsToWorkspace("missing-node-url.json", {
                timestamp: new Date().toISOString(),
                errorType: "missing_png_node_url",
                nodeId,
                fileName,
                availableNodeIds: Object.keys(pngUrls)
              });
            }
            return imageUrl
              ? downloadAndProcessImage(
                  fileName,
                  resolvedPath,
                  imageUrl,
                  needsCropping,
                  cropTransform,
                  requiresImageDimensions
                )
              : null;
          })
          .filter((promise): promise is Promise<ImageProcessingResult> => promise !== null);

        if (pngDownloads.length > 0) {
          downloadPromises.push(Promise.all(pngDownloads));
        }
      }

      // Download SVG renders
      if (svgNodes.length > 0) {
        const svgUrls = await this.getNodeRenderUrls(
          fileKey,
          svgNodes.map((n) => n.nodeId),
          "svg",
          { svgOptions }
        );
        Logger.log(`[downloadImages] 获取到 ${Object.keys(svgUrls).length} 个 SVG 节点 URL`);

        const svgDownloads = svgNodes
          .map(({ nodeId, fileName, needsCropping, cropTransform, requiresImageDimensions }) => {
            const imageUrl = svgUrls[nodeId];
            if (!imageUrl) {
              Logger.error(`[downloadImages] 未找到 nodeId=${nodeId} 的 SVG URL (fileName: ${fileName})`);
              writeLogsToWorkspace("missing-node-url.json", {
                timestamp: new Date().toISOString(),
                errorType: "missing_svg_node_url",
                nodeId,
                fileName,
                availableNodeIds: Object.keys(svgUrls)
              });
            }
            return imageUrl
              ? downloadAndProcessImage(
                  fileName,
                  resolvedPath,
                  imageUrl,
                  needsCropping,
                  cropTransform,
                  requiresImageDimensions
                )
              : null;
          })
          .filter((promise): promise is Promise<ImageProcessingResult> => promise !== null);

        if (svgDownloads.length > 0) {
          downloadPromises.push(Promise.all(svgDownloads));
        }
      }
    }

    const results = await Promise.all(downloadPromises);
    return results.flat();
  }

  /**
   * 获取 Figma 文件的原始 API 响应
   *
   * @param params - 参数对象
   * @param params.fileKey - Figma 文件的唯一标识符
   * @param params.depth - 遍历深度（可选，null 表示默认深度）
   * @param params.workflowId - 工作流 ID（可选，用于日志追踪）
   * @returns 返回 Figma 文件的原始 API 响应数据
   *
   * @description
   * 获取完整的 Figma 文件数据，包括所有节点树。
   * 适用于需要使用自定义提取器的场景。
   *
   * @example
   * ```typescript
   * const fileData = await figmaService.getRawFile({ fileKey: 'abc123', depth: 2 });
   * ```
   */
  async getRawFile(params: GetRawFileParams): Promise<GetFileResponse> {
    const { fileKey, depth, workflowId } = params;
    const endpoint = `/files/${fileKey}${depth ? `?depth=${depth}` : ""}`;
    Logger.log(
      `Retrieving raw Figma file: ${fileKey} (depth: ${depth ?? "default"})${workflowId ? ` [workflow: ${workflowId}]` : ""}`
    );

    const response = await this.request<GetFileResponse>(endpoint);
    writeLogsToWorkspace(`${workflowId ? `${workflowId}/` : ""}figma-raw.json`, response);

    return response;
  }

  /**
   * 获取特定节点的原始 API 响应
   *
   * @param params - 参数对象
   * @param params.fileKey - Figma 文件的唯一标识符
   * @param params.nodeId - 要获取的节点 ID（格式：'1234:5678'）
   * @param params.depth - 遍历深度（可选，null 表示默认深度）
   * @param params.workflowId - 工作流 ID（可选，用于日志追踪）
   * @returns 返回 Figma 节点的原始 API 响应数据
   *
   * @description
   * 获取 Figma 文件中特定节点的数据，
   * 适用于只需要部分节点的场景。
   *
   * @example
   * ```typescript
   * const nodeData = await figmaService.getRawNode({ fileKey: 'abc123', nodeId: '1234:5678' });
   * ```
   */
  async getRawNode(params: GetRawNodeParams): Promise<GetFileNodesResponse> {
    const { fileKey, nodeId, depth, workflowId } = params;
    const endpoint = `/files/${fileKey}/nodes?ids=${nodeId}${depth ? `&depth=${depth}` : ""}`;
    Logger.log(`Retrieving raw Figma node: ${nodeId} from ${fileKey} (depth: ${depth ?? "default"})}`);

    const response = await this.request<GetFileNodesResponse>(endpoint);
    writeLogsToWorkspace(`${workflowId}/figma-raw.json`, response);

    return response;
  }
}
