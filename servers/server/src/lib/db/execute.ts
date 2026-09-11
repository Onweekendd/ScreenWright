import { parseJdbcUrl } from "./jdbc";

export interface DbConn {
  jdbcUrl: string;
  username: string;
  password: string;
}

const CONNECT_TIMEOUT_MS = 8000;
/** 单次查询硬上限，避免误拉全表打爆内存 */
const HARD_ROW_CAP = 5000;

/** 测试连接：能连上并跑通 SELECT 1 即算成功 */
export async function testConnection(conn: DbConn): Promise<void> {
  await runQuery(conn, "SELECT 1", 1);
}

/**
 * 执行 SQL 并返回行数组。
 * SQL 的变量替换 / 模板处理在前端完成，这里只负责连接 + 执行。
 * limit<=0 时用 HARD_ROW_CAP 兜底。
 */
export async function runQuery(conn: DbConn, sql: string, limit = 0): Promise<Array<Record<string, unknown>>> {
  const parsed = parseJdbcUrl(conn.jdbcUrl);
  const cap = limit > 0 ? Math.min(limit, HARD_ROW_CAP) : HARD_ROW_CAP;

  if (parsed.dialect === "mysql") {
    const mysql = await import("mysql2/promise");
    const c = await mysql.createConnection({
      host: parsed.host,
      port: parsed.port,
      database: parsed.database || undefined,
      user: conn.username,
      password: conn.password,
      connectTimeout: CONNECT_TIMEOUT_MS,
      ssl: parsed.params.useSSL === "true" ? {} : undefined,
      dateStrings: true
    });
    try {
      const [rows] = await c.query(sql);
      const arr = Array.isArray(rows) ? (rows as Array<Record<string, unknown>>) : [];
      return arr.slice(0, cap);
    } finally {
      await c.end().catch(() => {});
    }
  }

  // postgresql
  const { Client } = await import("pg");
  const client = new Client({
    host: parsed.host,
    port: parsed.port,
    database: parsed.database || undefined,
    user: conn.username,
    password: conn.password,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    ssl: parsed.params.ssl === "true" || parsed.params.sslmode === "require" ? { rejectUnauthorized: false } : undefined
  });
  await client.connect();
  try {
    const res = await client.query(sql);
    return (res.rows as Array<Record<string, unknown>>).slice(0, cap);
  } finally {
    await client.end().catch(() => {});
  }
}

/** 从一行推断列类型（供数据配置面板展示） */
export function inferColumns(rows: Array<Record<string, unknown>>): Array<{ name: string; type: string }> {
  if (!rows.length) {
    return [];
  }
  return Object.entries(rows[0]).map(([name, v]) => ({
    name,
    type: v === null ? "null" : typeof v === "number" ? "number" : typeof v === "boolean" ? "boolean" : "string"
  }));
}
