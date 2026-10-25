/** Mastra 记忆 / 线程 / 追踪 / 向量所在的 PG schema，与 Prisma 业务表（public）隔离 */
export const mastraDatabaseSchema = process.env.MASTRA_DATABASE_SCHEMA ?? "mastra";
