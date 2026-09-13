import path from "node:path";

import { importSystemMaterials } from "@/mastra/services/system-material-import";
import { prismaClient } from "@/mastra/storage/prisma";

const sourceArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const sourceRoot = sourceArg ? path.resolve(sourceArg) : undefined;

importSystemMaterials(sourceRoot)
  .then((result) => {
    console.log("系统素材导入完成:", result);
  })
  .catch((error) => {
    console.error("系统素材导入失败:", error);
    process.exitCode = 1;
  })
  .finally(() => prismaClient.$disconnect());
