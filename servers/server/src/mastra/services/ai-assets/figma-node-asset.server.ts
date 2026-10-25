import { HTTPException } from "hono/http-exception";
import type { z } from "zod";

import { assetStore } from "@/lib/storage";
import {
  allExtractors,
  collapseSvgContainers,
  simplifyRawFigmaObject
} from "@/mastra/mcp/figma-context-mcp/server/extractors/index";
import { prismaClient } from "@/mastra/storage/prisma";
import type {
  BatchByNodeIdsRequestSchema,
  CreateOrUpdateRequestSchema,
  SimplifyFigmaNodeDataRequestSchema,
  UpdateByIdRequestSchema,
  UploadImageRequestSchema
} from "@/mastra/types/figma-node-asset";

type UploadImageInput = z.infer<typeof UploadImageRequestSchema>;
type BatchByNodeIdsInput = z.infer<typeof BatchByNodeIdsRequestSchema>;
type CreateOrUpdateInput = z.infer<typeof CreateOrUpdateRequestSchema>;
type UpdateByIdInput = z.infer<typeof UpdateByIdRequestSchema>;
type SimplifyFigmaNodeDataInput = z.infer<typeof SimplifyFigmaNodeDataRequestSchema>;

const ok = (data: unknown) => ({ code: 200, message: "ok", data });

/**
 * `bucket` 列在这里只是一个**逻辑区分符**（downloadImage 按它过滤），不对应真实对象存储桶；
 * 保持固定值以兼容历史行与默认查询。实际落地由 `assetStore()` 决定。
 */
const BUCKET_LABEL = "screenwright";
const PREFIX = "figma-nodes";

export async function uploadImage({ nodeId, nodeName, fileKey, bytes }: UploadImageInput) {
  if (!nodeId || !fileKey || bytes.length === 0) {
    throw new HTTPException(400, { message: "nodeId, fileKey, bytes are required" });
  }

  const safeNodeId = nodeId.replace(/:/g, "-");
  const objectKey = `${PREFIX}/${fileKey}/${safeNodeId}.png`;
  const buffer = Buffer.from(bytes);
  const { url } = await assetStore().put(objectKey, buffer, { contentType: "image/png" });

  const record = await prismaClient.figmaNodeAsset.upsert({
    where: { fileKey_nodeId: { fileKey, nodeId } },
    create: {
      fileKey,
      nodeId,
      nodeName,
      bucket: BUCKET_LABEL,
      objectKey,
      url,
      mimeType: "image/png",
      fileSize: buffer.length
    },
    update: { nodeName, bucket: BUCKET_LABEL, objectKey, url, mimeType: "image/png", fileSize: buffer.length }
  });

  return ok(record);
}

export async function downloadImage(nodeId: string | undefined, bucketName = BUCKET_LABEL) {
  if (!nodeId) {
    throw new HTTPException(400, { message: "nodeId is required" });
  }

  const record = await prismaClient.figmaNodeAsset.findFirst({
    where: { nodeId, bucket: bucketName }
  });

  if (!record?.objectKey) {
    throw new HTTPException(404, { message: "Asset not found" });
  }

  let body: Buffer;
  try {
    body = await assetStore().get(record.objectKey);
  } catch {
    throw new HTTPException(502, { message: "Failed to fetch object from storage" });
  }

  const fileName = record.objectKey.split("/").pop() || "image.png";
  const mimeType = record.mimeType || "image/png";

  return { body, mimeType, fileName, size: record.fileSize ?? body.length };
}

export async function batchByNodeIds({ nodeIds }: BatchByNodeIdsInput) {
  if (nodeIds.length === 0) {
    throw new HTTPException(400, { message: "nodeIds is required and must be a non-empty array" });
  }
  const records = await prismaClient.figmaNodeAsset.findMany({
    where: { nodeId: { in: nodeIds } }
  });
  return ok(records);
}

export async function getByNodeId(nodeId: string) {
  const record = await prismaClient.figmaNodeAsset.findFirst({ where: { nodeId } });
  if (!record) {
    throw new HTTPException(404, { message: "Not found" });
  }
  return ok(record);
}

export async function listAll(fileKey: string | undefined, page: number, pageSize: number) {
  const where = fileKey ? { fileKey } : {};
  const [total, list] = await Promise.all([
    prismaClient.figmaNodeAsset.count({ where }),
    prismaClient.figmaNodeAsset.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" }
    })
  ]);
  return ok({ total, page, pageSize, list });
}

export async function createOrUpdate({
  fileKey,
  nodeId,
  nodeName,
  bucket,
  objectKey,
  url,
  mimeType,
  fileSize
}: CreateOrUpdateInput) {
  const record = await prismaClient.figmaNodeAsset.upsert({
    where: { fileKey_nodeId: { fileKey, nodeId } },
    create: { fileKey, nodeId, nodeName, bucket, objectKey, url, mimeType, fileSize },
    update: { nodeName, bucket, objectKey, url, mimeType, fileSize }
  });
  return ok(record);
}

export async function updateById(id: string, input: UpdateByIdInput) {
  const existing = await prismaClient.figmaNodeAsset.findUnique({ where: { id } });
  if (!existing) {
    throw new HTTPException(404, { message: "Not found" });
  }
  const updated = await prismaClient.figmaNodeAsset.update({
    where: { id },
    data: input
  });
  return ok(updated);
}

export async function deleteById(id: string) {
  const existing = await prismaClient.figmaNodeAsset.findUnique({ where: { id } });
  if (!existing) {
    throw new HTTPException(404, { message: "Not found" });
  }
  await prismaClient.figmaNodeAsset.delete({ where: { id } });
  return ok(null);
}

// 新增：简化 Figma 节点数据函数
export async function simplifyFigmaNodeData({ nodeId, fileKey, nodeName, figmaData }: SimplifyFigmaNodeDataInput) {
  try {
    const simplifiedData = simplifyRawFigmaObject(figmaData, allExtractors, {
      afterChildren: collapseSvgContainers
    });

    const jsonStr = JSON.stringify(simplifiedData);
    const buffer = Buffer.from(jsonStr, "utf-8");
    const safeNodeId = nodeId.replace(/:/g, "-");
    const objectKey = `${PREFIX}/${fileKey}/${safeNodeId}.json`;

    const { url } = await assetStore().put(objectKey, buffer, { contentType: "application/json" });

    // 同时保留原始 Figma 配置文件，便于排查转换问题
    const rawJsonStr = JSON.stringify(figmaData);
    const rawBuffer = Buffer.from(rawJsonStr, "utf-8");
    await assetStore().put(`${PREFIX}/${fileKey}/${safeNodeId}-raw.json`, rawBuffer, {
      contentType: "application/json"
    });

    // 存储映射到 FigmaNodeJson 表
    const record = await prismaClient.figmaNodeJson.upsert({
      where: { fileKey_nodeId: { fileKey, nodeId } },
      create: {
        fileKey,
        nodeId,
        nodeName: nodeName || "Figma Simplified Data",
        bucket: BUCKET_LABEL,
        objectKey,
        url,
        mimeType: "application/json",
        fileSize: buffer.length
      },
      update: {
        nodeName: nodeName || "Figma Simplified Data",
        bucket: BUCKET_LABEL,
        objectKey,
        url,
        mimeType: "application/json",
        fileSize: buffer.length
      }
    });

    return ok({
      success: true,
      data: simplifiedData,
      record
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Failed to simplify Figma data:", message);
    throw new HTTPException(500, { message: `Failed to simplify Figma data: ${message}` });
  }
}
