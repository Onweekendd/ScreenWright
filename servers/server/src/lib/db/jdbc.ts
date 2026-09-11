/**
 * 解析前端传来的 JDBC 风格连接串。
 * 开源版仅支持 mysql / postgresql（纯 JS 驱动）。
 * 例：jdbc:mysql://10.0.0.1:3306/mydb?useSSL=false
 *     jdbc:postgresql://localhost:5432/mydb
 */
export type SqlDialect = "mysql" | "postgresql";

export interface ParsedJdbc {
  dialect: SqlDialect;
  host: string;
  port: number;
  database: string;
  params: Record<string, string>;
}

const DEFAULT_PORT: Record<SqlDialect, number> = { mysql: 3306, postgresql: 5432 };

export function parseJdbcUrl(raw: string): ParsedJdbc {
  const url = (raw || "").trim().replace(/^jdbc:/i, "");
  const match = /^(mysql|postgresql|postgres):\/\/([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/i.exec(url);
  if (!match) {
    throw new Error(`不支持或无法解析的连接串：${raw}（开源版仅支持 mysql / postgresql）`);
  }
  const dialect: SqlDialect = match[1].toLowerCase() === "mysql" ? "mysql" : "postgresql";
  const [host, portStr] = match[2].split(":");
  const params: Record<string, string> = {};
  if (match[4]) {
    for (const pair of match[4].split("&")) {
      const [k, v = ""] = pair.split("=");
      if (k) {
        params[decodeURIComponent(k)] = decodeURIComponent(v);
      }
    }
  }
  return {
    dialect,
    host: host || "localhost",
    port: portStr ? Number(portStr) : DEFAULT_PORT[dialect],
    database: match[3] ? decodeURIComponent(match[3]) : "",
    params
  };
}
