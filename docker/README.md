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
