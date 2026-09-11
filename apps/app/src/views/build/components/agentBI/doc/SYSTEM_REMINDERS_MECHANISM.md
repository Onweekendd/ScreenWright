# Claude Code 系统提醒机制完整指南

## 📚 文档说明

本文档详细说明了 Claude Code 如何通过**系统提醒（System Reminders）**机制让 AI Agent 知道用户的上下文操作，包括文件选择、文件打开、代码修改等。

**版本信息**:
- Claude Code 版本: 2.1.81
- 文档版本: 1.0
- 最后更新: 2026-03-25

---

## 🎯 核心机制：系统提醒（System Reminders）

### 什么是系统提醒？

系统提醒是 Claude Code 在运行时动态插入到 AI 对话上下文中的**实时通知**。它们以 `<system-reminder>` 标签的形式出现，向 Agent 传达用户的 IDE 操作、文件状态变化等信息。

### 工作原理

```
┌─────────────────────────────────────────────────────────────┐
│                     用户在 IDE 中操作                         │
│  (选择代码、打开文件、修改代码、运行命令等)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   Claude Code 扩展/CLI       │
        │   捕获这些操作事件            │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   生成 System Reminder       │
        │   (带 ATTACHMENT_OBJECT)     │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   插入到 AI 上下文中          │
        │   (作为 system 消息)         │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │   AI Agent 看到提醒          │
        │   知道用户做了什么            │
        └──────────────────────────────┘
```

---

## 📁 核心系统提醒文件

### 1. 代码选择提醒

**文件位置**: `system-prompts/system-reminder-lines-selected-in-ide.md`

**版本**: 2.1.18 (73 tokens)

**模板内容**:
```markdown
<!--
name: 'System Reminder: Lines selected in IDE'
description: Notification about lines selected by user in IDE
ccVersion: 2.1.18
variables:
  - ATTACHMENT_OBJECT
  - TRUNCATED_CONTENT
-->
The user selected the lines ${ATTACHMENT_OBJECT.lineStart} to
${ATTACHMENT_OBJECT.lineEnd} from ${ATTACHMENT_OBJECT.filename}:
${TRUNCATED_CONTENT}

This may or may not be related to the current task.
```

**实际示例**:
```xml
<system-reminder>
The user's IDE selection (if any) is included in the conversation
context and marked with ide_selection tags. This may or may not
be relevant to the current task.

<ide_selection>
The user selected the lines 291 to 291 from
d:\projects\claude-code-system-prompts\TODO_LIST_DOCUMENTATION.md:
TodoWrite

This may or may not be related to the current task.
</ide_selection>
</system-reminder>
```

**ATTACHMENT_OBJECT 结构**:
```javascript
{
  filename: "d:\\projects\\...\\TODO_LIST_DOCUMENTATION.md",
  lineStart: 291,
  lineEnd: 291,
  content: "TodoWrite"
}
```

**Agent 如何使用**:
```markdown
当看到这个提醒时，Agent 会：
1. 注意到用户选择了特定代码
2. 理解用户可能想讨论这段代码
3. 将上下文与选择内容关联
4. 提供针对性的回答或操作
```

---

### 2. 文件打开提醒

**文件位置**: `system-prompts/system-reminder-file-opened-in-ide.md`

**版本**: 2.1.18 (37 tokens)

**模板内容**:
```markdown
<!--
name: 'System Reminder: File opened in IDE'
description: Notification that user opened a file in IDE
ccVersion: 2.1.18
variables:
  - ATTACHMENT_OBJECT
-->
The user opened the file ${ATTACHMENT_OBJECT.filename} in the IDE.
This may or may not be related to the current task.
```

**实际示例**:
```xml
<system-reminder>
File opened in IDE

The user opened the file
d:\projects\claude-code-system-prompts\system-prompts\
agent-prompt-explore-strengths-and-guidelines.md in the IDE.
This may or may not be related to the current task.
</system-reminder>
```

**ATTACHMENT_OBJECT 结构**:
```javascript
{
  filename: "d:\\projects\\...\\agent-prompt-explore-strengths-and-guidelines.md"
}
```

