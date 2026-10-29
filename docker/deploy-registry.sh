#!/usr/bin/env bash
# 从已上传到 releases/<tag>/ 的目录执行；工作目录为实际部署目录。
# bash releases/<tag>/deploy-registry.sh <owner/repo> <tag> [registry-user]
# 指定 registry-user 时从 stdin 读取本次 GitHub Token，退出后删除临时登录凭据。
set -Eeuo pipefail
umask 077
release_dir="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
cd "${DEPLOY_DIR:-$PWD}"
namespace="${1:?缺少镜像命名空间 owner/repo}"
tag="${2:?缺少镜像 tag}"
registry_user="${3:-}"
[[ "$namespace" =~ ^[a-z0-9][a-z0-9._-]*/[a-z0-9][a-z0-9._-]*$ ]]
[[ "$tag" =~ ^sha-[a-f0-9]{40}$ ]]
test -f .env
test -f docker-compose.yml
test -f "$release_dir/docker-compose.yml"
exec 9>.deploy.lock
flock -n 9 || { echo '已有部署在进行' >&2; exit 1; }

auth_dir=''
cleanup() {
  if [[ -n "$auth_dir" ]]; then rm -rf -- "$auth_dir"; fi
}
trap cleanup EXIT
if [[ -n "$registry_user" ]]; then
  IFS= read -r registry_token
  test -n "$registry_token"
  auth_dir="$(mktemp -d "$PWD/.docker-auth.XXXXXX")"
  export DOCKER_CONFIG="$auth_dir"
  printf '%s' "$registry_token" | docker login ghcr.io --username "$registry_user" --password-stdin
  unset registry_token
fi

server_image="ghcr.io/$namespace/server"
web_image="ghcr.io/$namespace/web"
# 只拉两个应用镜像；PostgreSQL、Redis、MinIO 沿用已安装的版本。
docker pull "$server_image:$tag"
docker pull "$web_image:$tag"

backup_dir="$PWD/backups/$(date -u +%Y%m%dT%H%M%SZ)-$tag"
BACKUP_DIR="$backup_dir" bash "$release_dir/backup.sh"
app_changed=false
config_changed=false
on_failure() {
  local result=$?
  trap - ERR
  echo "部署失败；数据库备份：$backup_dir/database.dump" >&2
  if "$config_changed"; then
    cp -- "$backup_dir/environment" .env
    cp -- "$backup_dir/docker-compose.yml" docker-compose.yml
    unset TAG SERVER_IMAGE WEB_IMAGE
  fi
  if "$app_changed"; then
    echo '恢复上一版本应用镜像（保留当前数据库）' >&2
    if docker compose up --no-build --pull never --no-deps --force-recreate --wait --wait-timeout 300 api ai worker \
      && docker compose up --no-build --pull never --no-deps --force-recreate --wait --wait-timeout 60 web; then
      echo '上一版本应用已恢复' >&2
    else
      echo '应用回退未通过健康检查，请在服务器查看日志' >&2
    fi
  fi
  echo '数据库不自动回滚；若迁移不兼容，需要人工使用备份恢复。' >&2
  exit "$result"
}
trap on_failure ERR

config_changed=true
cp -- "$release_dir/docker-compose.yml" docker-compose.yml
export TAG="$tag" SERVER_IMAGE="$server_image" WEB_IMAGE="$web_image"
docker compose config --quiet
# 迁移失败时不重启旧应用；本轮只运行迁移，不依赖历史 migrate 容器的完成状态。
docker compose run --rm --no-deps migrate
app_changed=true
docker compose up --no-build --pull never --no-deps --wait --wait-timeout 300 api ai worker
# nginx 在启动时解析 upstream；重建 web，确保拿到 api / ai 当前的容器地址。
docker compose up --no-build --pull never --no-deps --force-recreate --wait --wait-timeout 60 web
port="$(docker compose port web 80 | head -n 1 | awk -F: '{print $NF}')"
[[ "$port" =~ ^[0-9]+$ ]]
curl -fsS --retry 10 --retry-delay 2 --retry-connrefused --max-time 5 "http://127.0.0.1:$port/healthz" >/dev/null
curl -fsS --max-time 10 "http://127.0.0.1:$port/" >/dev/null

set_env() {
  local key="$1" value="$2"
  awk -v key="$key" -v value="$value" '
    $0 ~ ("^" key "=") { if (!found) print key "=" value; found=1; next }
    { print }
    END { if (!found) print key "=" value }
  ' .env > .env.next
  chmod 600 .env.next
  mv -- .env.next .env
}
set_env SERVER_IMAGE "$server_image"
set_env WEB_IMAGE "$web_image"
set_env TAG "$tag"
docker compose ps
echo "发布成功：$tag"

# 发布已成功，清理失败不应触发回退。
trap - ERR
# 应用镜像保留当前与上一版（失败回退依赖上一版）；仍被容器引用的镜像删除失败时跳过。
for image in "$server_image" "$web_image"; do
  docker image ls "$image" --format '{{.Repository}}:{{.Tag}}' | tail -n +3 | xargs -r docker image rm >/dev/null 2>&1 || true
done
# 目录名以 UTC 时间开头，字典序即时间序；保留最近 10 份数据库备份。
ls -1d backups/*/ 2>/dev/null | head -n -10 | xargs -r rm -rf -- || true
ls -1dt releases/sha-*/ 2>/dev/null | tail -n +6 | xargs -r rm -rf -- || true
