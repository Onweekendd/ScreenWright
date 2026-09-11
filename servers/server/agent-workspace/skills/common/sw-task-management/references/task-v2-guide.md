# Task V2：施工任务与多 Agent 协作指南

Task V2 是 FunBI 的**施工任务账本和委派通信协议**。它用于把工作固化成可查询、可认领、可建立依赖的任务记录，并在主 agent 与执行子 agent 之间传递上下文。

> Task 记录本身不会执行任何工作。创建 task 后，主 agent 仍需调用 `ask_swExecutorAgent` 才会真正派发执行。

---

## 先区分 Task 与 Todo

| 维度 | Task V2 | TodoWrite V1 |
|---|---|---|
| 核心用途 | 委派、认领、依赖和跨 agent 协作 | 主 agent 直接执行时展示进度 |
| 数据形态 | 多条独立 task 记录，按字段增量更新 | 一个完整 todo 数组，每次全量替换 |
| 协作能力 | 有 `taskListId`、`owner`、`blocks/blockedBy`、`metadata` | 无认领、依赖和委派上下文 |
| 并发能力 | 多个 task 可由不同子 agent 并行处理 | 同一列表同时只能有一个 `in_progress` |
| 生命周期 | 保留到显式完成、删除或清空 | 全部完成后自动清空 |
| 是否触发执行 | 否；必须另行委派 | 否；只是进度清单 |

**选择规则：**

- 工作将交给 `ask_swExecutorAgent`：使用 Task V2。
- 需要多个子 agent 并发、认领任务或表达前后依赖：使用 Task V2。
- 主 agent 自己完成多步骤工作，只需向用户展示进度：使用 TodoWrite。
- 不要把同一批施工步骤同时逐条写入 Task 和 Todo，避免出现两套互相冲突的状态。
- 混合流程可以同时使用两者，但粒度必须不同：Todo 跟踪主流程阶段，Task 跟踪实际委派的施工单元。

---

## 何时创建 Task

使用 `create_task` 的典型场景：

1. 即将调用 `ask_swExecutorAgent`，需要先为子 agent 建立施工单。
2. 一个需求可拆成多个互不重叠的施工单元，并计划并发委派。
3. 任务之间存在依赖，需要用 `blockedBy/blocks` 表达执行顺序。
4. 施工上下文不能只放在对话中，需要通过 `metadata` 稳定传给子 agent。
5. PLAN 模式下需要先固化后续施工单元，但此时只建任务，不得委派执行。

以下情况不要创建 Task：

- 主 agent 将直接完成一个小规模修改。
- 只是想展示“分析 → 修改 → 验证”的当前进度；此时使用 TodoWrite。
- 纯问答、解释或只读查询。
- 已存在表达相同施工单元的 task；创建前先用 `list_tasks` 去重。

---

## Task 数据模型

当前任务状态为：

```text
pending → in_progress → completed
               ↓
             failed → in_progress（重试）

pending / failed → cancelled
```

- `pending`：尚未开始。
- `in_progress`：已开始施工，或施工已完成但仍等待校验。
- `completed`：任务及其必要校验均已完成。
- `failed`：本次执行失败，可以使用同一个 task ID 再次认领并重试。
- `cancelled`：任务已明确取消，不能直接重新认领。

删除任务使用独立的 `delete_task`，不存在 `status: "deleted"`。

### 字段

| 字段 | 必填 | 说明 |
|---|---|---|
| `subject` | 是 | 简短祈使句标题 |
| `description` | 是 | 完成标准和必要上下文 |
| `status` | 是 | `pending / in_progress / completed / failed / cancelled` |
| `activeForm` | 否 | 进行时展示文本 |
| `owner` | 否 | 认领该任务的 agent 实例标识；通常由 `claim_task` 设置 |
| `attemptCount` | 否 | 已成功开始执行的次数；每次认领或重试时自动增加 |
| `lastError` | 否 | 最近一次失败原因；重试认领成功时自动清除 |
| `blocks` | 否 | 本任务完成前会阻塞的任务 ID |
| `blockedBy` | 否 | 本任务开始前必须完成的任务 ID |
| `metadata` | 否 | 委派所需的结构化上下文 |

### 委派 metadata

BI Executor 创建类任务：

```json
{
  "task_kind": "create",
  "screenId": "30198-1",
  "user_intent": {
    "kind": "component",
    "category": "image",
    "placement": "root_canvas"
  },
  "skill_ref": "sw-agent-component"
}
```

BI Executor 修改类任务：

