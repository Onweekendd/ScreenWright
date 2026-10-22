import { createHash } from "node:crypto";

import sharp from "sharp";

import { assetStore } from "@/lib/storage";
import { readStoredImage } from "@/mastra/services/chat-image.server";
import { deriveSeed } from "@/mastra/services/image-generation.server";
import { imageSize } from "@/mastra/services/shrink-image";
import { formatErrorChain } from "@/mastra/workflows/figma-to-bi/utils/async";
import { generateImage } from "@/queue/image-client";

import { effectivePrompt, MAX_GENERATE_ASPECT } from "./check";
import { buildContactSheet } from "./contact-sheet";
import type { Blueprint, BlueprintAsset } from "./schema";

/**
 * 同时在途的生图请求数。redis 模式下真正的并发由 worker 的 IMAGE_WORKER_CONCURRENCY 管，这里只是别一次
 * 塞几十个任务；inline 模式（本地没起 Redis）则直接决定同时打几个生图请求，太高会撞上游限流。
 */
const concurrency = (): number => Number(process.env.IMAGE_BATCH_CONCURRENCY) || 4;

/** 生图的长边：素材再小也按 1024 起步（服务商对总像素有下限，小图出来也糊），最大 2048 */
const MIN_LONG_EDGE = 1024;
const MAX_LONG_EDGE = 2048;

/**
 * 按目标尺寸算生图请求尺寸：保持宽高比（极端比例夹到 MAX_GENERATE_ASPECT），长边落在 [1024, 2048]。
 * 服务商会再取它支持的最接近尺寸，实际尺寸以结果为准。
 */
export const generationSize = (target: { width: number; height: number }): { width: number; height: number } => {
  const aspect = Math.min(MAX_GENERATE_ASPECT, Math.max(1 / MAX_GENERATE_ASPECT, target.width / target.height));
  const long = Math.min(MAX_LONG_EDGE, Math.max(MIN_LONG_EDGE, target.width, target.height));
  return aspect >= 1
    ? { width: long, height: Math.round(long / aspect) }
    : { width: Math.round(long * aspect), height: long };
};

export interface PreparedAsset {
  key: string;
  name: string;
  source: BlueprintAsset["source"];
  status: BlueprintAsset["status"];
  url?: string;
  size?: { width: number; height: number };
  /** 生图命中了已有结果（同一份提示词生成过） */
  reused?: boolean;
  error?: string;
}

export interface PrepareResult {
  blueprint: Blueprint;
  results: PreparedAsset[];
  /** 本次准备好的素材拼成的总览图；顺序与 keys 一致（从左到右、从上到下） */
  sheet?: { url: string; keys: string[] };
}

export interface PrepareOptions {
  /** 只准备这些素材；不传则准备所有还没 ready 的 */
  keys?: string[];
}

type Outcome = Pick<BlueprintAsset, "status" | "resultUrl" | "resultSize" | "imageId" | "error"> & { reused?: boolean };

/** 限并发地依次处理，单项失败不影响其它项（各自的错误由 worker 自己收进结果） */
async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

// 生图服务抛出的错误已经把 cause 链拼进 message 了，这里只取 message，别再套一层「Error: 」
const failed = (error: unknown): Outcome => ({
  status: "failed",
  error: error instanceof Error ? error.message : String(error)
});

async function generate(blueprint: Blueprint, asset: BlueprintAsset): Promise<Outcome> {
  const prompt = effectivePrompt(blueprint.style, asset.prompt ?? "");
  const record = await generateImage({ prompt, seed: deriveSeed(prompt), ...generationSize(asset.target) });
  return {
    status: "ready",
    resultUrl: record.url,
    resultSize: { width: record.width, height: record.height },
    imageId: record.id,
    reused: record.reused
  };
}

/** 效果图解码一次，多张裁切共用 */
interface SourcePixels {
  bytes: Buffer;
  width: number;
  height: number;
}

async function loadSource(blueprint: Blueprint): Promise<SourcePixels> {
  const url = blueprint.sourceImage?.url;
  if (!url) {
    throw new Error("蓝图没填 sourceImage，没有可裁切的效果图");
  }
  const stored = await readStoredImage(url);
  if (!stored) {
    throw new Error(`效果图不是本系统里的图片，无法读取：${url}`);
  }
  // 以真实像素为准，不信模型写的 sourceImage 宽高
  const size = await imageSize(stored.buffer);
  if (!size) {
    throw new Error("效果图无法解码");
  }
  return { bytes: stored.buffer, ...size };
}

async function crop(blueprint: Blueprint, asset: BlueprintAsset, source: SourcePixels): Promise<Outcome> {
  const region = asset.cropRegion!;
  // 画布坐标 → 效果图像素：两个方向分别缩放（效果图通常是画布的整数倍或 2848×1600 这类非整数倍）
  const sx = source.width / blueprint.canvas.width;
  const sy = source.height / blueprint.canvas.height;
  const left = Math.max(0, Math.floor(region.x * sx));
  const top = Math.max(0, Math.floor(region.y * sy));
  const right = Math.min(source.width, Math.ceil((region.x + region.width) * sx));
  const bottom = Math.min(source.height, Math.ceil((region.y + region.height) * sy));
  if (right <= left || bottom <= top) {
    throw new Error(`裁切区域落在效果图之外`);
  }

  const bytes = await sharp(source.bytes)
    .extract({ left, top, width: right - left, height: bottom - top })
    .png()
    .toBuffer();
  const key = `blueprint-assets/${blueprint.screenKey}/${asset.key}-${asset.fingerprint ?? "x"}.png`;
  const { url } = await assetStore().put(key, bytes, { contentType: "image/png" });
  return { status: "ready", resultUrl: url, resultSize: { width: right - left, height: bottom - top } };
}

