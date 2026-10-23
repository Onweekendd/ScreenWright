import { FileTypeEnum, ResourceTypeEnum } from "@screenwright/types";

import { prismaClient } from "@/mastra/storage/prisma";

/** AI 生成的素材都放进用户素材库里这个分组，没有就自动建 */
export const AI_GROUP_NAME = "AI 生成";
/** MinioGroup.type：1 = 页面资产分组，和用户自己建的分组同一类，素材库侧栏原样显示 */
const PAGE_ASSET_GROUP_TYPE = 1;
const AI_AUTHOR = "AI";

export interface AiAssetInput {
  /** 生成时所在的大屏 id；素材归这个大屏的所有者 */
  largeId: number;
  name: string;
  url: string;
  resourceType?: ResourceTypeEnum.image | ResourceTypeEnum.video;
  /** 对应的生图记录（裁切出来的素材没有） */
  generatedImageId?: string;
  /** 生成时用到的参考图 url；是素材库里的素材的，记成素材 id 供画布连线 */
  referenceUrls?: string[];
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
const groupCreations = new Map<number, Promise<number>>();

async function ensureAiGroup(userId: number): Promise<number> {
  const existing = await prismaClient.minioGroup.findFirst({
    where: { userId, type: PAGE_ASSET_GROUP_TYPE, name: AI_GROUP_NAME },
    orderBy: { id: "asc" },
    select: { id: true }
  });
  if (existing) {
    return existing.id;
  }
  let pending = groupCreations.get(userId);
  if (!pending) {
    pending = prismaClient.minioGroup
      .create({
        data: { userId, name: AI_GROUP_NAME, type: PAGE_ASSET_GROUP_TYPE, createdBy: AI_AUTHOR, updatedBy: AI_AUTHOR },
        select: { id: true }
      })
      .then((group) => group.id)
      .finally(() => groupCreations.delete(userId));
    groupCreations.set(userId, pending);
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
  const screen = await prismaClient.largeScreen.findUnique({
    where: { id: input.largeId },
    select: { userId: true }
  });
  if (!screen) {
    throw new Error(`大屏 ${input.largeId} 不存在，生成的图没有放进素材库`);
  }
  const { userId } = screen;

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

  const groupId = await ensureAiGroup(userId);
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
      resourceSize: 0,
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

const extensionOf = (url: string): string => /\.([a-z0-9]{2,5})(?:\?|#|$)/i.exec(url)?.[1]?.toLowerCase() ?? "";
