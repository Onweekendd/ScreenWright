# BI Agent 后台任务机制与调试指南

本文描述 Screenwright 当前的后台子 agent 执行链路。权威依据是：

- `@mastra/core`：`1.45.0`，并应用 `patches/@mastra__core.patch`
- `swAgent.stream(..., { untilIdle: true })`
- `Mastra.backgroundTaskManager`
- Screenwright 自己维护的 `BIChatStreamSession`

> `Agent.streamUntilIdle()` 在当前 Mastra 版本中已弃用。不要再把“必须调用 streamUntilIdle”写入提示或排障步骤；当前等价入口是 `stream()` / `resumeStream()` 的 `untilIdle: true` 选项。

---

## 先区分两种 Task

项目中有两套名字都包含 task、但职责完全不同的机制：

| 机制 | 用途 | ID |
|---|---|---|
| Screenwright Task V2 | 施工单、认领、依赖和主/子 agent 通信 | `taskListId + taskId` |
| Mastra background task | 把一次子 agent 工具调用放到后台运行 | background `taskId` |

`create_task` 只创建 Screenwright 施工记录，不会启动后台执行。

真正触发 Mastra background task 的是 `ask_swExecutorAgent`；它在 `swAgent.backgroundTasks.tools` 中被配置为后台工具。

---

## 当前执行链路

```text
用户请求
  → handleBiChat()
  → BIChatStreamSession.runTurn()
  → createBIChatTurnStream()
  → swAgent.stream(messages, { untilIdle: true, memory, ... })
  → 主 agent 调 ask_swExecutorAgent
  → Mastra 将该子 agent 工具调用派发为 background task
  → agent 流立即产生 background-task-started
  → 子 agent 在后台执行 Screenwright Task V2 施工单
  → backgroundTaskManager 发布 running/output/completed 等事件
  → untilIdle 包装器把终态结果写入 memory 并触发主 agent 续接轮
  → 同一条 BIChatStreamSession 向前端持续输出
```

当前普通初始轮使用：

```typescript
swAgent.stream(messages, {
  untilIdle: true,
  memory: {
    thread: threadId,
    resource: resourceId
  },
  requestContext,
  abortSignal
})
```

恢复主 agent 挂起工具时使用：

```typescript
swAgent.resumeStream(resumeData, {
  untilIdle: true,
  runId,
  memory: {
    thread: threadId,
    resource: resourceId
  },
  requestContext,
  abortSignal
})
```

`untilIdle: true` 使 `fullStream` 横跨初始轮和后台任务完成后的续接轮。其他聚合属性仍只代表第一轮；跨续接结果必须消费 `fullStream`。

---

## 配置条件

### Mastra 实例

后台管理器需要：

1. `backgroundTasks.enabled: true`
2. 可用的 `storage`

当前配置位于 `servers/server/src/mastra/index.ts`：

```typescript
new Mastra({
  storage,
  backgroundTasks: {
    enabled: true,
    globalConcurrency: 10,
    perAgentConcurrency: 5,
    backpressure: "queue",
    defaultTimeoutMs: 600_000
  }
})
```

### swAgent

只有显式 opt-in 的工具才会进入后台。当前只为施工子 agent 开启：

```typescript
backgroundTasks: {
  tools: {
    swExecutorAgent: {
      enabled: true,
      timeoutMs: 900_000
    }
  }
}
```

同时必须给 `swAgent` 配置 `memory`，并在每次流调用中提供 `memory.thread` 与 `memory.resource`，否则后台结果无法稳定写回和续接。

---

## `_background` 调用语义

`ask_swExecutorAgent` 已在 agent 层 opt-in，因此：

- 不传 `_background`：使用默认后台执行。
- `_background: { enabled: true }`：显式后台执行。
- `_background: { enabled: false }`：本次改为前台同步执行。

字段名必须是 `enabled`。

`_background` 只是对已 opt-in 工具的单次覆盖，不能把任意未配置工具强行变成后台任务。

### 选择原则

- 多 slot 并发施工、长耗时任务：默认后台。
- 必须当场拿到 `<execution_report>` 才能继续校验：使用同步覆盖。

后台派发返回的 `Background task started...` 是成功回执，不是执行报告。收到回执后不得因为“结果为空”重复委派同一个 Screenwright task。

---

## Stream chunk 来源

### Agent 流

| Chunk | 含义 |
|---|---|
| `background-task-started` | 已入队并拿到 background task ID |
| `background-task-progress` | 当前运行中后台任务数量变化 |

### BackgroundTaskManager 流

| Chunk | 含义 |
|---|---|
| `background-task-running` | worker 开始执行 |
| `background-task-output` | 子 agent 的流式输出 |
| `background-task-suspended` | 后台任务等待审批或输入 |
| `background-task-resumed` | 已恢复执行 |
| `background-task-completed` | 成功完成 |
| `background-task-failed` | 执行失败或超时 |
| `background-task-cancelled` | 被取消 |

`untilIdle: true` 会把 manager 生命周期事件合并进 agent 的 `fullStream`。Screenwright 在恢复 suspended 后还会通过 `BIChatStreamSession.attachTaskStream()` 建立按 `taskId` 过滤的旁路订阅，保证恢复期间的实时事件继续进入原会话流。

---

## 前端转换

Mastra 原生事件使用：

```text
background-task-*
```

Screenwright 服务端通过 `renameBackgroundChunk()` 转成前端能透传的：