**Agent 如何使用**:
```markdown
Agent 可以：
1. 推断用户对这个文件感兴趣
2. 优先考虑这个文件的内容
3. 在回答问题时引用该文件
4. 避免重复读取该文件（已知用户正在查看）
```

---

### 3. 文件修改提醒

**文件位置**: `system-prompts/system-reminder-file-modified-by-user-or-linter.md`

**版本**: 2.1.18 (97 tokens)

**模板内容**:
```markdown
<!--
name: 'System Reminder: File modified by user or linter'
description: Notification that a file was modified externally
ccVersion: 2.1.18
variables:
  - ATTACHMENT_OBJECT
-->
Note: ${ATTACHMENT_OBJECT.filename} was modified, either by the
user or by a linter. This change was intentional, so make sure to
take it into account as you proceed (ie. don't revert it unless the
user asks you to). Don't tell the user this, since they are already
aware. Here are the relevant changes (shown with line numbers):
${ATTACHMENT_OBJECT.snippet}
```

**实际示例**:
```xml
<system-reminder>
File modified by user or linter

Note: src/components/Header.tsx was modified, either by the user or
by a linter. This change was intentional, so make sure to take it
into account as you proceed (ie. don't revert it unless the user
asks you to). Don't tell the user this, since they are already aware.
Here are the relevant changes (shown with line numbers):

1: +import { ThemeProvider } from './ThemeContext';
2: +const theme = useTheme();
3: -const oldStyle = { color: 'blue' };
4: +const newStyle = { color: theme.primaryColor };
</system-reminder>
```

**ATTACHMENT_OBJECT 结构**:
```javascript
{
  filename: "src/components/Header.tsx",
  snippet: `
1: +import { ThemeProvider } from './ThemeContext';
2: +const theme = useTheme();
...
  `,
  modifiedBy: "user" | "linter" | "formatter"
}
```

**Agent 如何使用**:
```markdown
Agent 必须：
1. ✅ 保留这些修改（不要覆盖）
2. ✅ 在后续操作中考虑这些变化
3. ❌ 不要告诉用户（他们已经知道）
4. ❌ 不要尝试"修复"格式化器的更改

重要：这是有意修改，不是错误！
```

---

### 4. 诊断问题提醒

**文件位置**: `system-prompts/system-reminder-new-diagnostics-detected.md`

**版本**: 2.1.18 (35 tokens)

**模板内容**:
```markdown
<!--
name: 'System Reminder: New diagnostics detected'
description: Notification about new diagnostic issues
ccVersion: 2.1.18
variables:
  - DIAGNOSTICS_SUMMARY
-->
<new-diagnostics>The following new diagnostic issues were detected:

${DIAGNOSTICS_SUMMARY}</new-diagnostics>
```

**实际示例**:
```xml
<system-reminder>
New diagnostics detected

The following new diagnostic issues were detected:

src/utils/auth.ts:45:12 - error: 'token' is declared but its value
  is never read.
src/components/Login.tsx:23:5 - warning: React Hook useEffect has
  missing dependency: 'user'
</system-reminder>
```

**DIAGNOSTICS_SUMMARY 格式**:
```javascript
{
  diagnostics: [
    {
      file: "src/utils/auth.ts",
      line: 45,
      column: 12,
      severity: "error" | "warning",
      message: "'token' is declared but its value is never read."
    },
    {
      file: "src/components/Login.tsx",
      line: 23,
      column: 5,
      severity: "warning",
      message: "React Hook useEffect has missing dependency: 'user'"
    }
  ]
}
```

**Agent 如何使用**:
```markdown
Agent 应该：
1. 注意到新的错误/警告
2. 主动修复这些问题
3. 或者询问用户是否需要修复
4. 在提交代码前确保诊断问题已解决
```

---

### 5. `@` 文件提及与大文件处理

当用户在对话中使用 `@文件名` 提及一个文件时，harness 会读取文件内容并注入到上下文中。根据文件大小不同，处理方式有所不同。

#### 5.1 正常文件：直接注入

文件大小在限制以内时，内容以 `<system-reminder>` 标签形式内联到用户消息的**最前面**，模拟一次完整的 Read 工具调用流程：

```xml
<system-reminder>
Called the Read tool with the following input: {"file_path": "..."}
</system-reminder>

<system-reminder>
Result of calling the Read tool: "...文件完整内容..."
</system-reminder>

用户实际输入的文字
```

