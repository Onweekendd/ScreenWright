---
name: sw-task-management
description: >
  FunBI 任务与进度管理指南。需要用 Task 工具建立施工单、跨 agent 委派和管理依赖，
  或用 TodoWrite 展示主 agent 直接执行工作的进度时查阅。
  触发场景：多步骤直接执行、子 agent 委派、并发施工、任务认领、依赖和进度跟踪。
---

# FunBI 任务与进度管理

## 首先选择正确的工具

| 场景 | 使用 |
|---|---|
| 主 agent 自己完成多步骤工作，需要展示进度 | `todoWrite` |
| 工作将委派给 `ask_swExecutorAgent` | Task V2 |
| 需要 owner、依赖、并发或跨 agent 上下文 | Task V2 |
| 单一简单操作、纯问答或只读查询 | 两者都不用 |

核心区别：

- **TodoWrite 是进度清单**：服务于主 agent 直接执行；全量替换，同时最多一个 `in_progress`，全部完成后自动清空。
- **Task V2 是施工任务账本**：服务于委派协作；按字段更新，支持 `taskListId`、`owner`、`blocks/blockedBy` 和 `metadata`。
- 两者都不会自动执行工作。Task 创建后仍需调用 `ask_swExecutorAgent` 才会真正派发。
- 不要在 Todo 和 Task 中逐条复制同一批步骤。混合流程中，Todo 只跟踪主流程阶段，Task 跟踪实际委派单元。

## 共同状态规则

1. 通过 `claim_task` 认领 Task 时会原子写入 `owner + in_progress`；Todo 或未认领流程仍需在开始实际工作前标记 `in_progress`。
2. 完成后立即更新状态，不要批量补记。
3. 测试失败、实现不完整、存在错误或必要验证尚未通过时，不得标记 `completed`。
4. 遇到阻塞时保留未完成状态，并记录阻塞原因或新增前置任务。

## Task V2 快速参考

### 创建

```json
{
  "taskData": {
    "subject": "配置 chart_001 的数据过滤器",
    "description": "绑定 filter_dateRange，并将 openFilter 设置为 true",
    "status": "pending",
    "metadata": {
      "task_kind": "modify",
      "screenId": "screen_42",
      "target_files": ["/workspace/screen_42/component/chart_001.json"],
      "expected_state": ["openFilter 为 true"],
      "context": {
        "current_openFilter": false
      },
      "skill_ref": "sw-data-flow"
    }
  }
}
```

`create_task` 返回 `{ id, taskListId }`。委派时必须把 `taskListId` 原样放入 `<delegation><task_list_id>`。

### 更新

```json
{
  "taskId": "7",
  "taskListId": "主 agent 创建任务时返回的 taskListId",
  "updates": {
    "status": "in_progress"
  }
}
```

- 子 agent 调用 `claim_task`、`get_task`、`update_task`、`list_tasks` 时必须传 `taskListId`。
- `updates` 是字段级更新；但 `metadata`、`blocks`、`blockedBy` 字段各自会整体替换，修改前先读再合并。
- Task 状态为 `pending / in_progress / completed / failed / cancelled`。`failed` 可以使用同一 task ID 重试，`completed` 和 `cancelled` 不可直接重新认领。删除使用 `delete_task`，不存在 `deleted` 状态。
- `claim_task` 成功时自动增加 `attemptCount` 并清除旧 `lastError`；执行失败时应写入 `failed + lastError`。

## TodoWrite 快速参考

```json
{
  "todos": [
    {
      "content": "Read the current component configuration",
      "status": "in_progress",
      "activeForm": "Reading the current component configuration"
    },
    {
      "content": "Update the component binding",
      "status": "pending",
      "activeForm": "Updating the component binding"
    },
    {
      "content": "Verify the updated data flow",
      "status": "pending",
      "activeForm": "Verifying the updated data flow"
    }
  ]
}
```

- 每次调用传完整 `todos` 数组，不存在增量 add/remove。
- 同一列表最多一个 `in_progress`。
- `content` 描述目标，`activeForm` 描述正在进行的动作。
- 所有 todo 完成后工具自动清空活动列表。

## 详细参考

| 文件 | 何时查阅 |
|---|---|
| [references/task-v2-guide.md](references/task-v2-guide.md) | Task Schema、委派、认领、依赖、metadata 和跨 thread 流程；**create / modify 两类任务的完整字段表**；**从 create_task 到 ask_swExecutorAgent 再到校验收尾的端到端示例** |
| [references/todo-v1-guide.md](references/todo-v1-guide.md) | Todo 选择边界、全量替换、状态规则、自动清空和验证提醒 |
