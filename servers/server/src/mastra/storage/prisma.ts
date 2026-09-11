import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "~/generated/prisma/client";

import "dotenv/config";

// 单机版落 SQLite；URL 由 PRISMA_DATABASE_URL 提供（如 file:./.data/screenwright.db），
// 相对路径以 servers/server 工作目录为基准。
const adapter = new PrismaBetterSqlite3({
  url: process.env.PRISMA_DATABASE_URL ?? "file:./.data/screenwright.db"
});

export const prismaClient = new PrismaClient({ adapter });
