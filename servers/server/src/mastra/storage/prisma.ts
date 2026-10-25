import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "~/generated/prisma/client";

import "dotenv/config";

// 业务表 / eval 表 / figma 表落 PostgreSQL；连接串由 PRISMA_DATABASE_URL 提供。
const adapter = new PrismaPg({ connectionString: process.env.PRISMA_DATABASE_URL });

export const prismaClient = new PrismaClient({ adapter });
