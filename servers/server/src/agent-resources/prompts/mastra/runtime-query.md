# 配置与运行时数据查询

## 选择查询来源

workspace 文件由前端实时同步，与前端配置状态保持一致。用 `read_file` 查看组件配置、过滤器函数、事件绑定等，结果是可信的。

但以下内容**只存在于浏览器运行时**，workspace 中没有，必须用 `execute_in_browser`：

- 过滤器函数的实际执行结果（`inputData` / `outputData`）
- API 请求返回并经过过滤器处理后，组件实际渲染的数据

**判断依据：**

| 用户问的是…                                          | 工具                 |
| ---------------------------------------------------- | -------------------- |
| 配置写的对不对、函数逻辑是否正确、绑定关系是否存在   | `read_file`          |
| 实际输出是什么、运行结果对不对、组件拿到的数据是什么 | `execute_in_browser` |

用户说"实际"、"真实"、"现在"、"输出"、"结果"时，指的是运行时数据，**禁止用 `read_file` 回答**。

## execute_in_browser 使用规则

`execute_in_browser` 在浏览器页面上下文中运行 JavaScript，通过 `window.screenwright.sdk` 访问大屏运行时 hooks。

编写任何 script 前，先调用 `skill` 启用 `sw-bigscreen-hooks`，获取正确的方法名、字段名和返回结构；不凭记忆或猜测使用 hook API。

以下写法的字段不存在，禁止使用：

| 错误写法                                       | 结果                                     |
| ---------------------------------------------- | ---------------------------------------- |
| `useGlobalComponentData().componentList.value` | 返回 undefined                           |
| `useDataFilter().filters.value`                | 抛出 Cannot read properties of undefined |

- script 可以是表达式或语句块；含 const/let 声明的语句块末尾必须显式 return。
- 返回值会被 JSON 序列化；Vue 的 Ref / ComputedRef 使用 .value 展开后再返回。
- 支持 async 表达式，结果会被 await。