```json
{
  "task_kind": "modify",
  "screenId": "screen_42",
  "target_files": ["/workspace/screen_42/component/chart_001.json"],
  "expected_state": ["openFilter 为 true"],
  "context": {
    "current_openFilter": false
  },
  "skill_ref": "sw-data-flow"
}
```

`task_kind="modify"` 时，`target_files`、`expected_state` 和 `context` 必须来自主 agent 实际读取到的当前状态，不能凭空猜测。

Artifact App 编码任务：

```json
{
  "task_kind": "artifact-app-code",
  "appId": "app-001",
  "screenId": "screen_42",
  "resourceId": "screen_42",
  "acceptanceCriteria": ["类型检查通过", "登录页面可以正常渲染"]
}
```

Artifact App 通过 `taskListId + taskId` 查询任务，再校验 `task_kind` 和其余 metadata。`screenId` 表示任务针对的当前大屏，是必填字段；`resourceId` 只用于可选的外部资源关联。任务的具体编码指令使用顶层 `description`，不在 metadata 中重复保存。

> Task 记录持久化为 JSON。`<delegation>...</delegation>` XML 只是 `ask_swExecutorAgent` 的 prompt 委派信封，不是 Task 的存储格式。Artifact App 通过结构化参数接收 `taskListId + taskId`，不需要解析这层 XML。

---

## `create_task`：创建施工单

实际输入是 `taskData` 对象：

```json
{
  "taskData": {
    "subject": "为 chart_001 配置数据过滤器",
    "description": "绑定 filter_dateRange，并将 openFilter 设置为 true",
    "status": "pending",
    "blocks": [],
    "blockedBy": [],
    "metadata": {
      "task_kind": "modify",
      "screenId": "screen_42",
      "target_files": ["/workspace/screen_42/component/chart_001.json"],
      "expected_state": ["listenArgs 包含 filter_dateRange", "openFilter 为 true"],
      "context": {
        "current_listenArgs": [],
        "current_openFilter": false
      },
      "skill_ref": "sw-data-flow"
    }
  }
}
```

返回值：

```json
{
  "id": "7",
  "taskListId": "8e7fea32-e71f-4f13-a689-41d8f5c428f4"
}
```

`taskListId` 是跨 agent 访问任务列表的凭证。委派时必须把返回值原样写入：

```xml
<delegation>
  <task_list_id>8e7fea32-e71f-4f13-a689-41d8f5c428f4</task_list_id>
  <pending_task_ids>
    <id>7</id>
  </pending_task_ids>
  <instruction>逐一认领并执行；完成全部后返回报告</instruction>
</delegation>
```

不要自行生成或猜测 `taskListId`。

---

## `claim_task`：子 agent 认领任务

子 agent 与主 agent 不在同一 thread，因此必须显式传入委派 XML 中的 `taskListId`：

```json
{
  "taskId": "7",
  "agentId": "sw-executor-agent",
  "taskListId": "8e7fea32-e71f-4f13-a689-41d8f5c428f4"
}
```

认领成功会在同一把文件锁内原子写入 `owner`、`status=in_progress`，并增加 `attemptCount`。它不会自动执行任务，因此子 agent 仍要在认领成功后开始实际施工，但不需要再单独更新一次 `in_progress`。

`failed` 任务可以由原 owner 使用同一个 task ID 重新认领；成功后会进入 `in_progress` 并清除旧的 `lastError`。`completed` 和 `cancelled` 是已终结状态，不会被重新认领。

常见失败原因：

| reason | 含义 |
|---|---|
| `task_not_found` | ID 不存在，或传错/漏传 `taskListId` |
| `already_claimed` | 已被其他 agent 实例认领 |
| `already_running` | 任务已经处于 `in_progress`，不能重复启动 |
| `already_resolved` | 任务已经完成或取消 |
| `blocked` | 仍有未完成的 `blockedBy` |
| `agent_busy` | 启用 `checkAgentBusy` 时，当前 agent 还有未完成任务 |

只有本次 `claim_task` 返回 `success: true` 才表示认领成功；不能仅凭 `owner` 文本判断任务属于自己。

---

## `update_task`：增量更新任务

实际输入使用 `updates` 包裹待更新字段：

```json
{
  "taskId": "7",
  "taskListId": "8e7fea32-e71f-4f13-a689-41d8f5c428f4",
  "updates": {
    "status": "in_progress"
  }
}
```

规则：

1. 主 agent 更新自己 thread 下的任务时可以省略 `taskListId`；子 agent 必须传入。
2. `updates` 是字段级部分更新，不需要提交完整 task。
3. `blocks`、`blockedBy` 和 `metadata` 字段本身会被整体替换，不存在 `addBlocks`、`addBlockedBy` 等增量操作。
4. 修改依赖或 metadata 前先 `get_task` 读取当前值，再合并后写回，避免覆盖已有数据。
5. 若同时维护 `A.blocks=[B]` 与 `B.blockedBy=[A]`，两侧需分别更新；系统不会自动补齐反向关系。