```text
data-background-task-*
```

其中：

- 普通生命周期事件把 `payload` 移到 `data`。
- `background-task-output` 由 `flattenBackgroundOutput()` 拍平，并把内部 Mastra chunk 转成 UI message chunk。
- 无法映射的内部 chunk 会被丢弃，避免单帧异常破坏整条 SSE。
- `bgSubRunIds` 用于过滤后台子 agent 同时出现的原生 `data-tool-agent`，避免重复展示。

不要在提示或业务代码里依赖旧版 `1.38.0` 的累积 `steps[]` 快照结构；当前转换逻辑以本地 `BackgroundTaskOutputRawPayload` 类型和 `flattenBackgroundOutput()` 为准。

---

## Suspend / Resume

后台子 agent 内部工具可以调用 `suspend()` 等待前端审批或用户输入：

```text
background-task-suspended
  → 前端提交 resumeData
  → handleBiChatResumeTask()
  → 先 attachTaskStream(taskId)
  → 等待 __background-task workflow snapshot 落为 suspended
  → backgroundTaskManager.resume(taskId, resumeData)
  → resumed/output/terminal 继续写入同一 BIChatStreamSession
```

项目 patch 处理了两件事：

1. `background-task-suspended` 会从 until-idle wrapper 的运行集合中移除，避免流一直把 suspended 当作 running。
2. 恢复执行时把 `suspendedToolRunId` 重新传给 executor，保证内部挂起工具能正确 resume。

`waitForBgWorkflowSuspended()` 用于规避 task 表已经 suspended、但 workflow snapshot 尚未落盘的竞态。

---

## 会话流职责

`BIChatStreamSession` 是前端连接看到的长寿命 outer stream，负责：

- 串行执行同一会话的主 agent turn。
- 把初始轮、续接轮和恢复后的后台旁路事件写进同一流。
- 记录仍处于 suspended 的 background task。
- 对 until-idle 订阅与 `attachTaskStream` 的重复事件去重。
- 后台终态到达但已无活动主轮时，触发空消息续接，让主 agent处理最终结果。
- 会话真正结束后提交版本快照并关闭流。

因此排障时不能只检查 `swAgent.fullStream`，还必须检查 `BIChatStreamSession` 是否仍存在、是否成功接入 task stream。

---

## 常见问题与检查顺序

### 没有 `background-task-started`

依次检查：

1. Mastra 实例是否有 `storage`。
2. `backgroundTasks.enabled` 是否为 `true`。
3. `swAgent.backgroundTasks.tools.swExecutorAgent.enabled` 是否为 `true`。
4. 模型调用的是否确实是 `ask_swExecutorAgent`。
5. 本次是否错误传了 `_background: { enabled: false }`。

### 有 started，但没有 running/output/terminal

依次检查：

1. `mastra.backgroundTaskManager` 是否存在。
2. `swAgent.stream()` 是否传了 `untilIdle: true`。
3. 是否传入 `memory.thread` 和 `memory.resource`。
4. `BIChatStreamSession` 是否被客户端断连或 idle timeout 关闭。
5. manager 中对应 task 的真实状态与错误字段。
6. `renameBackgroundChunk()` 是否抛错或把 output 判为不可映射。

### 主 agent 重复委派

确认：

- provider 的后台占位回填仍生效。
- `keepBgDelegationsVisible` 仍能把派发中的 tool invocation 补成“后台运行中”。
- prompt 明确说明 started 是成功回执。
- 同一个 Screenwright task ID 没有出现在多个委派分组中。

### suspended 后无法恢复

确认：

1. resume 端点传的是 Mastra background task ID，不是 Screenwright Task V2 的 task ID。
2. `BIChatStreamSession` 仍存在。
3. `waitForBgWorkflowSuspended()` 是否等到 workflow snapshot。
4. `backgroundTaskManager.resume()` 是否记录状态错误。
5. `patches/@mastra__core.patch` 是否已应用。

---

## 当前权威源码

| 文件 | 作用 |
|---|---|
| `servers/server/src/mastra/agents/sw-agent.ts` | 子 agent 注册、memory、后台工具 opt-in |
| `servers/server/src/mastra/index.ts` | storage 和 BackgroundTaskManager 全局配置 |
| `servers/server/src/mastra/services/chat/bi-chat-turn-stream.ts` | `stream({ untilIdle: true })`、chunk 转换 |
| `servers/server/src/mastra/services/chat/stream-session.ts` | outer stream、旁路订阅、去重和生命周期 |
| `servers/server/src/mastra/services/chat/handle-bi-chat.ts` | 初始请求、主 run resume、background task resume |
| `servers/server/src/mastra/provider/deepseek.ts` | 后台派发空结果占位回填 |
| `servers/server/src/mastra/processors/keepBgDelegationsVisible.ts` | 防止模型把后台派发误判为孤儿调用 |
| `servers/server/src/mastra/processors/rewriteSuspendedContinuationDirective.ts` | 改写 suspended 续接指令 |
| `patches/@mastra__core.patch` | suspended/resume 的本地 Mastra 修复 |

Mastra API 细节优先查看当前安装包：

```text
servers/server/node_modules/@mastra/core/dist/docs/references/docs-agents-background-tasks.md
servers/server/node_modules/@mastra/core/dist/docs/references/docs-streaming-background-task-streaming.md
servers/server/node_modules/@mastra/core/dist/docs/references/reference-streaming-agents-streamUntilIdle.md
```
