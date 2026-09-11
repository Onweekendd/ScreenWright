这份文档总结了我们将 AI Agent 集成到低代码编辑器中的核心架构思路，旨在解决**“工具爆炸”**和**“上下文过载”**问题，并利用 **Mastra Workspace** 的能力实现高效的人机协作。

---

## AI Agent 集成低代码编辑器：基于 Workspace 的声明式架构方案

### 1. 核心架构设计：前端中枢模式 (Frontend-as-a-Hub)
为了简化链路并保证实时性，采用“前端驱动”的数据流向，避免 Java 后端与 AI 逻辑深度耦合。

* **Java 后端：** 担任“冷存储”角色。仅负责 Schema 的持久化、版本管理及权限校验。
* **前端编辑器 (Tauri/Web)：** 担任“状态中枢”角色。持有当前页面的真理来源 (Source of Truth)，并负责与 Node 服务同步增量修改。
* **Node 服务 (Mastra Agent)：** 担任“大脑”角色。通过虚拟文件系统将 Schema 映射为 Workspace，供 Agent 协作。



---

### 2. 状态同步机制：Schema 文件化 (File-based Metadata)
放弃全量 JSON 传输，转而使用**内存虚拟文件系统 (VFS)** 将大屏组件结构化。

#### 目录结构示例
在 Node 端的内存中，Agent 看到的 Workspace 结构如下：
* `/workspace/global/theme.json`：全局样式、变量。
* `/workspace/data/sources.json`：数据源与接口配置。
* `/workspace/components/`：每个组件对应一个独立 JSON 文件（如 `comp_123.json`）。

#### 同步逻辑
1.  **初始化：** 编辑器加载时，前端将全量 Schema 推送至 Node，Node 动态拆解并写入内存文件系统。
2.  **双向更新：** * **人改：** 用户在画布操作，前端发送 `patch` 命令给 Node，同步更新对应文件。
    * **机改：** Agent 通过 Skill 修改文件，Node 触发事件通知前端重新渲染特定组件。

---

### 3. Agent 能力设计：从“原子工具”到“通用 Skill”
通过 **Mastra Skill** 封装文件操作，彻底解决 Tool 数量爆炸的问题。

| Skill 名称 | 功能描述 | 核心逻辑 |
| :--- | :--- | :--- |
| **`inspect_component`** | 查看组件细节 | 读取指定路径的 JSON 文件，提供上下文。 |
| **`patch_component`** | 局部更新组件 | 接受 `partial_json`，使用 `merge` 算法更新属性。 |
| **`search_metadata`** | 语义搜索组件 | 在所有 JSON 文件中根据描述查找目标组件路径。 |
| **`add_component`** | 新增组件文件 | 创建新 JSON 文件并更新页面树状引用关系。 |

---

### 4. 稳定性与安全保障 (Guardrails)
为防止 Agent “写错”或产生“幻觉”，引入三层防御：

* **Schema 强校验：** 在 `patch_component` 执行前，利用 JSON Schema 对 Agent 产出的内容进行合法性检查，格式错误直接拦截并要求重写。
* **局部锁定机制：** 当 Agent 正在处理某个组件文件时，前端 UI 暂时锁定该组件的属性面板，防止人机操作冲突。
* **差异化预览 (Diff)：** Agent 完成修改后，前端展示“修改建议”对比视图（类似 Git Diff），由用户确认后再最终合并入主分支。

---

### 5. 方案优势总结
1.  **极致扩展性：** 无论组件库如何增加，Agent 的 Tool 始终只有几个通用的文件操作接口。
2.  **Token 友好：** 通过文件拆分，Agent 每次只需读写几百行的局部配置，而非万行级别的大屏全量代码。
3.  **开发体验：** 符合 AI Coding 的直觉，调试 Agent 就像在调试一个自动写代码的程序员。

---

### 下一步行动建议
1.  **PoC 开发：** 在 Node 端引入 `memfs` 库，尝试将一段简单的大屏 JSON 拆解为目录结构。
2.  **Mastra 接入：** 定义一个基础的 `Workspace` 实例，测试 Agent 是否能准确通过 `readFile` 找到特定组件。
3.  **Tauri 通讯：** 实现前端与 Node 之间的 WebSocket 增量同步协议。

**您需要我为您起草一份 Node 端“Schema 拆解与合并”的核心代码原型吗？**