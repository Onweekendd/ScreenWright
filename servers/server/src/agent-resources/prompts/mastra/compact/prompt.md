你正在为一个 BI 数据大屏构建任务执行 **上下文压缩(Context Checkpoint Compaction)**。
请阅读完整对话历史,生成一份结构化的接续摘要,让另一个 LLM 能在不丢关键信息的前提下继续工作。

## 输出格式

必须按下列 8 个章节输出,每个章节使用 `## 标题` 开头。若该章节本对话中无相关内容,写 `(无)`。

### 1. 当前任务状态(Task List Snapshot)
- 列出所有已创建的 task,标注 status(pending / in_progress / verification_required / completed / failed)
- 对每个非 completed 任务,简要描述 task_kind、target_files、user_intent / expected_state
- 包含 screenId / skill_ref 等关键 metadata

### 2. 已确认的设计决策
- 用户已经选定的:组件类型、组件名、screen 布局、数据来源、字段映射等
- 用户已经拒绝的方案(避免重复尝试)
- skill_ref / 模板选择的依据

### 3. 已操作的文件清单
- 列出本会话中创建 / 修改 / 删除的所有文件路径
- 每个文件的最新状态(如:"已 push 到 buildJson","已 edit 加入 dataFilter 配置")
- 不要复制文件内容,只描述"做了什么改动 + 当前是什么状态"

### 4. 数据流验证结果
- 是否调用过 dataFlowVerificationAgent 校验
- 校验结论(✅ 通过 / ❌ 失败,具体失败项)
- execute_in_browser 获取的关键运行时数据摘要

### 5. 待处理的验证任务
- 列出所有 verification_required 状态的 task
- 每个任务需要校验什么(过滤器链路 / 事件配置 / openFilter 等)

### 6. 用户偏好与约束
- 用户提到的硬约束(必须用 X 组件 / 不能用 Y 字段)
- 用户的工作风格(喜欢一次配多个 / 偏好先看效果)
- 用户提供的外部资源(figma URL、上传的图片、参考截图)

### 7. 错误与修复记录
- 本会话遇到过的关键错误(API 报错 / tsc 失败 / 数据流断裂)
- 是怎么修的、修复后是否验证过

### 8. 下一步计划
- 接下来应该做什么(按优先级)
- 阻塞项(等待用户确认 / 等待校验通过)

## 约束

- 保留用户原话中的关键名词(组件名、字段名、screenId),不要意译
- 凡是涉及具体 ID(taskId / screenId / componentId / toolCallId)必须原样保留
- 摘要总长度控制在 5000-10000 字之间,信息密度优于长度
- 不要复述用户问候、寒暄、感叹等无信息内容
- 不要包含 markdown 之外的格式,不要生成代码块除非引用关键配置片段(< 20 行)
