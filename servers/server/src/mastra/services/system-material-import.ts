import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { assetStore } from "@/lib/storage";
import { blobRoot, blobUrl } from "@/lib/storage/blob-store";
import { prismaClient } from "@/mastra/storage/prisma";

export const SYSTEM_MATERIAL_TYPE = 5;

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg", ".mov"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".apng"]);

interface ScannedFile {
  name: string;
  extension: string;
  sourcePath: string;
  blobKey: string;
  size: number;
  modifiedTime: Date;
}

interface ScannedAsset extends ScannedFile {
  cover: ScannedFile | null;
  groupName: string;
  resourceType: number;
}

export interface ImportSystemMaterialsResult {
  sourceRoot: string;
  groupsCreated: number;
  filesCreated: number;
  filesUpdated: number;
  filesUnchanged: number;
  objectsUploaded: number;
  assetsFound: number;
  coversFound: number;
  coversLinked: number;
}

const naturalCompare = (a: string, b: string) => a.localeCompare(b, "zh-CN", { numeric: true });

const keyFor = (groupName: string, fileName: string) => path.posix.join("system", groupName, fileName);

async function scanSystemMaterials(sourceRoot: string): Promise<{ assets: ScannedAsset[]; covers: ScannedFile[] }> {
  const groupEntries = (await readdir(sourceRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => naturalCompare(a.name, b.name));
  const assets: ScannedAsset[] = [];
  const covers: ScannedFile[] = [];

  for (const groupEntry of groupEntries) {
    const groupPath = path.join(sourceRoot, groupEntry.name);
    const fileEntries = (await readdir(groupPath, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .sort((a, b) => naturalCompare(a.name, b.name));
    const scanned: ScannedFile[] = [];

    for (const entry of fileEntries) {
      const sourcePath = path.join(groupPath, entry.name);
      const fileStat = await stat(sourcePath);
      scanned.push({
        name: entry.name,
        extension: path.extname(entry.name).toLowerCase(),
        sourcePath,
        blobKey: keyFor(groupEntry.name, entry.name),
        size: fileStat.size,
        modifiedTime: fileStat.mtime
      });
    }

    const groupCovers = scanned.filter((file) => file.name.toLowerCase().startsWith("cover_"));
    covers.push(...groupCovers);
    const imageCoverByStem = new Map(
      groupCovers
        .filter((file) => IMAGE_EXTENSIONS.has(file.extension))
        .map((file) => [path.parse(file.name.slice("cover_".length)).name.toLocaleLowerCase(), file] as const)
    );

    for (const file of scanned) {
      if (file.name.toLowerCase().startsWith("cover_")) {
        continue;
      }
      const stem = path.parse(file.name).name;
      assets.push({
        ...file,
        cover: imageCoverByStem.get(stem.toLocaleLowerCase()) ?? null,
        groupName: groupEntry.name,
        resourceType: VIDEO_EXTENSIONS.has(file.extension) ? 2 : 1
      });
    }
  }

  return { assets, covers };
}

async function ensureObject(file: ScannedFile): Promise<boolean> {
  const existing = await assetStore().head(file.blobKey);
  if (existing?.size === file.size) {
    return false;
  }
  await assetStore().put(file.blobKey, await readFile(file.sourcePath));
  return true;
}

/**
 * 把 blob-storage/system/<分组>/<文件> 幂等导入 MinioGroup / MinioFile。
 * cover_* 文件作为同名素材的封面，不单独生成素材记录。
 */
export async function importSystemMaterials(
  sourceRoot = path.join(blobRoot(), "system")
): Promise<ImportSystemMaterialsResult> {
  const resolvedSource = path.resolve(sourceRoot);
  const { assets, covers } = await scanSystemMaterials(resolvedSource);
  let objectsUploaded = 0;

  for (const file of [...assets, ...covers]) {
    if (await ensureObject(file)) {
      objectsUploaded++;
    }
  }

  const groupNames = [...new Set(assets.map((asset) => asset.groupName))];
  const existingGroups = await prismaClient.minioGroup.findMany({
    where: { userId: null, type: SYSTEM_MATERIAL_TYPE }
  });
  const groupByName = new Map(existingGroups.map((group) => [group.name, group]));
  let groupsCreated = 0;

  for (const name of groupNames) {
    if (groupByName.has(name)) {
      continue;
    }
    const created = await prismaClient.minioGroup.create({
      data: {
        userId: null,
        name,
        type: SYSTEM_MATERIAL_TYPE,
        createdBy: "system",
        updatedBy: "system"
      }
    });
    groupByName.set(name, created);
    groupsCreated++;
  }

  const existingFiles = await prismaClient.minioFile.findMany({
    where: { userId: null, fileType: SYSTEM_MATERIAL_TYPE }
  });
  const fileByBlobKey = new Map(existingFiles.filter((file) => file.blobKey).map((file) => [file.blobKey!, file]));
  let filesCreated = 0;
  let filesUpdated = 0;
  let filesUnchanged = 0;

  for (const asset of assets) {
    const groupId = groupByName.get(asset.groupName)!.id;
    const name = path.parse(asset.name).name;
    const extension = asset.extension.slice(1);
    const url = blobUrl(asset.blobKey);
    const cover = asset.cover ? blobUrl(asset.cover.blobKey) : null;
    const coverName = asset.cover?.name ?? null;
    const existing = fileByBlobKey.get(asset.blobKey);

    if (!existing) {
      await prismaClient.minioFile.create({
        data: {
          userId: null,
          name,
          fileName: extension,
          url,
          blobKey: asset.blobKey,
          resourceType: asset.resourceType,
          fileType: SYSTEM_MATERIAL_TYPE,
          groupId,
          cover,
          coverName,
          resourceSize: asset.size,
          layerIds: [],
          largeUseIds: [],
          createdBy: "system",
          updatedBy: "system",
          createdTime: asset.modifiedTime
        }
      });
      filesCreated++;
      continue;
    }

    const changed =
      existing.name !== name ||
      existing.fileName !== extension ||
      existing.url !== url ||
      existing.resourceType !== asset.resourceType ||
      existing.groupId !== groupId ||
      existing.cover !== cover ||
      existing.coverName !== coverName ||
      existing.resourceSize !== asset.size;
    if (!changed) {
      filesUnchanged++;
      continue;
    }
    await prismaClient.minioFile.update({
      where: { id: existing.id },
      data: {
        name,
        fileName: extension,
        url,
        resourceType: asset.resourceType,
        groupId,
        cover,
        coverName,
        resourceSize: asset.size,
        updatedBy: "system"
      }
    });
    filesUpdated++;
  }

  return {
    sourceRoot: resolvedSource,
    groupsCreated,
    filesCreated,
    filesUpdated,
    filesUnchanged,
    objectsUploaded,
    assetsFound: assets.length,
    coversFound: covers.length,
    coversLinked: assets.filter((asset) => asset.cover).length
  };
}
