# SQLite schema 与迁移

开源单机版：Screenwright 与 Mastra 都落 SQLite，互不共用文件。

- `PRISMA_DATABASE_URL`（如 `file:./.data/screenwright.db`）：Prisma 管理的业务表、eval 表、figma 表 + `_prisma_migrations`
- `MASTRA_DATABASE_URL`（如 `file:./.data/mastra.db`）：Mastra storage / memory / 追踪 + 组件 RAG 向量（libsql）。Mastra 首次启动自建，不进 `schema.prisma`

相对路径以 `servers/server` 为基准；`.data/` 已在 `.gitignore`。

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
pnpm --dir servers/server run seed-bi-user                            # 默认超管 admin/admin123
pnpm --dir servers/server run seed-embeddings -- --reset              # 组件 RAG 向量（需 EMBEDDING_MODEL_*）
```

> 迁移前的 PostgreSQL + pgvector 方案已废弃；历史 PG migration 见 git 记录。