这样 Claude 看到的结构与它自己主动调用 Read 工具后看到的完全一致。

#### 5.2 文件过大：截断处理

**文件位置**: `system-prompts/system-reminder-file-truncated.md`

**版本**: 2.1.18 (74 tokens)

**模板内容**:
```
Note: The file ${ATTACHMENT_OBJECT.filename} was too large and has been truncated
to the first ${MAX_LINES_CONSTANT} lines.
Don't tell the user about this truncation.
Use ${READ_TOOL_OBJECT.name} to read more of the file if you need.
```

**行为规则**:
- Claude **不会**告诉用户文件被截断
- Claude 可自行用 Read 工具读取剩余内容
- 整个过程对用户透明

#### 5.3 对话压缩后引用失效

**文件位置**: `system-prompts/system-reminder-compact-file-reference.md`

**版本**: 2.1.18 (57 tokens)

**模板内容**:
```
Note: ${ATTACHMENT_OBJECT.filename} was read before the last
conversation was summarized, but the contents are too large to
include. Use ${READ_TOOL_OBJECT.name} tool if you need to access it.
```

**实际示例**:
```xml
<system-reminder>
Note: node_modules/@types/react/index.d.ts was read before the
last conversation was summarized, but the contents are too large
to include. Use Read tool if you need to access it.
</system-reminder>
```

**触发时机**: 对话历史被压缩（compaction）后，之前注入的文件内容已不在上下文中，harness 注入此提示让 Claude 知道该文件曾被引用，需要时应重新读取。

**Agent 如何使用**:
```markdown
Agent 知道：
1. 这个文件之前被读取过
2. 内容太大，不在当前上下文中
3. 可以使用 Read 工具重新读取
4. 但会消耗额外的 tokens
```

#### 完整处理流程

```
用户输入 @src/foo.ts
         │
         ▼
  harness 读取文件
         │
         ├─ 大小正常 → 内联为 <system-reminder> 注入到消息头部
         │
         ├─ 文件过大 → 截断至前 N 行
         │             + 追加 system-reminder-file-truncated 提示
         │             （Claude 不告知用户，可自行补读）
         │
         └─ 对话压缩后 → system-reminder-compact-file-reference 提示
                          （Claude 知道文件曾存在，按需用 Read 重读）
```

---

### 6. Agent 调用提醒

**文件位置**: `system-prompts/system-reminder-agent-mention.md`

**版本**: 2.1.18 (45 tokens)

**模板内容**:
```markdown
<!--
name: 'System Reminder: Agent mention'
description: Notification that user wants to invoke an agent
ccVersion: 2.1.18
variables:
  - ATTACHMENT_OBJECT
-->
The user has expressed a desire to invoke the agent
"${ATTACHMENT_OBJECT.agentType}". Please invoke the agent
appropriately, passing in the required context to it.
```

**实际示例**:
```xml
<system-reminder>
Agent mention

The user has expressed a desire to invoke the agent "explore".
Please invoke the agent appropriately, passing in the required
context to it.
</system-reminder>
```

**Agent 如何使用**:
```markdown
Agent 应该：
1. 立即调用指定的子代理
2. 传递相关的上下文
3. 等待子代理的结果
4. 将结果返回给用户
```

---

## 🔧 完整的系统提醒列表

### IDE 交互相关

| 文件名 | Token 数 | 功能 |
|--------|---------|------|
| `system-reminder-lines-selected-in-ide.md` | 73 | 用户选择了代码行 |
| `system-reminder-file-opened-in-ide.md` | 37 | 用户打开了文件 |
| `system-reminder-new-diagnostics-detected.md` | 35 | 检测到新的诊断问题 |

### 文件状态相关

| 文件名 | Token 数 | 功能 |
|--------|---------|------|
| `system-reminder-file-modified-by-user-or-linter.md` | 97 | 文件被修改 |
| `system-reminder-file-exists-but-empty.md` | 27 | 文件为空 |
| `system-reminder-file-shorter-than-offset.md` | 59 | 读取偏移超过文件长度 |
| `system-reminder-file-truncated.md` | 74 | 文件被截断 |

### Plan Mode 相关

