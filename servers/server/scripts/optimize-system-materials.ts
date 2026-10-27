import { optimizeSystemMaterialThumbnails } from "@/mastra/services/ai-assets/system-material-thumbnails";
import { prismaClient } from "@/mastra/storage/prisma";

optimizeSystemMaterialThumbnails()
  .then((result) => {
    console.log("系统素材缩略图优化完成:", result);
    if (result.failed) process.exitCode = 1;
  })
  .catch((error) => {
    console.error("系统素材缩略图优化失败:", error);
    process.exitCode = 1;
  })
  .finally(() => prismaClient.$disconnect());
