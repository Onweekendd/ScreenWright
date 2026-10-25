#!/usr/bin/env bash
# 在部署目录运行：镜像先用 docker load 导入，本脚本不构建、不拉取镜像。
# 用法：bash ./deploy-prebuilt.sh <tag>
set -euo pipefail
cd "$(dirname "$(readlink -f "$0")")"

tag="${1:?用法：bash ./deploy-prebuilt.sh <tag>}"
if [[ ! "$tag" =~ ^[a-zA-Z0-9_][a-zA-Z0-9_.-]{0,127}$ ]]; then
  echo "无效的镜像 tag" >&2
  exit 1
fi
test -f .env
export TAG="$tag"
docker image inspect "funbi-server:$TAG" "funbi-web:$TAG" >/dev/null
docker compose config --quiet

# depends_on 保证数据库就绪、迁移及建桶成功后才启动应用。
docker compose up --no-build --pull never --wait --wait-timeout 300

# 成功后记住版本；重启服务器或手动执行 compose 时继续使用同一版本。
if grep -q '^TAG=' .env; then
  sed -i "s/^TAG=.*/TAG=$tag/" .env
else
  printf '\nTAG=%s\n' "$tag" >> .env
fi
docker compose ps
echo "部署完成：$tag"
