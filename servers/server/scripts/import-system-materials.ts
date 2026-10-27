import path from "node:path";

import { importSystemMaterials } from "@/mastra/services/ai-assets/system-material-import";
import { optimizeSystemMaterialThumbnails } from "@/mastra/services/ai-assets/system-material-thumbnails";
import { prismaClient } from "@/mastra/storage/prisma";

const sourceArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const sourceRoot = sourceArg ? path.resolve(sourceArg) : undefined;

importSystemMaterials(sourceRoot)
  .then(async (result) => {
    console.log("系统素材导入完成:", result);
    const thumbnails = await optimizeSystemMaterialThumbnails();
    console.log("系统素材缩略图优化完成:", thumbnails);
    if (thumbnails.failed) process.exitCode = 1;
  })
  .catch((error) => {
    console.error("系统素材导入失败:", error);
    process.exitCode = 1;
  })
  .finally(() => prismaClient.$disconnect());