| 文件名 | Token 数 | 功能 |
|--------|---------|------|
| `system-reminder-plan-mode-is-active-5-phase.md` | 1,297 | 5 阶段规划模式激活 |
| `system-reminder-plan-mode-is-active-iterative.md` | 923 | 迭代规划模式激活 |
| `system-reminder-plan-mode-is-active-subagent.md` | 307 | 子代理规划模式激活 |
| `system-reminder-plan-mode-re-entry.md` | 236 | 重新进入规划模式 |
| `system-reminder-exited-plan-mode.md` | 73 | 退出规划模式 |
| `system-reminder-plan-file-reference.md` | 62 | 计划文件引用 |
| `system-reminder-verify-plan-reminder.md` | 47 | 验证计划提醒 |

### Hook 相关

| 文件名 | Token 数 | 功能 |
|--------|---------|------|
| `system-reminder-hook-additional-context.md` | 35 | Hook 额外上下文 |
| `system-reminder-hook-blocking-error.md` | 52 | Hook 阻塞错误 |
| `system-reminder-hook-stopped-continuation-prefix.md` | 12 | Hook 停止继续前缀 |
| `system-reminder-hook-stopped-continuation.md` | 30 | Hook 停止继续 |
| `system-reminder-hook-success.md` | 29 | Hook 成功 |

### MCP 相关

| 文件名 | Token 数 | 功能 |
|--------|---------|------|
| `system-reminder-mcp-resource-no-content.md` | 41 | MCP 资源无内容 |
| `system-reminder-mcp-resource-no-displayable-content.md` | 43 | MCP 资源无可显示内容 |

### 其他

| 文件名 | Token 数 | 功能 |
|--------|---------|------|
| `system-reminder-compact-file-reference.md` | 57 | 压缩文件引用 |
| `system-reminder-agent-mention.md` | 45 | Agent 提及 |
| `system-reminder-session-continuation.md` | 37 | 会话继续 |
| `system-reminder-task-status.md` | 18 | 任务状态 |
| `system-reminder-task-tools-reminder.md` | 123 | 任务工具提醒 |
| `system-reminder-todowrite-reminder.md` | 98 | TodoWrite 提醒 |
| `system-reminder-token-usage.md` | 39 | Token 使用情况 |
| `system-reminder-usd-budget.md` | 42 | USD 预算 |
| `system-reminder-memory-file-contents.md` | 36 | 记忆文件内容 |
| `system-reminder-nested-memory-contents.md` | 33 | 嵌套记忆内容 |
| `system-reminder-invoked-skills.md` | 33 | 已调用技能 |
| `system-reminder-output-style-active.md` | 32 | 输出样式激活 |
| `system-reminder-team-coordination.md` | 250 | 团队协调 |
| `system-reminder-team-shutdown.md` | 136 | 团队关闭 |
| `system-reminder-btw-side-question.md` | 244 | 旁白问题 |

---

## 🎯 实际应用场景

### 场景 1: 用户选择代码并提问

```
用户操作:
1. 在 IDE 中选择代码：function calculateTotal(items) { ... }
2. 输入消息："这个函数有什么问题？"

系统流程:
┌─────────────────────────────────────────────────────┐
│ 1. 用户选择代码                                     │
│    calculateTotal 函数，行 45-52                   │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ 2. Claude Code 扩展捕获选择                         │
│    ATTACHMENT_OBJECT = {                           │
│      filename: "src/utils/math.ts",               │
│      lineStart: 45,                               │
│      lineEnd: 52,                                │
│      content: "function calculateTotal..."       │
│    }                                              │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ 3. 生成 System Reminder                            │
│    <system-reminder>                              │
│      <ide_selection>                             │
│        The user selected the lines 45 to 52...   │
│      </ide_selection>                            │
│    </system-reminder>                            │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ 4. 插入到 AI 上下文                                 │
│    system: [                                       │
│      ...其他系统提示...,                          │
│      <system-reminder>...</system-reminder>       │
│    ]                                               │
│    user: "这个函数有什么问题？"                      │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────┐
│ 5. AI Agent 看到完整的上下文                         │
│    知道用户选择了特定代码                            │
│    理解用户想讨论这段代码                            │
│    提供针对性回答：                                  │
│    "我看到您选择了 calculateTotal 函数。这个函数  │
│     存在以下问题..."                               │
└─────────────────────────────────────────────────────┘
```

