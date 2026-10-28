import { ResourceTypeEnum } from "@screenwright/types";

import { formatErrorChain } from "@/mastra/utils/async";

import { addAiAsset, type AiAssetInput, largeIdOf } from "./ai-asset-library";

export interface SavedToLibrary {
  /** 放进素材库后的素材 id；没放进去时为空，原因见 note */
  libraryFileId?: number;
  note?: string;
}

/** 素材名缺省取提示词开头：去掉多余空白，截到素材库卡片放得下的长度 */
export const defaultAssetName = (prompt: string): string => prompt.replace(/\s+/g, " ").trim().slice(0, 20);

/**
 * 把生成的图 / 视频放进用户素材库的「AI 生成」分组。
 * 放进素材库只是附带的：失败不抛，原因写进 note 让模型知道，生成结果照样返回。
 */
export async function saveGeneratedAsset({
  screenId,
  ...asset
}: Omit<AiAssetInput, "largeId"> & { screenId: string }): Promise<SavedToLibrary> {
  const kind = asset.resourceType === ResourceTypeEnum.video ? "视频" : "图";
  const largeId = largeIdOf(screenId);
  if (largeId === null) {
    return { note: `screenId 格式不对（${screenId}），${kind}没有放进素材库` };
  }
  try {
    const { id } = await addAiAsset({ ...asset, largeId });
    return { libraryFileId: id };
  } catch (error) {
    console.warn(`[saveGeneratedAsset] ${kind}放进素材库失败：${formatErrorChain(error)}`);
    return { note: `${kind}没有放进素材库：${error instanceof Error ? error.message : String(error)}` };
  }
}
