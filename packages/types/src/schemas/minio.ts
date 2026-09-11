import { z } from "zod";

import type { ComponentMinioAsset, MinioResource } from "../types";

// ============================================
// Minio Resource Schema
// ============================================

/** Minio资源信息 Schema */
export const MinioResourceSchema: z.ZodSchema<MinioResource> = z.object({
  /** 创建人 */
  createdBy: z.string().describe("创建人"),
  /** 创建时间 */
  createdTime: z.string().describe("创建时间"),
  /** 更新人 */
  updatedBy: z.string().describe("更新人"),
  /** 更新时间 */
  updatedTime: z.string().describe("更新时间"),
  /** 资源ID */
  id: z.number().describe("资源ID"),
  /** 用户ID */
  userId: z.number().describe("用户ID"),
  /** 资源URL */
  url: z.string().describe("资源URL"),
  /** 文件名 */
  fileName: z.string().describe("文件名"),
  /** 资源类型 */
  resourceType: z.number().describe("资源类型"),
  /** 认证信息 */
  auth: z.any().describe("认证信息").nullable(),
  /** 文件类型 */
  fileType: z.number().describe("文件类型"),
  /** 大屏ID */
  largeId: z.number().describe("大屏ID"),
  /** 组ID（可选） */
  groupId: z.number().describe("组ID").nullable(),
  /** 封面图 */
  cover: z.any().describe("封面图").nullable(),
  /** HDR预览图 */
  hdrPreviewImg: z.any().describe("HDR预览图").nullable(),
  /** 资源名称 */
  name: z.string().describe("资源名称"),
  /** 封面名称 */
  coverName: z.string().describe("封面名称").nullable(),
  /** 资源大小（可选） */
  resourceSize: z.number().describe("资源大小").optional(),
  /** 图层ID列表 */
  layerIds: z.string().describe("图层ID列表"),
  /** 大屏使用ID列表 */
  largeUseIds: z.string().describe("大屏使用ID列表"),
  /** 矢量数据预览图 */
  vectorDataPreviewImg: z.any().describe("矢量数据预览图").nullable()
});

/**
 * 组件 minioArr 元素的 Schema —— 与 MinIO 接口资源无关，见 {@link ComponentMinioAsset}。
 *
 * 【为什么是 looseObject】真实落盘的素材条目只有十来个字段，且各素材类型带的字段不一样
 * （视频有 isVideo/fileType，模型有别的）。原先这里挂的是 MinioResourceSchema，
 * 于是任何带素材组件的大屏 ScreenReader 都读不出来——largeUseIds 这类接口侧字段根本不会落盘。
 * 只校验消费方真正依赖的 id，其余透传。
 */
export const ComponentMinioAssetSchema: z.ZodType<ComponentMinioAsset> = z.looseObject({
  /** 素材 ID */
  id: z.number().describe("素材ID")
});
