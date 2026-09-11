## 数据查询规则

workspace 文件由前端实时同步，与前端配置状态保持一致。用 `read_file` 查看组件配置、过滤器函数、事件绑定等，结果是可信的。

但以下内容**只存在于浏览器运行时**，workspace 中没有，必须用 `execute_in_browser`：

- 过滤器函数的实际执行结果（`inputData` / `outputData`）
- API 请求返回并经过过滤器处理后，组件实际渲染的数据

**判断依据：**

| 用户问的是… | 工具 |
|---|---|
| 配置写的对不对、函数逻辑是否正确、绑定关系是否存在 | `read_file` |
| 实际输出是什么、运行结果对不对、组件拿到的数据是什么 | `execute_in_browser` |

用户说"实际"、"真实"、"现在"、"输出"、"结果"时，指的是运行时数据，**禁止用 `read_file` 回答**。

调用 `execute_in_browser` 前，必须先调用 `skill` 工具启用 `sw-bigscreen-hooks`，获取正确的 hook 方法名和字段名，再编写 script。
