import { HTTPException } from "hono/http-exception";

import type { Prisma } from "~/generated/prisma/client";

import { ok } from "@/lib/http/envelope";
import { pageOf } from "@/lib/http/page";
import { blobUrl, deleteBlob, saveBlob } from "@/lib/storage/blob-store";
import { prismaClient } from "@/mastra/storage/prisma";

type FileRow = Awaited<ReturnType<typeof prismaClient.minioFile.findFirst>> & object;

const jsonStr = (v: unknown, fallback = ""): string => {
  if (v == null) {
    return fallback;
  }
  if (typeof v === "string") {
    return v;
  }
  return JSON.stringify(v);
};

/** MinioFile 行 → 前端 src/model/Assets.ts 的 assetItem */
function toAssetItem(row: FileRow) {
  return {
    id: row.id,
    userId: row.userId ?? 0,
    url: row.url ?? "",
    fileName: row.fileName ?? "",
    resourceType: row.resourceType ?? 0,
    auth: row.auth ?? null,
    fileType: row.fileType ?? 0,
    largeId: row.largeId ?? null,
    groupId: row.groupId ?? null,
    cover: row.cover ?? null,
    hdrPreviewImg: null,
    name: row.name,
    coverName: row.coverName ?? null,
    resourceSize: row.resourceSize ?? 0,
    layerIds: jsonStr(row.layerIds, ""),
    largeUseIds: jsonStr(row.largeUseIds, ""),
    createdBy: row.createdBy ?? "",
    createdTime: row.createdTime.toISOString(),
    updatedBy: row.updatedBy ?? "",
    updatedTime: row.updatedTime.toISOString()
  };
}

/* ---------------- 素材文件 ---------------- */

export async function pageFiles(
  userId: number,
  req: { current?: number; size?: number; groupId?: number | string; fileType?: number; name?: string }
) {
  const current = Number(req.current ?? 1);
  const size = Number(req.size ?? 20);
  const where: Prisma.MinioFileWhereInput = { userId };
  if (req.name) {
    where.name = { contains: String(req.name) };
  }
  const gid = Number(req.groupId);
  if (Number.isFinite(gid) && gid > 0) {
    where.groupId = gid;
  }
  if (req.fileType != null && Number.isFinite(Number(req.fileType)) && Number(req.fileType) >= 0) {
    where.fileType = Number(req.fileType);
  }
  const [total, rows] = await Promise.all([
    prismaClient.minioFile.count({ where }),
    prismaClient.minioFile.findMany({ where, skip: (current - 1) * size, take: size, orderBy: [{ id: "desc" }] })
  ]);
  return ok(pageOf(rows.map(toAssetItem), total, current, size));
}

export async function getFile(id: number) {
  const row = await prismaClient.minioFile.findUnique({ where: { id } });
  if (!row) {
    throw new HTTPException(404, { message: "素材不存在" });
  }
  return ok(toAssetItem(row));
}

/** 上传素材。fields 为 multipart 其余字段，file 为文件 */
export async function uploadFile(userId: number, userName: string, file: File, fields: Record<string, unknown>) {
  const buf = Buffer.from(await file.arrayBuffer());
  const saved = await saveBlob("bi-assets", file.name || "asset", buf);
  const created = await prismaClient.minioFile.create({
    data: {
      userId,
      name: String(fields.name ?? file.name ?? "未命名素材"),
      fileName: String(fields.fileName ?? file.name?.split(".").pop() ?? ""),
      url: saved.url,
      blobKey: saved.key,
      resourceType: fields.resourceType != null ? Number(fields.resourceType) : null,
      fileType: fields.fileType != null ? Number(fields.fileType) : null,
      groupId: fields.groupId != null && Number(fields.groupId) > 0 ? Number(fields.groupId) : null,
      largeId: fields.largeId != null ? Number(fields.largeId) : null,
      resourceSize: saved.size,
      layerIds: [],
      createdBy: userName,
      updatedBy: userName
    }
  });
  return ok(toAssetItem(created));
}

/** 更新素材：改名 / 换封面 / 换文件 */
export async function updateFile(userId: number, userName: string, fields: Record<string, unknown>, file: File | null) {
  const id = Number(fields.id);
  const existing = await prismaClient.minioFile.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "素材不存在" });
  }

  const data: Prisma.MinioFileUpdateInput = { updatedBy: userName };
  if (fields.name != null) {
    data.name = String(fields.name);
  }
  if (fields.groupId != null) {
    data.groupId = Number(fields.groupId) > 0 ? Number(fields.groupId) : null;
  }
  if (file) {
    await deleteBlob(existing.blobKey);
    const buf = Buffer.from(await file.arrayBuffer());
    const saved = await saveBlob("bi-assets", file.name || "asset", buf);
    data.url = saved.url;
    data.blobKey = saved.key;
    data.resourceSize = saved.size;
  }
  const updated = await prismaClient.minioFile.update({ where: { id }, data });
  return ok(toAssetItem(updated));
}

