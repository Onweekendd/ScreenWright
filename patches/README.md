# Mastra 1.66.0 审批恢复补丁

`@mastra__core.patch` 同时覆盖 ESM 和 CommonJS，由 pnpm 在安装时自动应用。补丁是对着 1.66.0 的编译产物生成的，`pnpm-workspace.yaml` 用 `overrides` 把 `@mastra/core` 钉死在这个版本。

解决三个已用真实 Agent、Memory、内存存储复现的问题：

- 前台工具挂起后，`untilIdle` 仍等待后台任务并启动续接。项目的审批恢复排在这一轮之后，导致恢复被阻塞。补丁在这一轮安全结束后关闭 idle 包装流，让恢复请求及时执行；后台 worker 继续运行。后台工具自身的挂起不触发该行为。
- 后台结果回调持有旧 MessageList，回写时会把已经恢复完成的工具从 `result` 覆盖回 `call`，并丢失恢复后的消息内容。补丁让同一 Memory 的消息写入共享串行队列，遇到旧快照时保留数据库中的已结束工具、最新正文和审批元数据，再合入后台工具结果。
- 后台子 agent 内的工具挂起后，恢复时子 agent 换一个新线程从头重跑，而不是从挂起点继续。原因是子 agent 把自己的 runId 放在 `suspend()` 的第二个参数里，后台任务恢复时却只从挂起载荷里取 `suspendedToolRunId`，取不到就走全新的 `stream()`。在项目里的表现是：执行 agent 恢复后以新身份再次认领任务，撞上自己之前的认领（`already_claimed`）。补丁把 runId 写进挂起载荷。

回归用例：

- `servers/server/tests/mastra/chat/foreground-suspend-idle.test.ts`：恢复不等待后台完成，单个和并行后台结果不会撤销已经落库的工具回执。
- `servers/server/tests/mastra/chat/background-subagent-resume.test.ts`：后台子 agent 恢复后不重跑已执行的步骤，前后线程一致。

升级 `@mastra/core` 时需重新核对上游实现和回归用例，再决定是否移除补丁。

## 修改补丁

`pnpm patch` 会因为存在多个 1.66.0 实例而弹出交互选择，可以手动生成：

1. 从 `node_modules/.pnpm` 里未打补丁的 `@mastra+core@1.66.0_ai@…` 拷出原始文件；
2. 拷一份当前已打补丁的文件做修改；
3. 用 `git diff --no-index` 对比两者，把路径改成 `a/dist/…`、`b/dist/…`，覆盖 `@mastra__core.patch`；
4. `pnpm install` 重新应用。
