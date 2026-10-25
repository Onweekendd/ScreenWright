# syntax=docker/dockerfile:1.7
#
# 两个构建目标（compose 里按需选）：
#   --target server   后端镜像。同一个镜像按 ROLE 起 api / ai / worker，也用来跑迁移任务
#   --target web      前端镜像。nginx 托管编辑器静态文件，并按路径把请求分流给 api / ai
#
# 国内网络可加 --build-arg NPM_REGISTRY=https://registry.npmmirror.com

ARG NODE_VERSION=22
ARG NPM_REGISTRY=https://registry.npmjs.org

# ───────────── base：Node + pnpm ─────────────
FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG NPM_REGISTRY
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_NPM_REGISTRY=${NPM_REGISTRY} \
    NPM_CONFIG_REGISTRY=${NPM_REGISTRY} \
    CI=true
# openssl：Prisma 的迁移引擎要用；git：构建 / 运行都可能用到
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates git \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable && corepack prepare pnpm@10.15.0 --activate
WORKDIR /app

# ───────────── manifests：只抽出 package.json / lockfile ─────────────
# 单独一层，源码改动不会让下面的依赖安装层缓存失效（只要这些清单文件内容没变）
FROM base AS manifests
COPY . /src
# server 的 postinstall 会跑 prisma generate，安装依赖这一步就得看到 schema 和 prisma 配置，所以一并带上
RUN mkdir /out && cd /src \
    && find . -name package.json -not -path '*/node_modules/*' -exec cp --parents {} /out \; \
    && cp pnpm-lock.yaml pnpm-workspace.yaml /out/ \
    && cp .npmrc /out/ 2>/dev/null || true \
    && cp -r patches /out/patches \
    && mkdir -p /out/servers/server/prisma \
    && cp servers/server/prisma/schema.prisma /out/servers/server/prisma/ \
    && cp servers/server/prisma.config.ts /out/servers/server/

# ───────────── server-build：后端依赖 + 构建 ─────────────
FROM base AS server-build
# prisma generate 只读 schema，不会真连库；给个占位连接串满足 prisma.config.ts 的 env() 检查
ENV PRISMA_DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY --from=manifests /out ./
RUN --mount=type=cache,id=funbi-pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
    && pnpm install --frozen-lockfile --filter "@screenwright/server..."

COPY packages ./packages
COPY apps/artifact-app-template ./apps/artifact-app-template
COPY servers/server ./servers/server

# 后端运行时依赖的 workspace 包：各自出 dist（create-screenwright-app 会把 artifact-app 模板拷进去）
RUN pnpm --filter @screenwright/types run build \
    && pnpm --filter @screenwright/core run build \
    && pnpm --filter @screenwright/figma-helper run shared:build \
    && pnpm --filter create-screenwright-app run build

WORKDIR /app/servers/server
# esbuild 把 src 打成一个入口，第三方包保持外置（运行时从 node_modules 解析）；
# 再生成 skills/overviews（主 agent 只挂载它，由 executor skill 派生），镜像里先备好
RUN pnpm run build:server \
    && pnpm exec tsx scripts/sync-skill-overviews.ts

# pnpm deploy：只带生产依赖，并把 workspace 包按实际内容拷进去（不是指向源码目录的软链）
WORKDIR /app
RUN pnpm --filter @screenwright/server deploy --legacy --prod /prod/server

# ───────────── server：后端运行镜像 ─────────────
FROM node:${NODE_VERSION}-bookworm-slim AS server
# git：大屏工作区版本快照；ffmpeg 同时提供视频处理和 ffprobe 媒体信息读取
RUN apt-get update \
    && apt-get install -y --no-install-recommends git openssl ca-certificates ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# WORKSPACE_SEED_DIR：镜像里自带的 agent-workspace 模板（skills 等），启动时同步进持久化的工作区卷
ENV NODE_ENV=production \
    GIT_AUTHOR_NAME=funbi GIT_AUTHOR_EMAIL=funbi@localhost \
    GIT_COMMITTER_NAME=funbi GIT_COMMITTER_EMAIL=funbi@localhost \
    WORKSPACE_SEED_DIR=/app/servers/server/agent-workspace \
    MASTRA_WORKSPACE_PATH=/data/agent-workspace

WORKDIR /app/servers/server
COPY --from=server-build --chown=node:node /prod/server ./
# deploy 只带 package.json 的 files 清单里的文件；迁移 / 种子脚本还要源码和 prisma 配置
COPY --from=server-build --chown=node:node /app/servers/server/src ./src
COPY --from=server-build --chown=node:node /app/servers/server/scripts ./scripts
COPY --from=server-build --chown=node:node /app/servers/server/prisma ./prisma
COPY --from=server-build --chown=node:node /app/servers/server/prisma.config.ts /app/servers/server/tsconfig.json ./
COPY --from=server-build --chown=node:node /app/servers/server/agent-workspace ./agent-workspace
COPY docker/server-entrypoint.sh docker/migrate.sh /docker/
RUN sed -i 's/\r$//' /docker/*.sh && chmod +x /docker/*.sh \
    && mkdir -p /data/agent-workspace /app/servers/server/blob-storage \
    && chown node:node /data /data/agent-workspace /app/servers/server /app/servers/server/blob-storage

USER node
EXPOSE 4111
ENTRYPOINT ["/docker/server-entrypoint.sh"]
CMD ["node", "dist/server.mjs"]

# ───────────── web-build：编辑器静态文件 ─────────────
FROM base AS web-build
ENV PRISMA_DATABASE_URL=postgresql://build:build@localhost:5432/build
COPY --from=manifests /out ./
RUN --mount=type=cache,id=funbi-pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
    && pnpm install --frozen-lockfile --filter "@screenwright/app..."

COPY packages ./packages
# create-screenwright-app（经 server 间接依赖）构建时要把模板拷进 dist
COPY apps/artifact-app-template ./apps/artifact-app-template
COPY servers/server ./servers/server
COPY apps/app ./apps/app

# app 依赖的 workspace 包先各自构建；server 的 build:client 产出前端用的 RPC 客户端
RUN pnpm --filter "@screenwright/app^..." --if-present run build \
    && pnpm --filter @screenwright/server run build:client

WORKDIR /app/apps/app
RUN pnpm run build:fontFace \
    && pnpm run build:lib \
    && NODE_OPTIONS=--max-old-space-size=8192 pnpm exec vite build

# ───────────── web：nginx ─────────────
FROM nginx:1.27-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=web-build /app/apps/app/dist /usr/share/nginx/html
EXPOSE 80
