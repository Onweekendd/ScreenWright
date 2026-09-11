# ScreenWright

**AI 原生的数据大屏 / BI 可视化编辑器。** 用自然语言、设计稿或一张截图，让 Agent 帮你把大屏搭出来、连上数据、配好联动——而不只是"生成一段配置让你自己粘"。

Agent 直接操作画布：创建组件、修改属性、配置事件、接入数据、分组排版、验证数据链路，每一步实时同步到编辑器，改动前可审批，改完可回溯。

> Monorepo：`apps/app`（Vue 3 编辑器）+ `servers/server`（Hono + Mastra Agent 服务）+ `packages/*`（框架无关的核心与物料）+ `apps/desktop`（Tauri 桌面端）。

---

## ✨ Agent 能做什么

### 1. 说一句话，搭一块大屏

- **需求 → 大屏**（`requirement-to-bi` workflow）：输入业务需求，Agent 做语义分区、挑物料、生成组件 Schema、排版落地。
- **Figma → 大屏**（`figma-to-bi` workflow + Figma MCP）：读取 Figma 设计稿节点，语义布局 Agent 识别一级区域与功能分组，映射为可编辑组件。
- **图片 → 大屏**（`codia-to-bi` workflow + Vision Agent）：一张截图也能还原成可编辑大屏。
- **模板范式沉淀**：模板提取 Agent 把真实大屏去实例化为可复用布局模板，向量化后供后续任务检索复用。

### 2. 多 Agent 协作，而非一个大 Prompt

| Agent | 职责 |
|---|---|
| **BI-Agent**（主 Agent） | 规划与执行大脑：小任务直接写，大任务拆 Task 并发委派 |
| **BI 执行 Agent** | 施工入口：创建/编辑/复制/删除组件、配置事件与过滤器，按需深读 Skill references |
| **数据流验证 Agent** | 配置完成后校验过滤器 / 回调参数 / 事件链路，返回逐项通过/失败的结构化报告 |
| **语义布局 Agent** | 识别大屏一级区域与内部功能分组 |
| **Vision Agent** | 图片理解与识别 |
| **模板提取 Agent** | 从真实大屏抽取可复用布局范式 |
| **Playwright 截图 Agent** | 驱动浏览器截图，用于视觉自检 |
| **Title / Compaction Agent** | 会话标题生成、长上下文压缩 |

主 Agent 通过 **Task V2 任务系统**建立施工单，一轮可并行派发多个执行 Agent 处理互不重叠的任务组；子 Agent 失败后主 Agent 接力补救，而不是"假装完成"。

### 3. 三种工作模式

- **Plan**：只读 + 规划，写工具被系统级剥离，产出计划待确认。
- **Ask before edit**：每次改动前弹审批，默认模式。
- **Auto edit**：放手让它干。

### 4. 40+ 领域工具，覆盖大屏编辑全链路

```
组件    create_component / copy_component / move_component / group_component / ungroup_component / add_panel_state
文件    read_file / edit_files / delete_file（每次编辑逐项同步到前端画布）
数据    configureComponentData / createDataFilterTool / configureCallbackArgs
联动    createEventTemplate / createConditionTemplate / createActionTemplate / listAvailableEvents / listAvailableActions
图表    createEchartOption（专用物料不满足时兜底手写 option，tsc 自校验）
自检    simulateEvent（数据流干跑）/ 委派数据流验证 Agent / Playwright 截图
模板    save_ai_template / apply_ai_template
交互    ask_user_question / todoWrite / enterPlanMode / submitPlan
```

工具分「常驻」与「动态注入」两层：高频工具落在稳定前缀里吃 prompt cache，低频工具经 `ToolSearchProcessor` 按语境召回——这套划分基于 100+ 条 eval 线程的命中统计，而非拍脑袋。

### 5. Skills 体系：领域知识按需加载

`servers/server/agent-workspace/skills/` 下维护组件 Schema、数据流、事件交互、Vue 片段、模板构建等 Skill。Agent 先读 `SKILL.md` 概览做规划，执行时再 `skill_read` 深入 references，避免把整个知识库塞进上下文。

### 6. Artifact App：从"配大屏"到"写应用"

内置 **Pi coding agent** 子系统：在隔离沙箱里创建 Vue 3 + Vite + Tailwind 项目，Agent 编写代码、启动 Vite 开发服务器、通过代理提供实时预览。主 Agent 可通过 `delegate-app-code` 把前端编码任务委派给它。配套 `create-screenwright-app` 脚手架。

### 7. 工程化：可观测、可评测、可热切换

- **模型热切换**：在「设置」页配置模型（OpenAI 兼容端点），每次运行重新解析，无需重启。
- **记忆与 RAG**：Mastra Memory 持久化会话线程；组件库向量化，Agent 语义检索物料。
- **多会话 Tab**：同一大屏内多个对话并行流式输出，画布写入全局串行，审批弹窗按 Tab 隔离。
- **Eval harness**：`servers/server/evals/` 内置用例、fixtures 与运行器，Prompt / 工具改动可回归。
- **Agent Trace**：`apps/agent-trace` 独立追踪台，回看每一轮实际发给模型的请求与原始响应。
- **上下文治理**：Token 限制、图片消息清洗、工具参数消毒、长对话自动压缩。

---

## 🧩 编辑器本身

