import type { Prisma } from "~/generated/prisma/client";

import { prismaClient } from "@/mastra/storage/prisma";

import type { Blueprint } from "./schema";

/** 读一个大屏的蓝图；没写过返回 null */
export async function loadBlueprint(screenKey: string): Promise<Blueprint | null> {
  const row = await prismaClient.designBlueprint.findUnique({ where: { screenKey } });
  return row ? (row.data as unknown as Blueprint) : null;
}

/** 整份覆盖写入（一个大屏只有一份蓝图） */
export async function saveBlueprint(blueprint: Blueprint, threadId?: string): Promise<void> {
  const data = blueprint as unknown as Prisma.InputJsonValue;
  await prismaClient.designBlueprint.upsert({
    where: { screenKey: blueprint.screenKey },
    create: { screenKey: blueprint.screenKey, threadId, data },
    update: { threadId, data }
  });
}
