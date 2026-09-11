# AgentBI 多会话（多 Tab）架构文档

> 适用范围：`apps/app/src/views/build/components/agentBI/`
> 核心目标：同一大屏编辑面板内可同时打开多个对话 Tab，各自独立流式、互不打断；同时保证对**唯一画布**的写入安全与审批弹窗的按 Tab 隔离。

---

## 1. 设计目标与产品边界

| # | 边界 | 说明 |
|---|------|------|
| 1 | **多 Tab 仅限同一大屏** | 多个 Tab 共享同一 `resourceId`（`navInfo.id`）。切换大屏时整组 Tab 重置，只保留一个空白对话。 |
| 2 | **画布写入全局串行** | Figma 转换 / 创建·删除·复制组件 / 保存·删除过滤器 / 推送组件更新 / 更新大屏配置等「真正改画布」的操作，无论由哪个 Tab 触发，**全局一次只执行一个**，避免并发写坏组件树或路由跳转互相打断。 |
| 3 | **审批弹窗按 Tab 隔离** | 每个 Tab 各自可挂起一个审批弹窗（confirm / askQuestion / submit_plan / save_ai_template / apply_ai_template）。只展示**当前激活 Tab** 的审批，其余 Tab 的审批排队，等其被激活时才弹出；Tab 头用角标提示「有待处理」。 |

---

## 2. 总体结构

```
┌─────────────────────────────────────────────────────────────┐
│ useAgentBISessions  (createGlobalState · 整组 Tab 管理)        │
│   visible / sessions[] / activeSessionId / activeSession      │
│   addTab / closeTab / openThread / resetSessions              │
│   watch(navInfo.id) → 切大屏整组重置                           │
└───────────┬─────────────────────────────────────────────────┘
            │ 持有 N 个
            ▼
┌─────────────────────────────────────────────────────────────┐
│ createAgentBISession()  (普通工厂 · 每个 Tab 一个独立会话)     │
│   sessionId / messages / isStreaming / abortController        │
│   useContextWindow()      ← 每会话独立实例（已去单例）          │
│   useBackgroundTask(id)   ← 每会话独立实例（已去单例）          │
│   useAgentBIMemory(...)   ← 每会话私有：activeThreadId/分页…    │
│   useAgentBIThreadList()  ← 共享：同大屏历史线程列表            │
│   sendMessage / processAgentStream / switchToChatFromHistory  │
└─────────────────────────────────────────────────────────────┘

跨会话共享的全局单例（createGlobalState / 模块级）：
  • useAgentBIThreadList  历史线程列表（按大屏共享）
  • useConfirm            审批弹窗 Map<sessionId, dialog>
  • useCanvasMutationQueue 画布写入 Promise 串行链（模块级）
```

---

## 3. 会话工厂：`createAgentBISession()`

文件：[useAgentBI.ts](./useAgentBI.ts)

**从 `createGlobalState` 单例改为普通工厂函数**，每次调用产生一个互相隔离的会话实例。

- `sessionId = uuid()`：**独立于 `activeThreadId`**。新对话在首次发消息前还没有 `threadId`，需要一个贯穿整个 Tab 生命周期的稳定 key，用于 `useConfirm`（审批隔离）和 `useBackgroundTask`（后台任务隔离）的分组。
- 每会话私有：`messages` / `inputText` / `isStreaming` / `isGeneratingTitle` / `abortController` / 上下文窗口 / 后台任务 / `activeThreadId` 与分页状态。
- `currentThreadTitle`：computed，从共享的 `memoryThreads` 里按本会话 `activeThreadId` 取标题（无线程时为「新对话」）。每个 Tab 各自展示自己线程的标题与生成动画。
- `stopStreaming()`：abort 本会话自己的 controller，**不影响其他 Tab**。
- 导出 `export type AgentBISession = ReturnType<typeof createAgentBISession>`。

> 注意：`watch(resourceId, ...)`「切大屏即重置」的逻辑**已从此处移除**，上移到 `useAgentBISessions`（语义从「单会话响应」扩大为「整组 Tab 响应」）。

---

## 4. Tab 管理 Store：`useAgentBISessions`

文件：[useAgentBISessions.ts](./useAgentBISessions.ts)（`createGlobalState` 全局单例）