- **76+ 物料组件**：图表（ECharts）、文本、指标、媒体、交互、设备、展示、扩展，以及 ECharts GL 3D 地图 / 飞线 / 路径 / 点位编辑器。
- **事件与数据联动**：可视化配置事件 → 条件 → 行为，数据过滤器与回调参数，跨组件下钻。
- **动态面板 / 分组 / 布局约束**，WASM 实现的对齐辅助线（R-tree 空间索引）。
- **地图数据在线获取**（阿里 DataV），支持省市区自动下钻。
- **导出静态包**：一键导出可脱离编辑器运行的 HTML 大屏。
- **Figma 规范助手插件**（`packages/figma-helper`）。
- **桌面端**：Tauri 2 打包，内置 Node sidecar，SQLite 单机运行，免登录。

---

## 🏗 架构

```
┌────────────────────────────────────────────────────────────────┐
│  apps/app  ── Vue 3 编辑器（画布 / 物料 / AgentBI 对话面板）      │
│      ▲ SSE 流式 + 实时画布同步                                    │
│      │                                                          │
│  servers/server ── Hono + Mastra                                 │
│    ├─ agents/     主 Agent · 执行 Agent · 验证 Agent · Vision …   │
│    ├─ tools/      40+ 大屏领域工具                                │
│    ├─ workflows/  requirement-to-bi · figma-to-bi · codia-to-bi  │
│    ├─ mcp/        Figma · Playwright                             │
│    ├─ processors/ 模式守卫 · 工具检索 · 参数消毒                   │
│    └─ artifact-app/  Pi coding agent 沙箱 + 预览代理              │
│                                                                  │
│  packages/core        框架无关的编辑器核心逻辑                     │
│  packages/composables Vue 适配层                                  │
│  packages/material    物料组件                                    │
│  packages/types       类型系统 + Zod Schema                       │
└────────────────────────────────────────────────────────────────┘
```

| 目录 | 说明 |
|---|---|
| `apps/app` | 主编辑器（Vue 3 + Vite + Element Plus + ECharts + Three.js） |
| `apps/desktop` | Tauri 2 桌面壳 |
| `apps/agent-trace` | Agent 请求/响应追踪台（Next.js） |
| `apps/artifact-app-template` | Artifact App 项目模板 |
| `servers/server` | Agent 服务（Hono + Mastra + Prisma/SQLite + libsql） |
| `servers/mock-server` | 带 Swagger 的 Mock API |
| `servers/asset-server` | 静态资源服务 |
| `packages/core` | 编辑器核心（不依赖任何 UI 框架） |
| `packages/composables` | core 的 Vue composable 封装 |
| `packages/material` | 物料组件包 |
| `packages/types` | 类型与 Zod Schema |
| `packages/ui` | UI 组件库 |
| `packages/alignment-wasm` | Rust/WASM 对齐辅助线 |
| `packages/figma-helper` | Figma 插件 |
| `packages/create-app` | `create-screenwright-app` 脚手架 |

---

## 🚀 快速开始

**环境要求**：Node ≥ 22.13，pnpm 10（`corepack enable` 即可）。

```bash
git clone https://github.com/Onweekendd/ScreenWright.git
cd ScreenWright
pnpm install
```

### 1. 配置 Agent 服务

```bash
cp servers/server/.env.example servers/server/.env
```

按角色填模型配置：`REASONING_MODEL_*`（推理）、`VISION_MODEL_*`（视觉）、`EMBEDDING_MODEL_*`（嵌入），均按 OpenAI 兼容端点处理；也可以全部留空，启动后在「设置」页填。其余保持默认即走本地 SQLite + 本地文件存储。

初始化数据库：

```bash
pnpm --dir servers/server exec dotenvx run -- prisma migrate deploy   # 建表
pnpm --dir servers/server run seed-modules                            # 组件库
pnpm --dir servers/server run seed-bi-user                            # 默认账号 admin / admin123
pnpm --dir servers/server run seed-embeddings -- --reset              # 组件 RAG 向量（可选）
```

### 2. 启动

```bash
pnpm server:dev   # Agent 服务 → http://localhost:4111
pnpm dev          # 编辑器   → http://localhost:5173
```

打开编辑器，进入任意大屏，右侧 **AgentBI** 面板即可开始对话。

### 3. 桌面端（可选）

```bash
pnpm desktop            # 开发模式（Tauri 拉起前端 + 后端）
pnpm desktop:package    # 构建 sidecar 并打包安装程序
```

详见 [apps/desktop/README.md](apps/desktop/README.md)。

---

## 🛠 常用命令

```bash
pnpm dev                 # 编辑器开发
pnpm server:dev          # Agent 服务开发
pnpm dev:agent-trace     # 追踪台
pnpm build               # 生产构建
pnpm check-types         # 全仓类型检查
pnpm test                # 单元测试
pnpm build:lib           # 构建 SDK（screenwright.umd.js）
```

---

## 🧰 技术栈

**前端** Vue 3.5 · TypeScript · Vite · Pinia · Element Plus · ECharts 5 / ECharts GL · Three.js · Monaco · Tailwind
**Agent** Mastra · Vercel AI SDK · Zod · MCP（Figma / Playwright）· Pi SDK
**服务** Hono · Prisma 7 · SQLite / libsql · MinIO（可选）
**桌面** Tauri 2 · Rust
**工程** pnpm workspace · Turborepo · Vitest · Husky · ESLint / Prettier / Stylelint

---

## 📄 License

[MIT](LICENSE)
