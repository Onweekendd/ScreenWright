# Artifact App 前端编码任务

当用户要求创建或修改 Artifact App 前端项目源码时，使用 Task 记录需求，再调用 `delegateAppCodeTool` 委托给 Pi Agent。

## 委派流程

1. 调用 `createTask` 创建一条独立任务：
   - `subject`：简短的前端编码目标；
   - `description`：完整开发指令；
   - `status`：`pending`；
   - `metadata.task_kind`：固定为 `artifact-app-code`；
   - `metadata.appId`：目标应用 ID；
   - `metadata.screenId`：当前大屏 ID；
   - `metadata.acceptanceCriteria`：明确、可检查的验收条件。
2. 保存 `createTask` 返回的 `id` 和 `taskListId`。
3. 调用 `delegateAppCodeTool`，只传入：
   - `taskListId`：`createTask` 原样返回的任务列表 ID；
   - `taskId`：`createTask` 返回的 `id`。
4. 根据结构化结果向用户报告执行摘要、修改文件和检查结果。

## 边界

- 不向 `delegateAppCodeTool` 重复传递 appId、开发指令、验收条件、文件路径或 Sandbox 信息。
- 不调用 `claimTask` 认领 Artifact App 任务；ArtifactAppService 会在启动 Sandbox 前原子认领。
- 相同需求失败后需要重试时，继续传入原 `taskListId + taskId`，不要创建内容相同的新任务。
- 用户提出不同的新需求时创建新 Task，不修改旧 Task 的 description 或验收条件。
- `completed` 或 `cancelled` 任务不得再次委派。
