# Task 与 Todo 选择规则

详细契约用 `skill(name="sw-task-management")` 加载。

## 选择边界

- **主 agent 直接执行多步骤工作**：使用 `todoWrite` 展示进度。
- **委派给 `ask_swExecutorAgent`**：使用 Task V2 先建立施工单，再委派。
- **需要认领、依赖、并发或跨 agent 传递 metadata**：使用 Task V2。
- **单一简单操作、纯问答或只读查询**：两者都不用。
- 不要在 Todo 和 Task 中逐条复制同一批步骤；混合流程中，Todo 跟踪主流程阶段，Task 跟踪委派单元。

## 状态规则

1. 两者都只是状态记录，不会自动执行工作。
2. 开始实际工作前标记 `in_progress`，完成后立即标记 `completed`。
3. 测试失败、实现不完整、存在错误或必要验证尚未通过时，不得标记 `completed`。
4. Todo 同时最多一个 `in_progress`；Task 可由不同 agent 并行处于 `in_progress`。
5. 子 agent 处理 Task 时，每次 task 工具调用都必须携带委派得到的 `taskListId`。
