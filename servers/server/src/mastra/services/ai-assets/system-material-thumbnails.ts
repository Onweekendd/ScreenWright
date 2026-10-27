import { createHash } from "node:crypto";

import sharp from "sharp";

import { assetStore } from "@/lib/storage";
import { prismaClient } from "@/mastra/storage/prisma";

const PREFIX = "system-thumbnails/v1/";

export async function makeSystemMaterialThumbnail(data: Buffer): Promise<Buffer> {
  return sharp(data)
    .rotate()
    .resize(320, 320, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/** Only changes list covers. Original URLs and original objects remain intact. */
export async function optimizeSystemMaterialThumbnails() {
  const store = assetStore();
  const rows = await prismaClient.minioFile.findMany({
    where: { userId: null, fileType: 5 },
    select: { id: true, blobKey: true, resourceType: true, cover: true },
    orderBy: { id: "asc" }
  });
  const result = { created: 0, skipped: 0, failed: 0, sourceBytes: 0, thumbnailBytes: 0 };
  for (const row of rows) {
    // URL.pathname encodes Chinese names; the object store keys use decoded names.
    const encodedCoverKey = row.cover ? store.keyFromUrl(row.cover) : null;
    const coverKey = encodedCoverKey ? decodeURIComponent(encodedCoverKey) : null;
    if (coverKey?.startsWith(PREFIX) && (await store.head(coverKey))) {
      result.skipped++;
      continue;
    }
    const imageCover = coverKey && /\.(png|jpe?g|gif|webp|svg|apng)$/i.test(coverKey);
    const sourceKey = imageCover ? coverKey : row.resourceType === 1 ? row.blobKey : null;
    if (!sourceKey) {
      result.skipped++;
      continue;
    }
    try {
      const original = await store.get(sourceKey);
      const thumbnail = await makeSystemMaterialThumbnail(original);
      const hash = createHash("sha256").update(thumbnail).digest("hex");
      const key = `${PREFIX}${hash}.webp`;
      if (!(await store.head(key))) {
        await store.put(key, thumbnail, { contentType: "image/webp" });
      }
      await prismaClient.minioFile.update({
        where: { id: row.id },
        data: { cover: store.publicUrl(key), coverName: `${hash}.webp` }
      });
      result.created++;
      result.sourceBytes += original.length;
      result.thumbnailBytes += thumbnail.length;
      if (result.created % 100 === 0) {
        console.log(`缩略图已生成 ${result.created}/${rows.length}`);
      }
    } catch (error) {
      result.failed++;
      console.error(`素材 ${row.id} 缩略图生成失败:`, (error as Error).message);
    }
  }
  return result;
}