async function reuse(asset: BlueprintAsset): Promise<Outcome> {
  const stored = await readStoredImage(asset.url!);
  if (!stored) {
    throw new Error(`不是本系统里的图片，无法复用：${asset.url}`);
  }
  const size = await imageSize(stored.buffer);
  if (!size) {
    throw new Error("图片无法解码");
  }
  return { status: "ready", resultUrl: asset.url, resultSize: size };
}

async function storeSheet(blueprint: Blueprint, ready: BlueprintAsset[]): Promise<PrepareResult["sheet"]> {
  const images = await Promise.all(ready.map((asset) => readStoredImage(asset.resultUrl!)));
  const usable = ready.filter((_, i) => images[i]);
  if (usable.length === 0) {
    return undefined;
  }
  const sheet = await buildContactSheet(images.flatMap((image) => (image ? [image.buffer] : [])));
  const digest = createHash("sha256")
    .update(usable.map((asset) => asset.resultUrl).join("\n"))
    .digest("hex")
    .slice(0, 12);
  const { url } = await assetStore().put(`blueprint-assets/${blueprint.screenKey}/sheet-${digest}.jpg`, sheet, {
    contentType: "image/jpeg"
  });
  return { url, keys: usable.map((asset) => asset.key) };
}

/**
 * 把准备结果并进落库前的最新蓝图。准备素材是后台工具、一跑几分钟，期间模型可能又改写了蓝图：
 * 只把结果写回 key 相同且规格指纹没变的素材，规格已经改掉的那项保持新蓝图里的样子（下次再准备）。
 */
export function mergePrepared(latest: Blueprint, prepared: Blueprint, keys: string[]): Blueprint {
  const done = new Map(prepared.assets.filter((asset) => keys.includes(asset.key)).map((asset) => [asset.key, asset]));
  return {
    ...latest,
    assets: latest.assets.map((asset) => {
      const result = done.get(asset.key);
      return result && result.fingerprint === asset.fingerprint ? { ...asset, ...pickResult(result) } : asset;
    })
  };
}

const pickResult = ({ status, resultUrl, resultSize, imageId, error }: BlueprintAsset) => ({
  status,
  resultUrl,
  resultSize,
  imageId,
  error
});

/**
 * 按素材清单批量准备素材：生图并发跑，裁切共用一次效果图解码，复用只校验能读到。
 * 单项失败只把这一项标成 failed、记下原因，不中断整批；结果回写进返回的蓝图（调用方负责落库）。
 */
export async function prepareAssets(blueprint: Blueprint, options: PrepareOptions = {}): Promise<PrepareResult> {
  const known = new Set(blueprint.assets.map((asset) => asset.key));
  const unknown = (options.keys ?? []).filter((key) => !known.has(key));
  if (unknown.length > 0) {
    throw new Error(`素材清单里没有这些 key：${unknown.join("、")}`);
  }
  const wanted = options.keys ? new Set(options.keys) : undefined;
  const todo = blueprint.assets.filter((asset) => (wanted ? wanted.has(asset.key) : asset.status !== "ready"));

  let source: Promise<SourcePixels> | undefined;
  const outcomes = await mapLimit(todo, concurrency(), async (asset): Promise<Outcome> => {
    try {
      if (asset.source === "generate") {
        return await generate(blueprint, asset);
      }
      if (asset.source === "crop") {
        source ??= loadSource(blueprint);
        return await crop(blueprint, asset, await source);
      }
      return await reuse(asset);
    } catch (error) {
      return failed(error);
    }
  });

  const byKey = new Map(todo.map((asset, i) => [asset.key, outcomes[i]]));
  const assets = blueprint.assets.map((asset): BlueprintAsset => {
    const outcome = byKey.get(asset.key);
    if (!outcome) {
      return asset;
    }
    const { reused: _reused, ...fields } = outcome;
    return { ...asset, resultUrl: undefined, resultSize: undefined, imageId: undefined, error: undefined, ...fields };
  });
  const updated: Blueprint = { ...blueprint, assets };

  const results = todo.map((asset): PreparedAsset => {
    const outcome = byKey.get(asset.key)!;
    return {
      key: asset.key,
      name: asset.name,
      source: asset.source,
      status: outcome.status,
      url: outcome.resultUrl,
      size: outcome.resultSize,
      reused: outcome.reused,
      error: outcome.error
    };
  });

  const ready = assets.filter((asset) => byKey.get(asset.key)?.status === "ready");
  let sheet: PrepareResult["sheet"];
  try {
    sheet = await storeSheet(updated, ready);
  } catch (error) {
    // 总览图只是给模型看的，拼不出来不影响素材本身
    console.warn(`[design-blueprint] 拼总览图失败：${formatErrorChain(error)}`);
  }
  return { blueprint: updated, results, sheet };
}
