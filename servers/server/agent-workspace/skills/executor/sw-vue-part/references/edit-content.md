# 修改 vue2 片段的模板 / 脚本 / 样式

修改 vue-part 的模板、`generate` 脚本或样式时，改 **`.vue`** 文件。先读 [concepts.md](concepts.md) 了解结构与锚点规则。

定位文件：`screen_{screenId}_{versionCode}/component/{id}.vue`。

## 流程

1. **`read_file`** 读取 `.vue`（`edit_files` 要求先读，否则拒绝）。
2. **`edit_files`** 修改对应区块：
   - 模板 → `<template>` 内
   - 脚本 → `<script>` 里的 `generate` 函数体（编辑脚本前**必读** [edit-content-script.md](edit-content-script.md)：`info` 字段、`emitEvent` 通信、`screenwright.sdk` 用法）
   - 样式 → `<style>` 内
3. 保存后系统**自动**：拆解 SFC → 剥除类型锚点还原 `generate(info)` 工厂 → 合并回 `{id}.json` 的 `option` → 推送完整组件到前端。**无需手动推送。**

## 模板里可直接用 Element Plus 组件

vue-part 运行时已通过 `app.use(ElementPlus)` **全局注册了 Element Plus**，所以 `<template>` 里可以**直接写** `el-button` / `el-table` / `el-select` / `el-input` / `el-dialog` 等 Element Plus 组件，**无需 import、无需局部注册**。

- 注意是 **Element Plus**（标签前缀 `el-`），不是 element-ui，组件用法以 Element Plus 文档为准。
- 命令式 API（消息提示、Loading）走 `info.defaultFun` 里的 `ElMessage` / `ElLoading`（见 [concepts.md](concepts.md) 的 `defaultFun` 字段），不要再额外 import。

## 规则

- 只改 `<template>` / `generate` 函数体 / `<style>` 里的真实代码。
- **不要动**带 `@__vp_types__` 的 JSDoc 块、末尾带 `@__vp_anchor__` 的 `export default generate(...)` 行（类型锚点，系统自动维护）。
- `generate` 必须保持 `function generate(info) { ... }` 形式；改成箭头函数 / 改名会失去类型提示。
- `info` 的可用字段见 [concepts.md](concepts.md)。

## 类型检查（必须）

每次用 `edit_files` 修改 `.vue` 后，**必须**调用 `execute_command` 跑类型检查，确认 `generate` 的 `info` 用法与返回结构无误：

```
execute_command({
  command: "pnpm check-vue-part <.vue 的 workspace 相对路径>",
  timeout: 120,
  background: false
})
# 例：command = "pnpm check-vue-part screen_30386_1/component/3196778.vue"
```

- 路径用 **workspace 相对路径**（与 `read_file` / `edit_files` 一致）；`execute_command` 默认在 workspace 根执行。
- 退出码 `0` = 通过。非 0、或输出含 `error TSxxxx`（带行号）= 有类型错误。
- 有错时：按报错用 `edit_files` 修正 `.vue` → 再跑 `check-vue-part`，「改 → 检查」循环**最多 3 次**。
- **通过的唯一依据是 `check-vue-part` 退出码 0**；不要把"没跑"或工具自身报错当成通过。

`execute_command` 参数类型（常见踩坑）：`command` 为 string；`timeout` 为 number（秒，如 `120`，不是 `"120"`）；`background` 为 boolean（`false`，不是 `"false"`）。
