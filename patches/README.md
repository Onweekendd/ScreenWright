# Mastra 1.66.0 审批恢复补丁

`@mastra__core.patch` 同时覆盖 ESM 和 CommonJS，由 pnpm 在安装时自动应用。

解决两个已用真实 Agent、Memory、内存存储复现的问题：

- 前台工具挂起后，`untilIdle` 仍等待后台任务并启动续接。项目的审批恢复排在这一轮之后，导致恢复被阻塞。补丁在这一轮安全结束后关闭 idle 包装流，让恢复请求及时执行；后台 worker 继续运行。后台工具自身的挂起不触发该行为。
- 后台结果回调持有旧 MessageList，回写时会把已经恢复完成的工具从 `result` 覆盖回 `call`，并丢失恢复后的消息内容。补丁让同一 Memory 的消息写入共享串行队列，遇到旧快照时保留数据库中的已结束工具、最新正文和审批元数据，再合入后台工具结果。

回归用例：`servers/server/tests/mastra/chat/foreground-suspend-idle.test.ts`。它验证恢复不等待后台完成，以及单个和并行后台结果不会撤销已经落库的工具回执。

升级 `@mastra/core` 时需重新核对上游实现和回归用例，再决定是否移除补丁。