export async function deleteFile(userId: number, id: number) {
  const existing = await prismaClient.minioFile.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "素材不存在" });
  }
  await deleteBlob(existing.blobKey);
  await prismaClient.minioFile.delete({ where: { id } });
  return ok(null, "删除成功");
}

export async function deleteFilesBatch(userId: number, ids: number[]) {
  const rows = await prismaClient.minioFile.findMany({ where: { userId, id: { in: ids } } });
  await Promise.all(rows.map((r) => deleteBlob(r.blobKey)));
  await prismaClient.minioFile.deleteMany({ where: { userId, id: { in: ids } } });
  return ok(null, "删除成功");
}

/** 复制素材（不复制 blob 文件，复用同一 url/key） */
export async function copyFile(userId: number, userName: string, id: number) {
  const src = await prismaClient.minioFile.findUnique({ where: { id } });
  if (!src) {
    throw new HTTPException(404, { message: "素材不存在" });
  }
  const created = await prismaClient.minioFile.create({
    data: {
      userId,
      name: `${src.name} 副本`,
      fileName: src.fileName,
      url: src.url,
      blobKey: src.blobKey,
      resourceType: src.resourceType,
      fileType: src.fileType,
      groupId: src.groupId,
      resourceSize: src.resourceSize,
      layerIds: [],
      createdBy: userName,
      updatedBy: userName
    }
  });
  return ok(toAssetItem(created));
}

/** 用户素材占用大小（字节 + 可读） */
export async function usedSize(userId: number) {
  const rows = await prismaClient.minioFile.findMany({ where: { userId }, select: { resourceSize: true } });
  const bytes = rows.reduce((s, r) => s + (r.resourceSize ?? 0), 0);
  return ok({ size: bytes, usedSize: bytes, totalSize: 0, capacity: 0 });
}

/** 某素材被哪些大屏引用（开源版暂不追踪，返回空） */
export function getLargeUse() {
  return ok([]);
}

/* ---------------- 素材分组 ---------------- */

/**
 * 素材分组树（对齐 Java MinioGroupServiceImpl.getGroupList）
 * 前端 useSiderTreeData.handleAssetsData 只读 pageGroups → { list:[{...group,count}], allCount, groupCount, unCount }
 * （场景资产 modelGroups / 系统素材 systemXxx 开源版已移除）
 * MinioGroup.type: 1=页面资产；MinioFile.fileType: 2=页面资源
 */
async function groupObjFor(userId: number, groupType: number, fileType: number) {
  const groups = await prismaClient.minioGroup.findMany({
    where: { userId, type: groupType },
    orderBy: [{ id: "asc" }]
  });
  const [allCount, groupCount] = await Promise.all([
    prismaClient.minioFile.count({ where: { userId, fileType } }),
    prismaClient.minioFile.count({ where: { userId, fileType, groupId: { not: null } } })
  ]);
  const list = await Promise.all(
    groups.map(async (g) => ({
      id: g.id,
      name: g.name,
      type: g.type,
      count: await prismaClient.minioFile.count({ where: { userId, fileType, groupId: g.id } })
    }))
  );
  return { allCount, groupCount, unCount: allCount - groupCount, list };
}

export async function listGroups(userId: number) {
  const pageGroups = await groupObjFor(userId, 1, 2);
  return ok({ pageGroups });
}

export async function addGroup(userId: number, userName: string, name: string, type = 0) {
  const created = await prismaClient.minioGroup.create({
    data: { userId, name, type, createdBy: userName, updatedBy: userName }
  });
  return ok({ id: created.id, name: created.name, type: created.type });
}

export async function editGroup(userId: number, userName: string, id: number, name: string) {
  const existing = await prismaClient.minioGroup.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "分组不存在" });
  }
  const updated = await prismaClient.minioGroup.update({ where: { id }, data: { name, updatedBy: userName } });
  return ok({ id: updated.id, name: updated.name });
}

export async function deleteGroup(userId: number, id: number) {
  const existing = await prismaClient.minioGroup.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new HTTPException(404, { message: "分组不存在" });
  }
  await prismaClient.minioFile.updateMany({ where: { groupId: id }, data: { groupId: null } });
  await prismaClient.minioGroup.delete({ where: { id } });
  return ok(null, "删除成功");
}

export { blobUrl };
