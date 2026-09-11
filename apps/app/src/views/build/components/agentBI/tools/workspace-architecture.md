# 低代码大屏 Agent 架构设计文档

> **版本**：v1.0 | **状态**：设计阶段

---

## 一、背景与问题

当前 AgentBI 已实现 20 个 ClientTool（事件、行为、条件的增删改查等）。随着功能增加，面临两个核心问题：

1. **工具爆炸**：每新增一种组件能力就需要新增工具，难以维护
2. **上下文过载**：Agent 需要理解大量工具定义，且查询时需要读取大量数据

本方案通过将组件数据文件化到 Mastra Workspace，将 20 个工具收敛为 4 个通用 Skill，并引入 Sandbox 验证机制，形成"生成 → 验证 → 应用"闭环。

---

## 二、架构概述

采用 **"前端作为中枢（Frontend-as-a-Hub）"** 模式，三层各司其职：

```
Java 后端（冷存储）
  └─ 仅在用户点击"保存"时接收最终 Schema
  └─ 负责版本管理与权限控制
         ↕ save / load
前端编辑器（真相来源 Source of Truth）
  └─ 持有当前页面的完整实时状态
  └─ 将 UI 操作转化为增量 patch 同步到 Workspace
  └─ 监听 Agent 修改并局部重渲画布
         ↕ 双向同步（updatedTime 对账）
Mastra Workspace（AI 大脑 + 执行沙箱）
  └─ LocalFilesystem：将组件 Schema 文件化存储
  └─ LocalSandbox：执行 JS 验证脚本
  └─ BM25/vector：跨大屏语义搜索
```

---

## 三、Workspace 文件结构

### 目录设计

```
workspace/
├── meta/                           # 全局领域知识（所有大屏共享）
│   ├── event-schemas.json          # 合法事件类型及其 JSON 结构模板
│   ├── action-schemas.json         # 合法行为类型及其结构
│   └── condition-schemas.json      # 合法条件类型及其结构
│
└── screen_{id}_{versionCode}/      # 大屏+版本隔离（版本变更时自动新建目录，旧目录保留）
    ├── _meta.json                  # 同步锚点 { updatedTime }
    ├── meta.json                   # 大屏基本信息（name、宽高等）
    ├── config.json                 # 大屏配置信息
    ├── dataFilter.json             # 数据过滤器信息
    ├── aniFrameSet.json            # 动画帧信息
    ├── statusAnimation.json        # 状态动画信息
    └── component/
        ├── 123.json                # 叶子组件
        ├── 456.json                # 分组组件自身（与 456/ 并列）
        ├── 456/                    # 分组组件的子组件目录
        │   └── 789.json
        ├── 111.json                # 动态面板自身（与 111/ 并列）
        └── 111/                    # 动态面板状态目录（S 前缀区分状态与子组件）
            ├── S111/
            │   └── {子组件id}.json
            └── S222/
                └── {子组件id}.json
```

### 设计说明

| 文件 | 说明 |
|------|------|
| `meta/` | 取代 `listAvailableEvents`、`listAvailableActions` 等查询类工具。Agent 读文件即可获取所有合法结构，无需专门工具 |
| `_meta.json` | 记录最后一次同步的 `updatedTime`，作为一致性对账的唯一锚点。打开大屏时与 Java 后端对比，一致则跳过全量推送 |
| `meta.json` / `config.json` 等 | 大屏级非组件数据，独立文件存储，Agent 按需读取 |
| `component/{id}.json` | 存储该组件**完整 schema**，包含位置、尺寸、样式、事件、数据源等所有字段 |
| `component/{id}/` | 与 `{id}.json` **并列**存在，表示该组件有子组件。Agent 通过是否存在同名文件夹判断父/叶子节点 |
| `component/{id}/S{stateId}/` | 动态面板的状态子目录，`S` 前缀与普通分组子组件目录不冲突 |

---

## 四、数据同步协议

### 4.1 初始化：按需同步

打开大屏时，**先检查再决定是否全量推送**，避免重复同步：

```
① 检查 workspace/screen_{id}/_meta.json 是否存在
         ↓ 不存在
   全量推送所有组件 → 写入 _meta.json
         ↓ 存在
② 对比 _meta.json.updatedTime 与 Java 后端的 updatedTime
   （复用 useCacheData.ts 中已有的 getScreenMeta）
         ↓ 一致 → 跳过同步，直接使用 workspace 现有数据
         ↓ 不一致 → 全量推送并更新 _meta.json
```

