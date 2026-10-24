import { createHash, randomUUID } from "node:crypto";

import { ResourceTypeEnum } from "@screenwright/types";
import mime from "mime";
import { z } from "zod";

import { callMediaAssetsTool } from "../mcp/media-assets/client";
import { addWorkspaceAsset, largeIdOf } from "./ai-asset-library";

const MAX_BYTES = 50 * 1024 * 1024;
const remoteAssetSchema = z.object({
  asset_id: z.string(),
  type: z.enum(["image", "video"]),
  url: z.url(),
  content_type: z.string(),
  title: z.string().optional(),
  author: z.string().optional(),
  source_url: z.string().optional(),
  sha256: z.string().optional(),
  bytes: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration_ms: z.number().optional()
});
const remoteTaskSchema = z.object({
  task_id: z.string(),
  status: z.enum(["queued", "running", "completed", "partial", "failed", "input_required", "canceled"]),
  stage: z.string().optional(),
  error: z.string().optional(),
  assets: z
    .array(remoteAssetSchema)
    .nullish()
    .transform((assets) => assets ?? [])
});
type RemoteTask = z.infer<typeof remoteTaskSchema>;
type RemoteAsset = z.infer<typeof remoteAssetSchema>;

export interface MediaAssetsSearch {
  screenId: string;
  query: string;
  kind: "image" | "video";
  count: number;
  minShortSide: number;
  maxDurationSeconds: number;
  sourceUrls?: string[];
}

export const collectedAssetSchema = z.object({
  assetId: z.string(),
  type: z.enum(["image", "video"]),
  url: z.string(),
  title: z.string(),
  contentType: z.string(),
  libraryFileId: z.number(),
  reused: z.boolean(),
  sourceUrl: z.string().optional(),
  author: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  durationMs: z.number().optional()
});

export const mediaAssetsResultSchema = z.object({
  taskId: z.string(),
  status: z.string(),
  stage: z.string().optional(),
  assets: z.array(collectedAssetSchema),
  errors: z.array(z.string()),
  note: z.string().optional(),
  imagesForModel: z.array(z.object({ url: z.string(), label: z.string() })).optional()
});

export async function getMediaAssetsTask(taskId: string): Promise<RemoteTask> {
  return remoteTaskSchema.parse(await callMediaAssetsTool("get_asset_task", { task_id: taskId }));
}

async function download(asset: RemoteAsset): Promise<Buffer> {
  const url = new URL(asset.url);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("素材下载地址必须是 HTTP(S)");
  }
  if ((asset.bytes ?? 0) > MAX_BYTES) {
    throw new Error("素材超过平台单文件 50 MB 上限");
  }
  // MCP 的 Bearer Token 仅发给 MCP 服务，不转发给素材下载地址。
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) {
    throw new Error(`素材下载失败（HTTP ${response.status}），可重新导入该任务以刷新临时 URL`);
  }
  if (Number(response.headers.get("content-length")) > MAX_BYTES) {
    await response.body?.cancel();
    throw new Error("素材超过平台单文件 50 MB 上限");
  }
  if (!response.body) {
    throw new Error("素材下载内容为空");
  }
  const reader = response.body.getReader();
  const chunks: Buffer[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      length += value.length;
      if (length > MAX_BYTES) {
        throw new Error("素材超过平台单文件 50 MB 上限");
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel();
  }
  const bytes = Buffer.concat(chunks);
  if (!bytes.length) {
    throw new Error("素材下载内容为空");
  }
  if (asset.sha256 && createHash("sha256").update(bytes).digest("hex") !== asset.sha256.toLowerCase()) {
    throw new Error("素材 SHA256 校验失败，没有导入");
  }
  return bytes;
}

async function importTask(task: RemoteTask, screenId: string) {
  const largeId = largeIdOf(screenId);
  if (largeId === null) {
    throw new Error('screenId 应为 "{screenId}_{versionCode}"，如 "10_1"');
  }
  const assets: Array<z.infer<typeof collectedAssetSchema>> = [];
  const errors: string[] = [];
  // 逐个转存，避免多段大视频同时驻留内存。
  for (const asset of task.assets) {
    try {
      const contentType = asset.content_type.split(";")[0].trim().toLowerCase();
      if (!contentType.startsWith(`${asset.type}/`)) {
        throw new Error("素材 MIME 类型与图片/视频类型不一致");
      }
      const extension = mime.getExtension(contentType);
      if (!extension) {
        throw new Error("无法识别素材文件扩展名");
      }
      const title = (asset.title || asset.asset_id).slice(0, 120);
      const saved = await addWorkspaceAsset({
        largeId,
        name: title,
        bytes: await download(asset),
        extension: `.${extension}`,
        contentType,
        resourceType: asset.type === "image" ? ResourceTypeEnum.image : ResourceTypeEnum.video,
        groupName: "联网素材"
      });
      assets.push({
        assetId: asset.asset_id,
        type: asset.type,
        url: saved.url,
        title,
        contentType,
        libraryFileId: saved.id,
        reused: saved.reused,
        sourceUrl: asset.source_url,
        author: asset.author,
        width: asset.width,
        height: asset.height,
        durationMs: asset.duration_ms
      });
    } catch (error) {
      errors.push(`${asset.asset_id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const imagesForModel = assets
    .filter((asset) => asset.type === "image")
    .map((asset) => ({ url: asset.url, label: asset.title }));
  const note =
    task.status === "input_required"
      ? "素材服务需要人工完成登录或验证。完成后再发起新搜索；已成功取得的素材仍会导入。"
      : task.status === "queued" || task.status === "running"
        ? `任务仍在运行，稍后用 importMediaAssetsTool 导入 taskId=${task.task_id}，无需重复搜索。`
        : errors.length
          ? "部分素材导入失败，可用 importMediaAssetsTool 对同一 taskId 重试；已有素材按内容去重。"
          : task.error;
  return {
    taskId: task.task_id,
    status: task.status,
    stage: task.stage,
    assets,
    errors: [...(task.error ? [task.error] : []), ...errors],
    note,
    ...(imagesForModel.length ? { imagesForModel } : {})
  };
}

export async function importMediaAssets(taskId: string, screenId: string) {
  return importTask(await getMediaAssetsTask(taskId), screenId);
}

/** 使用 Mastra MCP 工具调用；等待发生在后台任务里，不消耗主 Agent 的逐步轮询。 */
export async function searchMediaAssets(input: MediaAssetsSearch, requestId: string = randomUUID()) {
  if (largeIdOf(input.screenId) === null) {
    throw new Error('screenId 应为 "{screenId}_{versionCode}"');
  }
  let task = remoteTaskSchema.parse(
    await callMediaAssetsTool("create_asset_task", {
      project_id: `screen_${input.screenId.replace(/^screen_/, "")}`,
      request_id: requestId,
      query: input.query,
      kind: input.kind,
      count: input.count,
      min_short_side: input.minShortSide,
      max_duration_seconds: input.maxDurationSeconds,
      ...(input.sourceUrls?.length ? { source_urls: input.sourceUrls } : {})
    })
  );
  const deadline = Date.now() + 8 * 60_000;
  while ((task.status === "queued" || task.status === "running") && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 4_000));
    try {
      task = await getMediaAssetsTask(task.task_id);
    } catch (error) {
      throw new Error(`素材任务 ${task.task_id} 查询失败，可用 importMediaAssetsTool 对该 taskId 重试导入`, {
        cause: error
      });
    }
  }
  return importTask(task, input.screenId);
}