只有未经过 `claim_task` 的特殊管理流程才需要手动写入 `in_progress`。正常认领流程不要重复执行这一步：

```json
{
  "taskId": "7",
  "taskListId": "8e7fea32-e71f-4f13-a689-41d8f5c428f4",
  "updates": {
    "status": "in_progress"
  }
}
```

完成施工且无需后续校验：

```json
{
  "taskId": "7",
  "taskListId": "8e7fea32-e71f-4f13-a689-41d8f5c428f4",
  "updates": {
    "status": "completed"
  }
}
```

施工已完成但仍需主 agent 校验：

```json
{
  "taskId": "7",
  "taskListId": "8e7fea32-e71f-4f13-a689-41d8f5c428f4",
  "updates": {
    "status": "in_progress",
    "metadata": {
      "task_kind": "modify",
      "verification_required": {
        "type": "data-flow",
        "screenId": "screen_42",
        "target": "chart_001"
      }
    }
  }
}
```

写回 `metadata` 时必须保留原有 key，上例仅展示关注字段，实际调用前应先读取并合并。

---

## `list_tasks` 与 `get_task`：查询任务

`list_tasks` 用于：

- 创建前检查重复任务。
- 查看整批施工单元的状态和 owner。
- 找出 `pending`、无 owner 且没有未完成前置依赖的任务。
- 子 agent 批量处理后复核是否遗漏。

`get_task` 用于：

- 子 agent 认领后读取完整 `description` 和 `metadata`。
- 更新依赖或 metadata 前获取最新值。
- 主 agent 收到 `<execution_report>` 后复核权威状态。
- 获取 `metadata.verification_required` 并发起后续校验。

子 agent 调用这两个工具时同样必须传入 `taskListId`。

---

## 完成条件

以下任一情况存在时，不得标记 `completed`：

- 施工尚未完成。
- 写工具返回失败。
- 必须的验证失败或尚未执行。
- 仍有未解决错误。
- 实际文件状态与任务 `metadata.context` 不一致，需要重新规划。

遇到阻塞时：

- 尚未开始且受前置任务阻塞时保持 `pending`；已经执行并失败时写入 `failed + lastError`，不要伪造完成。
- 把阻塞原因写入 `description` 或合并进 `metadata`。
- 如需新增前置工作，创建新 task 并建立 `blockedBy`。

---

## 标准委派流程

```text
主 agent 读取现状并拆分施工单元
  → create_task，保存每个 id 和共同的 taskListId
  → 按依赖和并发边界分组 task ID
  → ask_swExecutorAgent，传 taskListId + 分配给该实例的 ID
  → 子 agent claim_task（原子写入 owner + in_progress + attemptCount）
  → 子 agent施工并写回 completed 或 verification_required
  → 主 agent读取 execution_report，并用 get_task/list_tasks 复核
  → 必要时执行校验，校验通过后更新 completed
```

同一个 task ID 只能分配给一个子 agent 实例；并发委派时，各组 ID 必须互不重叠。

---

## 委派字段速查

两类 BI Executor 任务对**主 agent 的研究深度**要求不同，这是委派最容易出错的地方。

### `task_kind="create"`：从零创建

适用：新建组件 / 数据过滤器 / 事件模板 / 行为模板等"无中生有"的施工。

| 字段 | 内容 |
| --- | --- |
| `subject` | 祈使句一句话，如"在大屏根画布创建一个图片组件" |
| `description` | 一句话详述完成标准 |
| `status` | `pending` |
| `metadata.task_kind` | `"create"` |
| `metadata.screenId` | 大屏 ID（从 editor-context 直接取） |
| `metadata.user_intent` | 用户原话约束的结构化提取，如 `{ kind: "component", category: "image", placement: "root_canvas" }`。**不必**填具体 prop 名 / 文件路径——子 agent 会自己定 |
| `metadata.skill_ref` | 适用的 skill 名（如 `sw-agent-component` / `sw-event-interaction`）。填上能减少子 agent 选 skill 的开销；不确定可省略 |

主 agent **不需要** `search_component`、不需要查现有文件、不需要 `skill_read` references——这些都由子 agent 自己做。缺 `target_files` / `expected_state` / `context` **不会**导致 failed。

### `task_kind="modify"`：修改现有

适用：在已有组件 / 文件上做改动，如配置 listenArgs、绑定过滤器、调整 cbArgs、改 props。