| 成员 | 作用 |
|------|------|
| `visible` | 抽屉显隐（抽屉整体只有一个，不属于单会话） |
| `sessions: shallowRef<AgentBISession[]>` | 当前所有 Tab |
| `activeSessionId` / `activeSession` | 当前激活 Tab |
| `addTab()` | `createAgentBISession()` → push → 激活，返回新会话 |
| `closeTab(id)` | 先 `stopStreaming()` 再移除；关激活项则切相邻项；关到空则自动新建一个空白 Tab |
| `openThread(thread)` | **历史记录打开对话**：若该 thread 已在某 Tab 中（`activeThreadId === thread.id`）则切过去；否则新建 Tab 加到末尾并 `switchToChatFromHistory` 载入——**不替换当前 Tab** |
| `resetSessions()` | 停所有流 → 清空 → `threadList.reset()` → 新建一个默认 Tab |
| `watch(navInfo.id)` | 切大屏（id 变化且非 `-1`）触发 `resetSessions()`，`immediate` |

---

## 5. 关键跨会话机制

### 5.1 画布写入串行队列
文件：[hooks/useCanvasMutationQueue.ts](./hooks/useCanvasMutationQueue.ts)（**模块级单例**，非组件作用域）

```ts
let chain: Promise<unknown> = Promise.resolve();
export function enqueueCanvasMutation<T>(task: () => Promise<T>): Promise<T> {
  const result = chain.then(task);
  chain = result.catch(() => {}); // 链吞错，避免一个失败连锁中断后续
  return result;                  // 真实成功/失败透传给调用方
}
```

应用点：
- [hooks/useFigmaToBI.ts](./hooks/useFigmaToBI.ts) 的 `addProcessedComponent`（早期 `if (!component) return null` 之后整体入队）。
- [hooks/useComponentStreamUpdater.ts](./hooks/useComponentStreamUpdater.ts) 中所有真正落地画布的 handler（create/delete/copy 组件、save/delete 过滤器、push 组件更新、update 大屏配置及其 ask_approval 变体）。

**只包裹「确认后实际执行」的部分**，`confirm(...)`/`askQuestion(...)` 等待用户输入的部分**不入队**——否则一个 Tab 等审批时会卡死其他 Tab 的画布写入。`handleExecuteInBrowser` 不入队。

> 内部状态 `allComponentMap`/`componentList`/`figmaNodeIdToBIComponentId` 仍全局共享——画布本就唯一。

### 5.2 审批弹窗按 sessionId 排队
文件：[hooks/useConfirm.ts](./hooks/useConfirm.ts)（`createGlobalState`）

- `pendingDialog: Ref<PendingDialog|null>` → **`dialogs: Ref<Map<sessionId, PendingDialog>>`**。
- 所有创建方法（`confirm`/`askQuestion`/`showSubmitPlan`/`showSaveAiTemplate`/`showApplyAiTemplate`）和所有 resolver（`resolveConfirm`/…/`closeDialog`）**首参均为 `sessionId`**，按 key 读写/删除。
- `ref(new Map())` 使 Map 响应式，`.set/.delete/.has/.get` 都能触发依赖——这是 [TabBar.vue](./components/TabBar.vue) 角标与 [ApprovalDialog.vue](./components/ApprovalDialog.vue) 渲染的响应式来源。
- `closeDialog` 对 save/apply_ai_template 取消时也必须 resolve，否则 suspend 永远 resume 不回来、agent 卡死。

`useComponentStreamUpdater(sessionId, {...})` 与 `useChunkSideEffects({ sessionId, ... })` 都新增 `sessionId` 参数并转发，确保审批写入正确的 Tab。

### 5.3 去单例化的 hooks
| Hook | 改动 |
|------|------|
| [hooks/useContextWindow.ts](./hooks/useContextWindow.ts) | 去 `createGlobalState`，改普通 factory，每会话独立 `lastUsage`/`compacting` |
| [hooks/useBackgroundTask.ts](./hooks/useBackgroundTask.ts) | 去 `createGlobalState`，改 `useBackgroundTask(sessionId)`，每会话独立后台任务 Map |

### 5.4 历史列表共享 / 会话记忆私有
| Hook | 作用域 | 内容 |
|------|--------|------|
| [hooks/useAgentBIThreadList.ts](./hooks/useAgentBIThreadList.ts) | **共享**（`createGlobalState`，按大屏） | `memoryThreads` / `isLoadingMemory` / `queryMemory` / `updateThreadTitle` / `reset`；`resourceId` 自 `useLargeScreenInfo` 计算 |
| [hooks/useAgentBIMemory.ts](./hooks/useAgentBIMemory.ts) | **每 Tab 私有** | `activeThreadId` / `currentMode` / 分页 / `ensureActiveThread` / `loadThreadMessages` / `startNewChat` 等；通过参数**注入** `memoryThreads` |

---

## 6. UI 接线（Provide / Inject）

文件：[agentBISessionContext.ts](./agentBISessionContext.ts)

