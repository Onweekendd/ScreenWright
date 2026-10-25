import { PgVector } from "@mastra/pg";

import { mastraDatabaseSchema } from "../storage/database-schema";

import "dotenv/config";

// 组件 RAG 向量落 pgvector，与 Mastra 记忆同库（独立 schema）。
export const vector = new PgVector({
  id: "pg-vector",
  connectionString: process.env.MASTRA_DATABASE_URL!,
  schemaName: mastraDatabaseSchema
});