| 字段 | 内容 |
| --- | --- |
| `subject` | 祈使句一句话，如"为 cmpA 配置 listenArgs 绑定到过滤器 X" |
| `description` | 一句话详述完成标准 |
| `status` | `pending` |
| `blockedBy` | 依赖的前置任务 ID 数组（如有） |
| `metadata.task_kind` | `"modify"` |
| `metadata.screenId` | 大屏 ID |
| `metadata.target_files` | 目标文件绝对路径数组（**必填**） |
| `metadata.expected_state` | 期望最终状态（每条 = 字段名 + 期望值，**必填**） |
| `metadata.context` | 从 `read_file` 实际读到的当前关键字段值（**必填**，不要凭印象） |
| `metadata.skill_ref` | 适用的 skill 路径，无则省略 |

主 agent **必须**先 `read_file` 把当前关键字段的值读出来——否则子 agent 凭空猜会把现有配置改坏。`target_files` / `expected_state` / `context` 任一缺失，子 agent 直接 failed。

---

## 端到端示例

### 示例 A：从零创建一个图片组件（`task_kind="create"`）

```
# 1. （可选）若不熟悉"创建组件"类任务用哪个 skill，先看概览
skill(name="sw-agent-component")
# 看完 SKILL.md 概览，确认这就是组件创建该走的 skill。不要再 skill_read 进去。

# 2. 创建任务（不搜组件，不深读 references，把具体决定交给子 agent）
create_task({
  taskData: {
    subject: "在大屏根画布创建一个图片组件",
    description: "创建并推送到前端",
    status: "pending",
    metadata: {
      task_kind: "create",
      screenId: "30198-1",
      user_intent: { kind: "component", category: "image", placement: "root_canvas" },
      skill_ref: "sw-agent-component"
    }
  }
})
# 返回 { id: "1", taskListId: "8e7fea32-..." }

# 3. 直接委派（异步，不带 _background）——子 agent 会自己 skill_read 加载 references，自己 search_component
ask_swExecutorAgent({ prompt: "<delegation><task_list_id>8e7fea32-...</task_list_id><pending_task_ids><id>1</id></pending_task_ids><instruction>逐一认领并执行</instruction></delegation>" })
# 返回 "Background task started. Task ID: ..."（占位回执，不是 execution_report）
# → 输出一句"已派发，后台执行中"然后停止。不要再调一次，不要轮询。报告会在后台完成后由续接轮自动送来。
```

### 示例 B：为图表绑定数据过滤器（`task_kind="modify"`）

```
# 1. 你必须先 read_file 拿到 chart_001 当前的 listenArgs / openFilter
read_file("/workspace/screen_42/component/chart_001.json")
# 看到 listenArgs=[]，openFilter=false

# 2. 创建任务，metadata.context 填实际读到的值
create_task({
  taskData: {
    subject: "为 chart_001 配置 listenArgs 绑定到 filter_dateRange",
    description: "把过滤器 filter_dateRange 加到图表 listenArgs，并设置 openFilter=true",
    status: "pending",
    metadata: {
      task_kind: "modify",
      screenId: "screen_42",
      target_files: ["/workspace/screen_42/component/chart_001.json"],
      expected_state: [
        "listenArgs 包含 { id: 'filter_dateRange', usageStatus: true, callbackFields: [] }",
        "openFilter: true"
      ],
      context: {
        current_listenArgs: [],
        current_openFilter: false,
        filter_meta: { id: "filter_dateRange", argName: "date" }
      },
      skill_ref: "sw-data-flow"
    }
  }
})
# 返回 { id: "7", taskListId: "8e7fea32-e71f-4f13-a689-41d8f5c428f4" }

# 3. 委派执行（同步——下一步要立刻拿报告去校验，所以带 _background:{ enabled:false }；
#    task_list_id 必须用上一步返回的 taskListId 原值）
ask_swExecutorAgent({
  prompt: "<delegation><task_list_id>8e7fea32-e71f-4f13-a689-41d8f5c428f4</task_list_id><pending_task_ids><id>7</id></pending_task_ids><instruction>逐一认领并执行</instruction></delegation>",
  _background: { enabled: false }
})
# 同步返回 <execution_report status="done" ...><task id="7" final_status="in_progress">verification_required</task>...</execution_report>

# 4. 触发校验
get_task({ taskId: "7" })  # 读 metadata.verification_required
ask_dataFlowVerificationAgent("校验 screen_42 / argName=date / container=... / target=chart_001")
# 校验通过

# 5. 收尾
update_task({ taskId: "7", updates: { status: "completed" } })
```
