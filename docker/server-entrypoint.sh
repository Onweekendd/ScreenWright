#!/bin/sh
set -e

# ai 角色（或 all）：把镜像里的 agent-workspace 模板（skills 等静态文件）同步进持久化的工作区卷。
# 每次启动都覆盖模板文件，所以升级镜像后 skills 会跟着更新；运行时生成的 screen_* 等目录不受影响。
case "${ROLE:-all}" in
  ai|all)
    if [ -n "$WORKSPACE_SEED_DIR" ] && [ -n "$MASTRA_WORKSPACE_PATH" ] \
       && [ "$WORKSPACE_SEED_DIR" != "$MASTRA_WORKSPACE_PATH" ]; then
      mkdir -p "$MASTRA_WORKSPACE_PATH"
      cp -a "$WORKSPACE_SEED_DIR"/. "$MASTRA_WORKSPACE_PATH"/
    fi
    ;;
esac

exec "$@"