### 4.2 增量同步（前端 → Workspace）

`useCacheData.ts` 的 API 拦截器捕获组件变更事件，**只同步被修改的单个组件**：

```
API interceptor 捕获 layers/update（获得 comp_id）
      ↓
从 allComponentMap 读取该组件最新完整 JSON
      ↓
debounce 500ms（合并同批次多个组件的更新）
      ↓
只写 workspace/screen_{id}/comp_{id}.json（单文件整体覆盖）
同步更新 _meta.json.updatedTime
```

> **说明**：前端 API 拦截器只能获取到组件 ID，无法感知字段级别的变更细节，因此统一做整组件 JSON 覆盖。

### 4.3 反向通知（Workspace → 前端）

Agent 修改文件后，通过现有 SSE stream 的 `annotation` 字段传递 diff，前端局部更新 Store 并触发对应组件重渲。

### 4.4 一致性保证

`_meta.json` 中的 `updatedTime` 是唯一的一致性锚点：

- 每次写文件成功时更新 `updatedTime`
- 打开大屏时与 Java 后端的 `updatedTime` 比对
- 前端与 Node 之间是内网通信，无需引入 seq 序列号或 Merkle Tree

---

## 五、Agent 能力集：4 个通用 Skill

### `read_component` — 读取组件数据

```typescript
read_component({
  componentId: 123,
  fields?: ["events"]   // 可选裁剪，只返回指定字段
})
// fields 支持：["events"] | ["style"] | ["data"] | ["position"] | []（全量）
```

- 底层：workspace `read_file` + 字段过滤
- Agent 按需裁剪字段，避免读取过多无关数据（如只需查事件时不加载样式）

---

### `patch_component` — 手术式修改（JSON Patch RFC 6902）

```typescript
patch_component({
  componentId: 123,
  patches: [
    { op: "replace", path: "/events/1/actions/2/config/color", value: "#FF0000" },
    { op: "add",     path: "/events/-", value: { type: "click", actions: [] } }
  ]
})
```

执行流程：
```
readFile(comp_{id}.json)
      ↓
apply JSON Patch operations
      ↓
JSON Schema 静态校验（Zod / Ajv）
      ↓ 校验失败 → 返回描述性错误，Agent 自愈后重试
      ↓ 校验通过
writeFile(comp_{id}.json)
      ↓
SSE annotation 推送 diff 给前端
```

- Agent 只传**路径 + 操作**，不需要传全量 JSON
- 支持所有字段的修改（位置、样式、事件、数据源等）

---

### `search_components` — 跨全大屏语义搜索

```typescript
search_components("控制图表显隐的事件")
// → 返回匹配组件列表 + 文件路径 + 相关度分数
```

- 底层：Mastra workspace 内置 `search`（BM25 / vector / hybrid）
- 全量组件同步后可覆盖整个大屏，Agent 无需逐一遍历

---

### `execute_logic` — JS 逻辑沙箱执行

```typescript
execute_logic({
  script: "return ctx.value > 100 ? 'show' : 'hide'",
  context: { value: 150 }
})
// 返回：{ result: "show" } 或 { error: "ReferenceError: ...", stack: "..." }
```

- 使用 `isolated-vm` 在隔离环境中执行 Agent 生成的条件表达式或逻辑代码
- 执行失败时：捕获 Stack Trace → 作为负反馈返回 Agent → Agent 修正后重试
- 只有通过验证的逻辑才进入 `patch_component`，不向前端下发错误代码

---

## 六、Agent 定位流程

当用户未明确指定目标时，Agent 分三步定位：

```
用户："帮我改那个控制图表显隐的行为"
         ↓
① search_components("控制图表显隐")
  → 找到最匹配的组件 ID（如 comp_456）

② read_component(456, fields: ["events"])
  → 只拿 events 结构，不加载样式/布局等无关字段
  → LLM 推理找到 events[1].actions[2] 最符合描述

③ patch_component({ componentId: 456, patches: [...] })
  → JSON Schema 校验 → 写文件 → SSE 通知前端
```

---

## 七、三道安全防线（Guardrails）

