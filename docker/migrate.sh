#!/bin/sh
# 一次性初始化任务（compose 的 migrate 服务）：建表 → 导入组件库 → 创建超管 → （可选）组件向量。
# 全部幂等，每次部署都可以重复跑；api / ai / worker 等它成功退出后才启动。
set -e

PRISMA=./node_modules/.bin/prisma
TSX=./node_modules/.bin/tsx

echo ">>> 执行数据库迁移..."
$PRISMA migrate deploy

echo ">>> 导入组件库数据..."
$TSX scripts/seed-modules.ts

echo ">>> 初始化超管账号..."
$TSX scripts/seed-bi-user.ts

# 组件向量只有配置了嵌入模型才能灌；按「向量库是否已有数据」判断，已有就跳过，避免每次部署重复调用 embedding 接口
if [ -n "$EMBEDDING_MODEL_API_KEY" ]; then
  if $TSX scripts/has-embeddings.ts; then
    echo ">>> 向量库已有数据，跳过组件向量灌库"
  else
    echo ">>> 向量库为空，执行组件向量灌库..."
    $TSX scripts/seed-component-embeddings.ts
  fi
else
  echo ">>> 未配置 EMBEDDING_MODEL_API_KEY，跳过组件向量灌库（可在「设置」页配置后重建索引）"
fi

echo ">>> 初始化完成"
