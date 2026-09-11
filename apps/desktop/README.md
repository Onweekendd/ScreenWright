# @screenwright/desktop

Screenwright 的桌面端外壳，基于 [Tauri 2](https://tauri.app)。

> 打包机制（前端怎么嵌进二进制、后端 sidecar 怎么组装、运行时怎么拉起）见 [docs/打包原理.md](docs/打包原理.md)。

进度：
- **A 壳** / **B SQLite 存储** / **C 去登录** —— 已完成
- **D 后端进程托管** —— dev（`pnpm desktop` Tauri spawn funAI）+ 打包（`pnpm desktop:build` → `Screenwright_0.1.0_x64-setup.exe` 264MB）都通了；**装机版实测已进主界面**
- **E 终端交互同机传输** —— 待做

排障：

- `pnpm desktop:build` 报 `os error 32`（file in use）→ 多半是上次卡死的 build 进程树没退（含 `makensis.exe` 挂着锁），
  用 `Get-CimInstance Win32_Process | ? CommandLine -match 'tauri|makensis' | % { Stop-Process $_.ProcessId -Force }` 清掉再跑。
- 装机版启动一直卡在加载视频进不去 → 后端首启预热慢（加载 23MB `mastra.db`、MCP 自连重试），前端守卫在
  `router.beforeEach` 里 `await getRoleEquitiesInfo()` 时被拒 → `router.isReady()` 永不 resolve → `app.mount` 不执行。
  两处修：① `router/permission.ts` 全守卫 try/catch + `withRetry`，失败也 `next()`；
  ② `lib.rs` `wait_backend_ready` 改为轮询 `GET /user/roleEquities/...` 拿到 **HTTP 200** 才算就绪（TCP 通 ≠ 路由挂载好），超时放宽到 120s。
- Windows `resource_dir()` / `app_data_dir()` 带 `\\?\` 扩展长度前缀，`lib.rs` 用 `strip_verbatim()` 剥掉，
  给 node 传原生反斜杠路径（`fwd()` 只用于 `file:` URL）。

## 打包

```bash
node apps/desktop/scripts/build-sidecar.mjs   # 产出 sidecar，~2min
pnpm desktop:build                            # vite prod + cargo release + NSIS/MSI
```

`build-sidecar.mjs` 产出：
- `src-tauri/resources/server/` —— `dist/server.mjs` + **扁平生产 node_modules（~850MB）** + `src/`（prompt/skill 资源，排除 static-server 172MB 字体）+ `generated/` + `prisma/schema.prisma` + `.env`（内置开发 key）+ `data/*.db`（预 seed）
- `src-tauri/binaries/node-<triple>[.exe]` —— Node 运行时（~86MB）

**node_modules 怎么抠**：不用 `pnpm deploy`（不读 lockfile、全量重下、Windows junction 物化成空壳）也不用
`npm install`（这套依赖 ERESOLVE 静默崩）。从 `servers/server/package.json` 出发 BFS 遍历
`deps + optionalDeps + peerDeps` 传递闭包，`realpathSync` 解真实目录，扁平拷贝；同名不同版本嵌到
「父包/node_modules/」下（pnpm 式）。用的就是 dev 装好那份，不重解析。

装机大小：`resources/server` ~906MB + node.exe 86MB + 前端 dist + Tauri exe ≈ 解压 ~1GB，安装包压缩后 ~400MB。
后续可再瘦（去 provider SDK / echarts / 合并版本嵌套）。

> Windows：跑前给仓库目录加 Defender 排除，不然 `cpSync` 850MB 时可能 EBUSY。

## 依赖

- Rust ≥ 1.88（`rustup update stable`）
- **Node 22+ 在系统 PATH 里**（dev 版后端直接调用 `node`）
- 桌面端构建工具链：
  - Windows：Visual Studio C++ Build Tools + WebView2（Win11 自带）
  - macOS：Xcode Command Line Tools
  - Linux：`webkit2gtk`、`libappindicator` 等（见 Tauri 官方 prerequisites）
- 首次从 crates.io 拉取并编译依赖，耗时较长。

## 本地联调（dev）

```bash
# 1. MinIO（素材存储；DB 已是 SQLite，不需要容器）
docker compose up -d minio

# 2. 桌面端 —— 后端由它自己拉起，不用再单独 pnpm server:dev
pnpm desktop
```

`pnpm desktop` 干的事：

1. `beforeDevCommand` → turbo：构 `@screenwright/{server#build:client, server#build:server, types, ui}`
   —— 其中 `build:server` 用 esbuild 把 `src/server.ts` 打成 `servers/server/dist/server.mjs`
2. 起 `apps/app` 的 vite dev（`--mode desktop`，:5173）
3. Rust `setup()`：`spawn node servers/server/dist/server.mjs`（cwd = `servers/server`，
   配置全走该目录的 `.env`），轮询 `127.0.0.1:4111` 就绪后再显示窗口
4. 窗口关闭 → `RunEvent::Exit` → kill 后端子进程

> 如果你另外单独跑了 `pnpm server:dev`（也占 4111），spawn 会失败但 App 会连上你那个外部 server，一样能用。

前端接口地址由 [`apps/app/.env.desktop`](../app/.env.desktop) 提供，统一指向 `http://127.0.0.1:4111`。
后端首启会用 `servers/server/.data/{screenwright.db, mastra.db}`（已 seed 过的库）。

## 打包（build）

```bash
node apps/desktop/scripts/build-sidecar.mjs   # 先组装 sidecar（server.mjs + node_modules + 预置库 + node 运行时）
pnpm desktop:build                            # vite prod + cargo release + NSIS → Screenwright_0.1.0_x64-setup.exe
```

打包版已「双击即用」：前端编进二进制、后端连 Node 运行时打成 sidecar、首启把预置库拷到 `appDataDir`。
完整机制见 [docs/打包原理.md](docs/打包原理.md)。

仍待办：
- MinIO → 本地 FS（`BLOB_STORAGE_DIR` 已有雏形），去掉 docker 依赖
- 升级换库（`ensure_data` 只在库不存在时拷，旧装机版升级拿不到新表）
- `.env` 内置开发 key → 只内部用，别外发
- 真图标：`pnpm --filter @screenwright/desktop exec tauri icon <1024.png>`

## 已知事项

- 授权校验（`views/view/useAuth.ts` 的 license.json）仍在，属敏感信息轮。
- 素材 URL 依赖后端 `MINIO_PUBLIC_ENDPOINT`；图片加载不出来属「MinIO → 本地 FS」范围。
- 终端交互仍走内建 WS 中继；阶段 E 换 `@tauri-apps/api/event`。
- `apps/app/src/api` 下少量接口指向旧 Java 后端（`VITE_API_BASE_URL`），funAI 未实现的会 404，与浏览器端一致。
