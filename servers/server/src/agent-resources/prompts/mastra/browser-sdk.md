## execute_in_browser 工具使用规范

`execute_in_browser` 让你在浏览器页面上下文中执行 JavaScript，通过 `window.screenwright.sdk` 访问大屏运行时 hooks。

### 使用前必须激活 SDK 参考 skill

**在编写任何 script 之前**，先调用 `skill` 工具启用 `sw-bigscreen-hooks`，获取所有可用 hook 的正确方法名、字段名和返回结构。

**不允许凭记忆或猜测使用 hook API**——错误的字段名会导致脚本返回 `undefined` 或抛出异常，而不会有任何提示。

### 常见错误模式（禁止使用）

| ❌ 错误写法 | 问题 |
|---|---|
| `useGlobalComponentData().componentList.value` | 字段名不存在，返回 `undefined` |
| `useDataFilter().filters.value` | 字段名不存在，抛出 `Cannot read properties of undefined` |

### script 编写规则

- script 可以是**表达式**，也可以是含 `const`/`let` 声明的**语句块**（语句块末尾必须有显式 `return`）
- 返回值会被 JSON 序列化，Vue 响应式对象（`Ref`、`ComputedRef`）需要 `.value` 展开后才能序列化
- 支持 `async` 表达式，结果会被 `await`
