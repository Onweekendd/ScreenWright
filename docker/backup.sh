#!/usr/bin/env bash
# 在部署目录运行；仅备份数据库，不修改正在运行的服务。
set -euo pipefail
umask 077
cd "${DEPLOY_DIR:-$PWD}"
test -f .env
backup_dir="${BACKUP_DIR:-$PWD/backups/$(date -u +%Y%m%dT%H%M%SZ)}"
mkdir -p "$backup_dir"
chmod 700 "$backup_dir"
partial="$backup_dir/database.dump.part"
trap 'rm -f -- "$partial"' EXIT
docker compose exec -T postgres pg_dump -U funbi -d funbi --format=custom > "$partial"
test -s "$partial"
mv -- "$partial" "$backup_dir/database.dump"
cp -- .env "$backup_dir/environment"
cp -- docker-compose.yml "$backup_dir/docker-compose.yml"
echo "数据库与配置备份已保存：$backup_dir"
