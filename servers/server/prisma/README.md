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
pnpm --dir servers/server run seed-bi-user                            # 初始超管（口令见 SEED_ADMIN_PASSWORD）
pnpm --dir servers/server run seed-embeddings -- --reset              # 组件 RAG 向量（需 EMBEDDING_MODEL_*）
```

> 历史上曾短暂切到 SQLite（桌面版），现已回到 PostgreSQL；`0_init` 为重新基线后的 PG 迁移。

## 视频多模态输入

`20261024000000_video_multimodal_inputs` 为生成视频记录增加尾帧及参考图片、视频、音频字段，更新服务前先应用迁移。

`createVideoTool` 支持文生视频、首帧、尾帧、首尾帧和多模态参考。首尾帧不能与参考素材混用。图片使用内部 assetStore URL，由服务端读取并转换为 data URL；参考视频、音频使用服务商可直接下载的公网 HTTP/HTTPS URL，内部资源通过 `signedUrl` 获取下载地址。

本地文件存储部署在公网服务器上时，可设置 `ASSET_PUBLIC_BASE_URL=http://<公网IP>:<对外端口>`，并确保该地址的 `/blobs/` 实际提供当前 `BLOB_STORAGE_DIR` 中的文件。修改这个变量只改变 URL，不会把本地文件上传到另一台服务器。MinIO 的签名 URL 使用 `MINIO_ENDPOINT` 与 `MINIO_PORT`，该端点也必须能被服务商访问；仅配置 `MINIO_PUBLIC_ENDPOINT` 不会改变签名地址。HTTP 是否被接受仍取决于服务商/网关，代码允许 HTTP 和 HTTPS。
