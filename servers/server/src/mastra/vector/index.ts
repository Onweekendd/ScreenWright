import { LibSQLVector } from "@mastra/libsql";

import { sqliteUrl } from "@/lib/db/sqlite-url";

import "dotenv/config";

// 单机版：组件 RAG 向量落 SQLite（libsql），与 Mastra 记忆同库同文件。
export const vector = new LibSQLVector({
  id: "libsql-vector",
  url: sqliteUrl("MASTRA_DATABASE_URL", "file:./.data/mastra.db")
});
