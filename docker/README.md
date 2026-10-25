# 本机构建、SSH 部署

首次部署不依赖 GitHub Actions 或服务器上的 Node.js。应用在本机构建为 Linux amd64 镜像，服务器只导入镜像并运行 Compose。

在仓库根目录构建，两个镜像使用同一个版本号：

```powershell
$releaseTag = "bootstrap-20261024-01"
docker build --platform linux/amd64 --target server -t "funbi-server:$releaseTag" .
docker build --platform linux/amd64 --target web -t "funbi-web:$releaseTag" .
```

将应用及 Compose 引用的依赖镜像一起导出。依赖镜像必须已存在于本机；当前固定版本的 MinIO 镜像需要保留本机副本，不能假设能从原仓库重新拉取。

```powershell
docker image save -o funbi-release.tar "funbi-server:$releaseTag" "funbi-web:$releaseTag" pgvector/pgvector:pg16 redis:7-alpine minio/minio:RELEASE.2024-11-07T00-52-20Z minio/mc:RELEASE.2024-11-17T19-35-25Z
scp funbi-release.tar docker-compose.yml docker/deploy-prebuilt.sh <user>@<host>:<deploy-dir>/
```

大包可先完整压缩为 `.tar.xz` 再上传，`docker load` 能直接读取。传输完成后核对本机与服务器的 SHA-256；续传前先确认旧上传进程已退出。Windows 开启 TUN 代理时，如果上传很慢，可给 SSH/SFTP 设置 `BindAddress=<实际网卡的 IPv4 地址>` 测试直连。

首次在部署目录创建 `.env`，字段参考仓库的 `.env.compose.example`。数据库、JWT、MinIO 和管理员分别使用独立随机口令。`HTTP_PORT` 选择空闲端口，`PUBLIC_ORIGIN` 填浏览器访问站点的完整地址。不要覆盖已有实例的 `.env`。

在服务器的部署目录运行：

```bash
docker load -i funbi-release.tar
bash ./deploy-prebuilt.sh bootstrap-20261024-01
```

部署脚本禁止构建和拉取镜像，等待迁移、建桶和服务健康检查通过后保存版本号。数据库、素材和 AI 工作区使用命名卷，升级保留这些卷。后续升级前需备份数据；脚本不执行数据库回滚。

当前实例使用 `/root/funbi` 和端口 `8081`。可用以下命令查看状态与日志：

```bash
cd /root/funbi
docker compose ps
docker compose logs --tail 100 api ai worker
```

首次登录后，在「设置」页配置模型。镜像不携带本机 `.env`、数据库或大屏工作区数据；本地 MCP 服务需要另外配置服务器可访问的地址。

### 联网图片 / 视频素材搜索 MCP

素材 MCP 由 `ai` 容器按需连接，使用 Streamable HTTP 和 Bearer Token。将以下两项写入服务器 `/root/funbi/.env`：

```dotenv
MEDIA_ASSETS_MCP_URL=http://<服务器可访问的MCP主机>:8766/mcp
MEDIA_ASSETS_MCP_TOKEN=<该MCP服务签发的Token>
```

编辑 `.env` 时不要把 Token 粘贴到聊天或命令行参数中；保存后确认文件权限为 `600`。之后只重建 AI 容器以载入环境变量：

```bash
cd /root/funbi
chmod 600 .env
docker compose up -d --no-deps --force-recreate ai
docker compose logs --tail 50 ai
```

`127.0.0.1` 指向当前容器自身。若 MCP 仍只运行在你的 Windows 电脑上，云服务器无法访问电脑的 `127.0.0.1:8766`；请将 MCP 服务部署到服务器可达的主机 / 私有网络，并确保 AI 容器能访问该地址。不要为了连接而将带 Token 的 MCP 端口直接公开到公网。

# GitHub CI/CD

| 操作 | 工作流行为 |
| --- | --- |
| 创建或更新 PR | 检查数据库迁移、类型、测试、两个 Linux 镜像构建及 server 运行工具；不发布镜像 |
| 合并或推送到 main | 检查通过后，将 server / web 镜像推送到 GHCR，再自动备份、迁移并更新服务器 |
| 手动运行 Release，deploy 不勾选 | 检查并发布镜像 |
| 手动运行 Release，选择 main 并勾选 deploy | 检查、发布镜像、备份数据库、迁移并更新服务器 |

镜像地址为 `ghcr.io/<owner>/<repo>/server:sha-<完整提交SHA>` 和 `ghcr.io/<owner>/<repo>/web:sha-<完整提交SHA>`，owner / repo 自动转为小写。api、ai、worker、migrate 继续使用同一个 server 镜像。

仓库 Actions Secrets 需要以下四项；当前 ScreenWright 仓库已配置：

| Secret | 内容 |
| --- | --- |
| DEPLOY_HOST | 服务器地址 |
| DEPLOY_USER | SSH 用户名 |
| DEPLOY_SSH_KEY | CI 专用私钥 |
| DEPLOY_HOST_FINGERPRINT | 服务器 ECDSA 主机公钥的 SHA-256 指纹 |

生产环境 `production` 只允许 main 发布。GitHub Actions 在临时 runner 上核对主机指纹，然后上传这次提交的部署文件到 `/root/funbi/releases/<tag>/`。GHCR 使用本次运行的 `GITHUB_TOKEN`；服务器只临时登录，脚本退出时删除登录文件，不需要另存长期镜像仓库 Token。

`deploy-registry.sh` 只拉取 server / web 镜像，使用服务器已有的 PostgreSQL、Redis 和 MinIO。更新前在 `backups/<时间>-<tag>/` 保存 PostgreSQL 自定义格式备份、原 `.env` 和 Compose 文件。迁移失败时保持旧应用；应用或 HTTP 健康检查失败时恢复原配置并重建旧版应用。**数据库不会自动回滚**，不兼容的迁移需要根据备份人工恢复。MinIO 数据和 AI 工作区继续保留在原命名卷。

将工作流合并到 main 后，本次合并以及后续 main 更新都会自动执行检查、发布镜像并部署。检查或任一镜像发布失败时，部署不会开始。同一分支的发布串行执行，避免并发更新服务器。

需要手动重发时，打开 GitHub **Actions → Release → Run workflow**，选择 main，勾选 deploy 后运行。不勾选时仅检查并发布镜像。

手动备份可以在服务器部署目录运行对应版本中的脚本：

```bash
cd /root/funbi
bash releases/<tag>/backup.sh
```

工作流语法和 Shell 脚本可用 actionlint / ShellCheck 检查。部署成功、备份失败、迁移失败和健康检查回退测试执行：

```bash
node --test docker/tests/deploy-registry.test.mjs
```
