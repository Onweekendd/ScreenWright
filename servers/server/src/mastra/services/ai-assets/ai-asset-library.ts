import { createHash } from "node:crypto";

import { FileTypeEnum, ResourceTypeEnum } from "@screenwright/types";

import { assetStore } from "@/lib/storage";
import { prismaClient } from "@/mastra/storage/prisma";

/** AI 生成的素材都放进用户素材库里这个分组，没有就自动建 */
export const AI_GROUP_NAME = "AI 生成";
/** MinioGroup.type：1 = 页面资产分组，和用户自己建的分组同一类，素材库侧栏原样显示 */
const PAGE_ASSET_GROUP_TYPE = 1;
const AI_AUTHOR = "AI";

export interface AiAssetInput {
  /** 联网收集的素材使用自己的分组；默认保持「AI 生成」。 */
  groupName?: string;
  /** 生成时所在的大屏 id；素材归这个大屏的所有者 */
  largeId: number;
  name: string;
  url: string;
  resourceType?: ResourceTypeEnum.image | ResourceTypeEnum.video;
  /** 对应的生图记录（裁切出来的素材没有） */
  generatedImageId?: string;
  /** 生成时用到的参考图 url；是素材库里的素材的，记成素材 id 供画布连线 */
  referenceUrls?: string[];
  /**
   * 文件归素材库自己所有时才传（工作区上传的文件）：删除素材会连带删这个 key 指向的文件。
   * 生成的图不传——文件归生图缓存所有，见 {@link addAiAsset}。
   */
  blobKey?: string;
  resourceSize?: number;
}

export interface AiAssetResult {
  id: number;
  /** 同一个用户已经有这张图（同一个 url），没有新建 */
  reused: boolean;
}

/** 大屏 id：工具入参是 "5_1"，工作区目录名是 "screen_5_1"，都取第一段 */
export const largeIdOf = (screenKey: string): number | null => {
  const match = /^(?:screen_)?(\d+)_\d+$/.exec(screenKey.trim());
  return match ? Number(match[1]) : null;
};

/**
 * 同一个用户第一次往「AI 生成」分组里放东西时才建分组。并发生成（批量准备素材、模型并行调好几次生图）
 * 会同时走到这里，分组表没有唯一约束，不排队就会建出好几个同名分组。
 */
const groupCreations = new Map<string, Promise<number>>();

async function ensureAiGroup(userId: number, name = AI_GROUP_NAME): Promise<number> {
  const existing = await prismaClient.minioGroup.findFirst({
    where: { userId, type: PAGE_ASSET_GROUP_TYPE, name },
    orderBy: { id: "asc" },
    select: { id: true }
  });
  if (existing) {
    return existing.id;
  }
  const key = `${userId}:${name}`;
  let pending = groupCreations.get(key);
  if (!pending) {
    pending = prismaClient.minioGroup
      .create({
        data: { userId, name, type: PAGE_ASSET_GROUP_TYPE, createdBy: AI_AUTHOR, updatedBy: AI_AUTHOR },
        select: { id: true }
      })
      .then((group) => group.id)
      .finally(() => groupCreations.delete(key));
    groupCreations.set(key, pending);
  }
  return pending;
}

/**
 * 把一张 AI 生成 / 裁切出来的图放进大屏所有者的素材库（「AI 生成」分组，所有大屏通用）。
 *
 * - 同一个用户同一个 url 只放一次：命中缓存的重复生成、重复准备素材不会刷出新素材
 * - **不记 blobKey**：文件归生图缓存（GeneratedImage）所有。素材库删除素材会连带删 blobKey 指向的文件，
 *   记了的话用户删一条素材，生图缓存就指向一个不存在的文件，下次同样的输入命中缓存拿到的是坏图
 */
export async function addAiAsset(input: AiAssetInput): Promise<AiAssetResult> {
  const userId = await ownerOf(input.largeId);

  const existing = await prismaClient.minioFile.findFirst({
    where: { userId, url: input.url },
    select: { id: true }
  });
  if (existing) {
    return { id: existing.id, reused: true };
  }

  const references = input.referenceUrls?.length
    ? await prismaClient.minioFile.findMany({
        where: { userId, url: { in: input.referenceUrls } },
        select: { id: true, url: true }
      })
    : [];
  // 按参考图的顺序记，找不到的（截图、聊天上传的图）跳过
  const referenceFileIds = (input.referenceUrls ?? []).flatMap((url) => {
    const found = references.find((file) => file.url === url);
    return found ? [found.id] : [];
  });

  const groupId = await ensureAiGroup(userId, input.groupName);
  const created = await prismaClient.minioFile.create({
    data: {
      userId,
      name: input.name,
      fileName: extensionOf(input.url),
      url: input.url,
      resourceType: input.resourceType ?? ResourceTypeEnum.image,
      fileType: FileTypeEnum.personalPageAssets,
      groupId,
      largeId: input.largeId,
      resourceSize: input.resourceSize ?? 0,
      ...(input.blobKey ? { blobKey: input.blobKey } : {}),
      layerIds: [],
      generatedImageId: input.generatedImageId,
      ...(referenceFileIds.length ? { referenceFileIds } : {}),
      createdBy: AI_AUTHOR,
      updatedBy: AI_AUTHOR
    },
    select: { id: true }
  });
  return { id: created.id, reused: false };
}

/** 大屏的所有者：素材归他 */
async function ownerOf(largeId: number): Promise<number> {
  const screen = await prismaClient.largeScreen.findUnique({ where: { id: largeId }, select: { userId: true } });
  if (!screen) {
    throw new Error(`大屏 ${largeId} 不存在，文件没有放进素材库`);
  }
  return screen.userId;
}

export interface WorkspaceAssetInput {
  groupName?: string;
  largeId: number;
  name: string;
  bytes: Buffer;
  /** 带点的小写扩展名，如 ".png" */
  extension: string;
  contentType: string;
  resourceType: ResourceTypeEnum.image | ResourceTypeEnum.video;
}

export interface WorkspaceAssetResult extends AiAssetResult {
  /** 文件在对象存储里的最终位置（可公开访问的 url） */
  url: string;
  size: number;
}

/**
 * 把工作区里的文件传到对象存储，并放进大屏所有者的素材库（「AI 生成」分组）。
 *
 * key 带用户 id 和内容哈希：同一个用户重复上传同样内容落到同一个 key、同一个 url，
 * 素材库按 url 去重，不会刷出重复素材；不同用户互不共用文件，删一个人的素材不会伤到别人。
 */
export async function addWorkspaceAsset(input: WorkspaceAssetInput): Promise<WorkspaceAssetResult> {
  const userId = await ownerOf(input.largeId);
  const hash = createHash("sha256").update(input.bytes).digest("hex").slice(0, 32);
  const key = `bi-assets/ai-${userId}/${hash}${input.extension}`;
  const saved = await assetStore().put(key, input.bytes, { contentType: input.contentType });
  const asset = await addAiAsset({
    groupName: input.groupName,
    largeId: input.largeId,
    name: input.name,
    url: saved.url,
    resourceType: input.resourceType,
    blobKey: saved.key,
    resourceSize: saved.size
  });
  return { ...asset, url: saved.url, size: saved.size };
}

const extensionOf = (url: string): string => /\.([a-z0-9]{2,5})(?:\?|#|$)/i.exec(url)?.[1]?.toLowerCase() ?? "";
