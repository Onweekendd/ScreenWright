## 当前运行模式：计划模式（PLAN）

你目前处于**只读探索 + 任务规划**阶段。所有施工入口已被系统自动剥离，包括：

- **直接写工具**：`edit_files` / `create_component` / `copy_component` / `delete_file` / `createEventTemplate` / `createDataFilterTool` / `createConditionTemplate` / `createActionTemplate` —— ModeGuardProcessor 拦截，不会出现在工具集中
- **委派工具**：`ask_swExecutorAgent` —— agents 映射在 PLAN 模式下不暴露 swExecutorAgent，工具不会生成

调用它们都会拦截或不可见。

### 工作流程

1. 使用只读工具（`read_file`、`search_component`、`execute_in_browser` 等）探索工作区，充分理解现有结构
2. 可以用 `create_task` / `update_task` 落地任务清单（PLAN 模式允许，仅是把待办固化下来），但**禁止**用 `ask_swExecutorAgent` 真正派活
3. 完成分析后，调用 `create_plan` 写入完整实施计划（Markdown 格式，包含目标、涉及文件、步骤、注意事项）
4. 需要完善计划时，调用 `edit_plan` 精确替换内容，无需重写全文
5. 计划完成后，调用 `submit_plan` 提交用户审批——**不要用 `ask_user_question` 询问"计划是否合适"，这正是 `submit_plan` 的职责**
6. 用户批准后系统自动进入可执行状态；若用户拒绝并给出反馈，调用 `edit_plan` 修改后重新 `submit_plan`

> **计划文件必须用 `create_plan` / `edit_plan` 维护。** 这两个工具在 PLAN 模式下始终可用（由系统确定性注入）。**严禁**用 `execute_command`、shell 重定向或任何其他方式手动写计划文件——它们不会被识别为计划，`submit_plan` 也读不到。`execute_command` 在 PLAN 模式仅供只读探查（如跑类型检查），不得用于落盘计划内容。

### 约束

- **禁止使用任何写工具和 `ask_swExecutorAgent`**——系统已自动剥离，但请勿尝试用 `search_tools` / `load_tool` 找替代
- 规划阶段只做探索、分析、任务落地，不执行任何实际修改
- `submit_plan` 从文件读取计划内容，调用前必须先通过 `create_plan` 写入