### 第一道：静态 JSON Schema 校验
`patch_component` 执行后、落盘前，用 Zod / Ajv 对 patch 结果进行格式校验。格式错误直接拦截，返回描述性错误供 Agent 自愈。

### 第二道：动态沙箱验证（isolated-vm）
复杂 JS 表达式通过 `execute_logic` 在 `isolated-vm` 中试运行。抛错则捕获 Stack Trace 反馈给 Agent，不向前端下发错误代码。

### 第三道：UI 局部锁定
Agent 正在修改某组件时，前端将该组件的属性面板置为锁定状态，禁止用户此时在右侧面板修改，防止人机操作冲突。Agent 操作完成后自动解锁。

---

## 八、与现有架构的对比

| 维度 | 现有 ClientTools | 新 Workspace 方案 |
|------|----------------|-----------------|
| 工具数量 | 20 个（持续增长） | 4 个通用 Skill |
| 操作粒度 | 每个 API 一个工具 | JSON Patch 路径操作 |
| Agent 数据量 | 每次工具调用返回定制数据 | 文件级读取 + 字段裁剪 |
| 跨组件搜索 | 不支持 | BM25/vector 全大屏搜索 |
| 修改验证 | 无 | JSON Schema 校验 + isolated-vm |
| 领域知识位置 | 硬编码在每个工具里 | `meta/` 目录 JSON 文件（可维护、可版本管理） |
| 扩展成本 | 新增组件能力 = 新增工具 | 新增组件能力 = 更新 meta/ 文件 |

> **关键结论**：20 个 ClientTool 的唯一不可替代价值是内嵌的领域知识（合法事件/行为/条件类型及结构）。将其提取到 `meta/` 目录后，工具层彻底退场。

---

## 九、实施路径

### Phase 1：PoC 验证
- [ ] `sw-agent.ts` 接入 Mastra `Workspace`（LocalFilesystem + LocalSandbox + BM25 search）
- [ ] 生成 `workspace/meta/` 目录（event-schemas.json、action-schemas.json、condition-schemas.json）
- [ ] 前端实现初始化检查逻辑：检查 `_meta.json` → 对比 `updatedTime` → 决定是否全量推送
- [ ] 前端实现全量推送：将所有组件 schema 按层级写入 `workspace/screen_{id}/`
- [ ] **验证**：Agent 能通过 workspace `read_file` 读取 `comp_xxx.json`

### Phase 2：4 个 Skill 实现
- [ ] 实现 `read_component`（workspace read_file + 字段裁剪）
- [ ] 实现 `patch_component`（JSON Patch RFC 6902 + Zod/Ajv 校验）
- [ ] 实现 `search_components`（BM25 语义搜索）
- [ ] 实现 `execute_logic`（isolated-vm JS 沙箱 + Stack Trace 负反馈）
- [ ] **验证**：patch → 校验 → SSE diff 通知前端完整闭环

### Phase 3：前端增量同步 + UI 锁定
- [ ] 在 `useCacheData.ts` 拦截器中接入增量同步：`layers/update` 触发写单个 `comp_{id}.json`
- [ ] 实现 SSE `annotation` 接收处理：Agent 机改后局部更新 Store 并重渲组件
- [ ] 实现 UI 局部锁定：Agent 操作期间锁定属性面板，完成后自动解锁

### Phase 4：20 个 ClientTool 完全下线
- [ ] 将 20 个 ClientTool 内嵌的领域知识提取到 `meta/` 目录
- [ ] 验证 Agent 能通过读取 `meta/` 正确构造所有类型的 patch
- [ ] 删除所有 ClientTool，完成架构替换

---

## 十、关键文件索引

| 角色 | 路径 |
|------|------|
| Mastra 主配置（添加 Workspace） | `servers/server/src/mastra/index.ts` |
| BI Agent（接入 workspace） | `servers/server/src/mastra/agents/sw-agent.ts` |
| bi-chat 端点 | `servers/server/src/mastra/servers/bi-chat.server.ts` |
| 前端缓存与同步（增量 sync 入口） | `apps/app/src/views/build/useCacheData.ts` |
| 前端工具注册（Phase 4 下线） | `apps/app/src/views/build/components/agentBI/tools/index.ts` |
| 系统上下文（增加 workspace 初始化触发） | `apps/app/src/views/build/components/agentBI/useAgentBISystemContext.ts` |