- `ActiveSessionKey: InjectionKey<ComputedRef<AgentBISession | undefined>>`。
- [index.vue](./index.vue) 顶层 `provide(ActiveSessionKey, activeSession)`。
- 叶子组件 `useActiveAgentBISession()` 取激活会话（在 setup 阶段解析出当次实例）。
- **切 Tab 时由 `:key="activeSession.sessionId"` 把 `process-area` 整体重挂载**，叶子组件（ChatInput / ApprovalDialog / BackgroundTasksView）重新 setup → 重新注入到新的激活会话。这是「注入响应式」的关键手段，避免逐层 prop drilling。

| 组件 | 数据来源 |
|------|---------|
| [components/TabBar.vue](./components/TabBar.vue) | 遍历 `sessions`，每个 Tab 用各自 `currentThreadTitle`/`isStreaming`/`isGeneratingTitle`；`useConfirm().dialogs.has(sessionId)` 判待审批 |
| [components/ChatInput.vue](./components/ChatInput.vue) | `useActiveAgentBISession()`（替代旧的 `useAgentBI()`/`useContextWindow()`） |
| [components/ApprovalDialog.vue](./components/ApprovalDialog.vue) | `dialogs.value.get(sessionId)`，resolve/close 调用都带 `sessionId` |
| [components/BackgroundTasksView.vue](./components/BackgroundTasksView.vue) | 激活会话的 `backgroundTasks` |
| [components/HistorySidebar.vue](./components/HistorySidebar.vue) | 纯 props：`threads`/`isLoading` 来自共享 ThreadList，`selectedId` 来自激活会话 `activeThreadId` |

### TabBar 视觉约定
- 标题采用 AskUserQuestionPart 同款 `::before/::after` 径向渐变**弧形标签**，选中 Tab 底色（`$color-primary-10`）经弧形铺到分隔线上，平滑融入下方对话区。
- 编辑/关闭图标默认 `width:0` 折叠不占位，仅 hover 展开。
- 状态灯**互斥**：待审批（需用户操作）→ **闪烁黄灯**（`tab-badge-blink`）优先；否则流式中 → 呼吸**紫灯**（`tab-dot-breath`）。二者不同时出现。
- 顶部栏不含「新建」按钮，新建对话走历史侧栏「新建对话」入口（`@new-chat="addTab"`）。

---

## 7. 流式与 suspend/resume（未因多 Tab 改变）

- `sendMessage` → `processAgentStream`：仅发送当前用户消息，后端基于 `threadId` 取完整历史。
- suspend/resume **不在 `processAgentStream` 内重发**：suspend 时由 [hooks/useChunkSideEffects.ts](./hooks/useChunkSideEffects.ts) fire-and-forget 调 `POST /bi-chat/resume`，续接帧顺同一条流回来，`consumeSSEResponse` 持续消费。
- clientTool 循环：流结束后检测 `input-available` 的 client tool，执行后把结果合并进 assistant 消息，递归续流。
- 每会话独立 `abortController`，`stopStreaming()` 只 abort 自己。

---

## 8. 边界与注意事项

- **关闭仍在流式的 Tab**：先 `stopStreaming()` 再移除，不影响其他 Tab。
- **关闭最后一个 Tab**：自动新建一个空白 Tab，保证抽屉里至少有一个会话。
- **切大屏**：整组 Tab 清空 + ThreadList 重置 + 新建一个默认 Tab。
- **从历史打开**：已开则切换、未开则新增到末尾（`openThread`），不覆盖当前对话。
- 画布串行队列是**模块级**单例，跨所有会话、跨整个抽屉生命周期持续存在（不随 Tab 关闭清空）。

---

## 9. 涉及文件一览

**新增**：`useAgentBISessions.ts` · `agentBISessionContext.ts` · `hooks/useCanvasMutationQueue.ts` · `hooks/useAgentBIThreadList.ts` · `components/TabBar.vue`
**改造**：`useAgentBI.ts`(单例→工厂) · `hooks/useConfirm.ts` · `hooks/useContextWindow.ts` · `hooks/useBackgroundTask.ts` · `hooks/useComponentStreamUpdater.ts` · `hooks/useChunkSideEffects.ts` · `hooks/useFigmaToBI.ts` · `hooks/useAgentBIMemory.ts` · `index.vue` · `components/{ChatInput,ApprovalDialog,BackgroundTasksView,HistorySidebar}.vue` · 两处 `buildAction.vue`(visible 改取自 sessions store)
**删除**：`components/PanelHeader.vue`（标题展示/生成动画/编辑逻辑迁入 TabBar.vue）

**测试**（`src/tests/agentBI/`）：改写 `useAgentBI.test.ts`/`useAgentBIMemory.test.ts`；新增 `useAgentBIThreadList.test.ts`/`useCanvasMutationQueue.test.ts`/`useConfirm.test.ts`/`useAgentBISessions.test.ts`。