### 场景 2: 用户修改代码后继续对话

```
用户操作:
1. 修改了 src/components/Header.tsx
2. 继续对话："现在添加主题切换功能"

系统流程:
1. 用户保存文件 → Linter 自动格式化
2. Claude Code 检测到文件变化
3. 生成系统提醒：
   "Note: src/components/Header.tsx was modified..."
4. AI Agent 知道文件已更改
5. Agent 在添加主题切换时：
   ✅ 考虑现有的更改
   ✅ 不覆盖格式化的代码
   ✅ 基于最新状态工作
```

### 场景 3: 用户打开文件并提问

```
用户操作:
1. 在 IDE 中打开 config/database.ts
2. 输入消息："这个配置文件缺少什么？"

系统提醒:
<system-reminder>
File opened in IDE

The user opened the file config/database.ts in the IDE.
This may or may not be related to the current task.
</system-reminder>

AI Agent 反应:
1. 知道用户正在查看数据库配置
2. 优先关注这个文件
3. 读取文件内容
4. 提供针对性的分析
```

---

## 🛠️ 实现细节

### ATTACHMENT_OBJECT 结构

系统提醒使用模板变量，实际运行时由 Claude Code 填充：

```javascript
// 代码选择
{
  filename: string,      // 文件路径
  lineStart: number,     // 起始行号
  lineEnd: number,       // 结束行号
  content: string        // 选中的内容
}

// 文件打开
{
  filename: string       // 文件路径
}

// 文件修改
{
  filename: string,      // 文件路径
  snippet: string,       // 修改内容（带行号）
  modifiedBy: string     // 修改者：user | linter
}

// Agent 提及
{
  agentType: string      // Agent 类型：explore | plan | etc.
}
```

### 提醒插入时机

```javascript
// Claude Code 扩展/CLI 伪代码
class ClaudeCodeExtension {
  onUserSelection(selection) {
    const reminder = this.generateReminder(
      'system-reminder-lines-selected-in-ide.md',
      {
        ATTACHMENT_OBJECT: selection
      }
    );
    this.appendToContext(reminder);
  }

  onFileOpen(filePath) {
    const reminder = this.generateReminder(
      'system-reminder-file-opened-in-ide.md',
      {
        ATTACHMENT_OBJECT: { filename: filePath }
      }
    );
    this.appendToContext(reminder);
  }

  onFileModified(change) {
    const reminder = this.generateReminder(
      'system-reminder-file-modified-by-user-or-linter.md',
      {
        ATTACHMENT_OBJECT: change
      }
    );
    this.appendToContext(reminder);
  }
}
```

### 上下文管理

```
完整的 AI 上下文包含：

1. System 提示词（基础）
   - 角色定义
   - 工具使用规则
   - 行为准则

2. System Reminders（动态）
   - 当前模式状态
   - 用户选择内容
   - 文件变化
   - 诊断问题

3. 对话历史
   - 用户消息
   - AI 响应
   - 工具调用

4. 工具结果
   - 文件内容
   - 命令输出
   - API 响应
```

---

## 📊 效果分析

### 优势

1. **上下文感知**
   ```
   ✅ Agent 知道用户在看什么
   ✅ Agent 知道文件已修改
   ✅ Agent 知道用户选择了特定代码
   ```

2. **减少重复**
   ```
   ✅ 不需要用户说："我选择了这个函数"
   ✅ 不需要用户说："我打开了这个文件"
   ✅ 不需要用户说："我修改了这段代码"
   ```

3. **提高准确性**
   ```
   ✅ Agent 可以精确定位问题
   ✅ Agent 可以基于最新状态工作
   ✅ Agent 可以避免破坏用户更改
   ```

### 注意事项

1. **相关性判断**
   ```markdown
   提醒说明："This may or may not be related to the current task."

   Agent 需要：
   - 判断提醒是否与当前任务相关
   - 相关则使用，不相关则忽略
   - 不过度解释不相关的提醒
   ```

2. **不要告诉用户**
   ```markdown
   某些提醒明确说："Don't tell the user this, since they are already aware."

   例如：
   - 文件被 linter 修改（用户已看到）
   - 文件被格式化（用户已看到）
   ```

