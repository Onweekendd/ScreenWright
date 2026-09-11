# TodoWrite V1：主 Agent 进度清单指南

TodoWrite 是 FunBI 主 agent 的**轻量进度展示工具**。它适合主 agent 直接执行多步骤工作时，向用户展示当前步骤、已完成步骤和剩余步骤。

> TodoWrite 只更新清单，不会执行、委派或认领任何任务。

---

## 先区分 Todo 与 Task

| 维度 | TodoWrite V1 | Task V2 |
|---|---|---|
| 核心用途 | 展示主 agent 直接执行工作的进度 | 委派、认领、依赖和跨 agent 协作 |
| 数据形态 | 一个完整数组，每次全量替换 | 多条独立 task，按字段增量更新 |
| 协作能力 | 无 owner、依赖、metadata 或 taskListId | 支持 owner、blocks/blockedBy、metadata、taskListId |
| 并发能力 | 同时只能有一个 `in_progress` | 多个 task 可由不同子 agent 并行处理 |
| 生命周期 | 全部完成后自动清空 | 保留到显式完成、删除或清空 |
| 是否触发执行 | 否 | 否；Task 还需配合委派工具 |

**选择规则：**

- 主 agent 自己完成多步骤工作，需要向用户展示进度：使用 TodoWrite。
- 工作需要交给 `ask_swExecutorAgent`：不要用 Todo 代替 Task，应创建 Task V2。
- 需要认领、依赖、并发或跨 agent 传递上下文：使用 Task V2。
- 不要把同一批施工步骤同时逐条写进 Todo 和 Task。
- 混合流程可以用 Todo 跟踪“规划 → 委派 → 验收”等主流程阶段，用 Task 跟踪被委派的施工单元；不要让两者保持一一镜像。

---

## 何时使用

满足以下条件时使用 TodoWrite：

1. 工作由主 agent 直接执行，而不是交给子 agent。
2. 请求包含至少三个有意义的步骤，或会经历多轮读取、修改和验证。
3. 用户需要看到清晰的当前进度。
4. 执行中发现新的必要步骤，需要把它加入后续清单。

典型场景：

- 主 agent 直接完成跨文件但规模可控的修改。
- 直接配置一个功能，并在修改后运行验证。
- 子 agent 失败后，主 agent 接力处理剩余的多步骤补救工作。
- 主 agent 负责一个包含委派的混合流程，只用 Todo 跟踪高层阶段。

---

## 何时不使用

- 单个简单修改或单次工具调用。
- 纯问答、解释或只读查询。
- 仅为了满足“看起来有计划”而拆出没有独立价值的步骤。
- 即将交给 `ask_swExecutorAgent` 的施工单元；应使用 Task V2。
- 已经用 Task V2 完整跟踪同一粒度的工作；不要维护重复状态。

---

## 输入 Schema

每次调用必须提交**完整列表**：

```typescript
{
  agentId?: string,
  todos: Array<{
    content: string,
    status: "pending" | "in_progress" | "completed",
    activeForm: string
  }>
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `agentId` | 否 | 隔离键；当前主 agent 正常使用时省略，不要把它当作跨 agent 协作机制 |
| `content` | 是 | 简短祈使句，描述完成目标 |
| `status` | 是 | `pending / in_progress / completed` |
| `activeForm` | 是 | 当前执行时的 UI 展示文本 |

示例：

```json
{
  "todos": [
    {
      "content": "Read the current component configuration",
      "status": "in_progress",
      "activeForm": "Reading the current component configuration"
    },
    {
      "content": "Update the filter binding",
      "status": "pending",
      "activeForm": "Updating the filter binding"
    },
    {
      "content": "Verify the updated data flow",
      "status": "pending",
      "activeForm": "Verifying the updated data flow"
    }
  ]
}
```

---

## 核心规则

### 1. 全量替换

TodoWrite 不是增量 API。每次更新都必须带上仍需保留的全部 todo：

```json
{
  "todos": [
    {
      "content": "Read the current component configuration",
      "status": "completed",
      "activeForm": "Reading the current component configuration"
    },
    {
      "content": "Update the filter binding",
      "status": "in_progress",
      "activeForm": "Updating the filter binding"
    },
    {
      "content": "Verify the updated data flow",
      "status": "pending",
      "activeForm": "Verifying the updated data flow"
    }
  ]
}
```

遗漏的条目会从当前清单中消失。

### 2. 同时只能有一个 `in_progress`

Todo 表达的是主 agent 当前正在做什么，因此同一列表中：

- 最多一个 `in_progress`。
- 尚未开始的步骤为 `pending`。
- 已实际完成的步骤为 `completed`。

这是提示词行为约束；输入 Schema 本身不会替模型自动纠正多个 `in_progress`。

### 3. 开始前更新，完成后立即更新

正确顺序：

```text
把下一项标为 in_progress
  → 执行该项
  → 确认完成后立即标为 completed
  → 再把下一项标为 in_progress
```

不要在做完多项后一次性补记状态，也不要提前把未执行的工作标成 completed。

### 4. Todo 描述结果，不描述工具调用

推荐：

- `Read the current filter configuration`
- `Update the component binding`
- `Verify the data flow`

避免：

- `Call read_file`
- `Use edit_files`
- `Think about the next step`

Todo 应让用户理解工作目标，不应暴露无意义的内部调用细节。

### 5. 保持合适粒度

一个 todo 应对应一个可验证的阶段。不要：

- 把整个需求写成唯一一项。
- 按每个文件、每条命令机械拆分。
- 创建过长清单挤占 agent 上下文。

通常保留 3～7 项即可；执行中只有在确有必要时才增加步骤。

---

## 完成与阻塞

只有满足完成标准后才能标记 `completed`。以下情况仍应保持 `in_progress`：

- 写操作失败。
- 必要验证失败。
- 实现不完整。
- 发现必须先解决的新问题。

遇到阻塞时：

1. 保留当前项为 `in_progress`。
2. 在完整列表中加入解决阻塞所需的新步骤。
3. 继续更新清单，不要把 Todo 当作错误日志。

若任务目标发生变化，不再需要的 todo 可以在下一次全量更新中移除。

---

## 自动清空

当传入的非空列表中所有 todo 都是 `completed` 时，当前实现会把存储状态自动置为空数组，UI 不再展示活动清单。

因此最后一次调用仍应提交完整的 completed 列表；工具会负责清空，不需要再额外调用一次空数组。

---

## 验证提醒

当前实现会在以下条件同时满足时返回验证提醒：

- 本次提交的 todo 至少有 3 项。
- 所有项都已完成。
- `content` 中没有匹配 `verify` 或 `verification` 的步骤。

这是一个提醒，不会自动创建验证 todo，也不会自动委派验证 agent。规划可修改代码或数据流的工作时，应主动包含一个明确、可执行的验证步骤。

---

## 推荐流程

```text
判断由主 agent 直接执行
  → 拆成 3～7 个可验证阶段
  → todoWrite：第一项 in_progress，其余 pending
  → 完成一项后全量更新列表
  → 必要时加入新步骤或移除失效步骤
  → 执行验证
  → 全部标记 completed，由工具自动清空
```
