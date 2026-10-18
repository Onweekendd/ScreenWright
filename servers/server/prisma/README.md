# PostgreSQL schema 与迁移

Screenwright 业务表与 Mastra 存储共用一个 PostgreSQL 实例（需要 pgvector 扩展），按 schema 隔离：

- `PRISMA_DATABASE_URL`：Prisma 管理的业务表、eval 表、figma 表（`public` schema）+ `_prisma_migrations`
- `MASTRA_DATABASE_URL` + `MASTRA_DATABASE_SCHEMA`（默认 `mastra`）：Mastra storage / memory / 追踪 + 组件 RAG 向量（pgvector）。Mastra 首次启动自建，不进 `schema.prisma`

本地起库：仓库根目录 `docker compose -f docker-compose.dev.yml up -d`。

## 日常迁移

开发环境创建 migration：

```bash
pnpm --dir servers/server exec dotenvx run -- prisma migrate dev --name <change_name>
```

部署 / 全新环境只应用已提交的 migration：

```bash
pnpm --dir servers/server exec dotenvx run -- prisma migrate deploy
```

## 全新环境初始化

```bash
pnpm --dir servers/server exec dotenvx run -- prisma migrate deploy   # 建表
pnpm --dir servers/server run seed-modules                            # 组件库
pnpm --dir servers/server run seed-bi-user                            # 初始超管（见下方登录说明）
pnpm --dir servers/server run seed-embeddings -- --reset              # 组件 RAG 向量（需 EMBEDDING_MODEL_*）
```

> 历史上曾短暂切到 SQLite（桌面版），现已回到 PostgreSQL；`0_init` 为重新基线后的 PG 迁移。