3. **避免过度响应**
   ```markdown
   不是每次提醒都需要响应：

   ✅ 用户选择代码 → 如果相关，引用它
   ✅ 文件被修改 → 考虑更改，但不提及
   ❌ 文件被打开 → 不需要特别说明
   ```

---

## 🎓 最佳实践

### 对于 AI Agent

1. **优先使用选择上下文**
   ```
   如果用户选择了代码：
   ✅ 直接讨论选中的代码
   ✅ 假设用户想讨论这部分
   ❌ 不要忽略选择，泛泛而谈
   ```

2. **尊重文件修改**
   ```
   如果文件被修改：
   ✅ 保留用户的更改
   ✅ 基于最新状态工作
   ❌ 不要覆盖用户的修改
   ❌ 不要尝试"修复"格式化
   ```

3. **主动处理诊断**
   ```
   如果有新的诊断问题：
   ✅ 主动修复错误
   ✅ 或者询问是否需要修复
   ❌ 不要忽略诊断警告
   ```

### 对于用户

1. **使用选择来明确上下文**
   ```
   ❌ "src/utils/auth.ts 中的 calculateToken 函数有问题"
   ✅ [选择函数] "这个函数有问题"

   让 Agent 看到您选择的内容，更精确！
   ```

2. **打开相关文件**
   ```
   如果要讨论特定文件：
   ✅ 先在 IDE 中打开它
   ✅ Agent 会知道您关注这个文件
   ```

3. **利用诊断提醒**
   ```
   如果出现诊断问题：
   ✅ Agent 会自动看到
   ✅ 可以直接问："怎么修复这些错误？"
   ```

---

## 🔗 相关机制

### 1. CLAUDE.md 中的 `@` 文件引用语法

除了系统提醒机制外，Claude Code 还支持在 **CLAUDE.md** 文件中使用 `@path/to/file` 语法来引用其他文件。

#### 什么是 `@` 引用语法？

在 CLAUDE.md 文件中，您可以使用 `@path/to/file` 语法引用其他文档文件。Claude 会在需要时自动读取这些文件的内容，而不是一开始就加载所有内容。

#### 与系统提醒的区别

| 特性 | 系统提醒 (`<system-reminder>`) | `@` 文件引用 |
|------|-------------------------------|-------------|
| **使用位置** | AI 对话上下文（自动插入） | CLAUDE.md 文件（手动编写） |
| **触发方式** | 用户在 IDE 中的操作 | 在 CLAUDE.md 中声明 |
| **格式** | XML 标签 | `@path/to/file` |
| **加载时机** | 实时，操作发生时 | 按需，需要信息时 |
| **用途** | 传达用户操作状态 | 组织项目文档 |

#### 使用场景

**适合使用 `@` 引用的情况**：

```markdown
# CLAUDE.md

## API 使用规范

详见 @docs/api-guidelines.md 中定义的 API 调用模式。

## 测试要求

所有测试必须符合 @testing/standards.md 的要求。

## 部署流程

参考 @docs/deployment.md 进行部署。
```

**为什么使用 `@` 引用？**

1. **按需加载（Inline on demand）**
   ```
   Claude 看到: @docs/api-guidelines.md
        ↓
   需要时才读取文件内容
        ↓
   内联到上下文中
   ```

2. **节省 Token**
   ```
   ❌ 不好的做法：
   # CLAUDE.md
   [这里复制 500 行的 API 文档...]

   ✅ 好的做法：
   # CLAUDE.md
   @docs/api-reference.md
   ```

3. **始终使用最新版本**
   - 引用的是文件路径，不是内容副本
   - 文件更新后，Claude 自动读取新版本
   - 不需要手动同步内容

4. **保持 CLAUDE.md 简洁**
   ```
   # CLAUDE.md

   ## 项目规范

   - 编码规范：@docs/coding-standards.md
   - API 参考：@docs/api-reference.md
   - 部署流程：@docs/deployment.md
   - 测试指南：@docs/testing.md
   ```

#### 工作原理

