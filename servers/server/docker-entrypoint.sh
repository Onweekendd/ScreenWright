#!/bin/sh
set -e

PRISMA="/app/node_modules/.bin/prisma"
TSX="/app/node_modules/.bin/tsx"
SCRIPTS="/app/servers/server/scripts"

# 数据库迁移始终执行（幂等）
echo ">>> 执行数据库迁移..."
$PRISMA migrate deploy

# 模块数据：seed-modules 用 upsert(where:name)，幂等，始终执行以扛住 DB 重置
echo ">>> 导入模块数据..."
$TSX $SCRIPTS/seed-modules.ts

# 组件向量：按「向量库是否已有数据」判断，取代不持久的容器内标记文件。
# seed 本身已幂等（componentId 稳定 id 原地 upsert、非破坏），此处判空仅为
# 避免每次部署重复调用 embedding API、并避免 API 抖动阻塞启动。
if $TSX $SCRIPTS/has-embeddings.ts; then
  echo ">>> 向量库已有数据，跳过组件向量灌库"
else
  echo ">>> 向量库为空，执行组件向量灌库..."
  $TSX $SCRIPTS/seed-component-embeddings.ts
fi

echo ">>> 初始化完成"

exec "$@"
