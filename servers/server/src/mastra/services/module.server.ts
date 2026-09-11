import { ok } from "@/lib/http/envelope";
import { prismaClient } from "@/mastra/storage/prisma";

type ModuleRow = Awaited<ReturnType<typeof prismaClient.module.findFirst>> & object;

/** Module 行 → 前端 src/model/Library.ts 的 ModuleInfo */
function toModuleInfo(row: ModuleRow) {
  return {
    id: row.moduleId ?? 0,
    userId: row.userId ?? null,
    type: row.type ?? 0,
    status: row.status ?? 0,
    firstLevelMenu: row.firstLevelMenu ?? "",
    secondLevelMenu: row.secondLevelMenu ?? "",
    javaScript: row.javaScript ?? "",
    template: row.template ?? "",
    name: row.name ?? "",
    thumbnail: row.thumbnail ?? "",
    createdBy: row.createdBy ?? "",
    createdTime: row.createdTime ? row.createdTime.toISOString() : "",
    updatedBy: row.updatedBy ?? "",
    updatedTime: row.updatedTime ? row.updatedTime.toISOString() : ""
  };
}

/** 组件模块列表（分页，前端只读 records） */
export async function listModules(req: { current?: number; size?: number; name?: string }) {
  const current = req.current ?? 1;
  const size = req.size ?? 200;
  const where = req.name ? { name: { contains: req.name } } : {};
  const [total, rows] = await Promise.all([
    prismaClient.module.count({ where }),
    prismaClient.module.findMany({
      where,
      skip: (current - 1) * size,
      take: size,
      orderBy: [{ moduleId: "asc" }]
    })
  ]);
  return ok({ records: rows.map(toModuleInfo), total, current, size });
}

/** 单个组件模块详情（:id 为 moduleId） */
export async function getModule(moduleId: number) {
  const row = await prismaClient.module.findFirst({ where: { moduleId } });
  return ok(row ? toModuleInfo(row) : null);
}