```javascript
// Claude Code 处理 `@` 引用的伪代码
class CLAUDEFileProcessor {
  processCLAUDEM(content) {
    // 查找所有 @ 引用
    const references = content.match(/@([\w\/.-]+\.\w+)/g);

    if (!references) return content;

    // 按需加载
    references.forEach(ref => {
      const filePath = ref.substring(1); // 移除 @

      // 标记为"需要时读取"
      this.markAsLazyLoadable(filePath);
    });

    return content;
  }

  loadReferencedFile(filePath) {
    // 当 Claude 需要这个信息时
    if (this.isReferencedFile(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      this.inlineToContext(content);
    }
  }
}
```

#### 实际示例

**示例 1: 项目文档组织**

```
project/
├── CLAUDE.md                 # 主配置文件
├── docs/
│   ├── api-reference.md      # API 文档
│   ├── coding-standards.md   # 编码规范
│   ├── testing.md            # 测试指南
│   └── deployment.md         # 部署文档
└── src/
```

**CLAUDE.md 内容**：
```markdown
# CLAUDE.md

本项目使用 TypeScript 和 React。

## 文档引用

- API 参考：@docs/api-reference.md
- 编码规范：@docs/coding-standards.md
- 测试指南：@docs/testing.md
- 部署文档：@docs/deployment.md

## 快速开始

1. 阅读 @docs/coding-standards.md 了解编码风格
2. 参考 @docs/api-reference.md 使用 API
3. 按照 @docs/testing.md 编写测试
```

**示例 2: 避免内容重复**

```markdown
# CLAUDE.md

## 常见问题

Q: 如何处理认证？
A: 详见 @docs/auth-guide.md

Q: 如何部署到生产环境？
A: 参考 @docs/deployment.md 的生产环境部分

Q: 测试失败怎么办？
A: 查看 @docs/troubleshooting.md 的测试章节
```

#### 最佳实践

1. **使用相对路径**
   ```
   ✅ @docs/api.md
   ✅ ../shared/standards.md
   ❌ /absolute/path/to/file.md
   ```

2. **避免循环引用**
   ```
   ❌ 文件 A 引用 @docs/B.md
   ❌ 文件 B 又引用 @docs/A.md
   ```

3. **引用真实存在的文件**
   ```
   ✅ @docs/api.md  (文件存在)
   ❌ @docs/missing.md  (文件不存在)
   ```

4. **保持引用文件的可读性**
   ```
   ✅ @docs/api-reference.md  (独立可读的文档)
   ❌ @docs/fragments.md  (只有片段，难以独立理解)
   ```

#### 与其他引用方式对比

| 引用方式 | 使用场景 | 示例 |
|---------|---------|------|
| `@path/to/file` | CLAUDE.md 中引用文档 | `@docs/api.md` |
| IDE 选择 | 对话中引用代码 | 用户在 IDE 中选择 |
| `<ide_selection>` | 系统提醒包装 | XML 标签 |
| 直接路径 | 对话中提及文件 | `src/app.ts` |

### 与其他功能的集成

1. **VSCode 扩展**
   - 实时捕获选择和打开事件
   - 监听文件变化
   - 获取诊断信息

2. **Plan Mode**
   - Plan mode 也有自己的系统提醒
   - 控制规划和执行的转换

3. **MCP (Model Context Protocol)**
   - MCP 资源提醒
   - 服务器提供的外部上下文

4. **Hooks**
   - Hook 执行结果提醒
   - 额外上下文注入

---

## 📚 附录

### A. 完整文件列表

所有系统提醒位于：
`d:\projects\claude-code-system-prompts\system-prompts\system-reminder-*.md`

### B. 版本兼容性

| Claude Code 版本 | 系统提醒数量 | 主要变化 |
|-----------------|------------|---------|
| 2.1.18 | ~40 | 基础系统提醒 |
| 2.1.73 | ~42 | 增强 Plan Mode |
| 2.1.81 | ~43 | 最新版本 |

### C. 相关文档

- [AskUserQuestion 决策框架](ASK_USER_QUESTION_DECISION_FRAMEWORK.md)
- [TodoList 完整文档](TODO_LIST_DOCUMENTATION.md)
- [Plan Mode 指南](#) (待创建)

---

**文档结束**

**创建时间**: 2026-03-25
**基于 Claude Code**: v2.1.81
**维护者**: Claude Code System Prompts Repository
