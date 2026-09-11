# vue-part 文件结构（必读）

vue-part（"vue2 片段" / 自定义代码组件，`component.prop = "vue-part"`）在工作区**拆成两个文件**：

文件名为 `{id}_{name}` 形式（name 为空时退回组件类型，vue-part 形如 `123_自定义卡片`）：

| 文件               | 内容                                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `{id}_{name}.json` | 组件**属性**：位置、尺寸、绑定数据、事件等。其中 `option.template` / `option.js` / `option.css` 三个字段是**指向 .vue 的指针**（值就是文件名 `"{id}_{name}.vue"`），**不是可编辑内容**。 |
| `{id}_{name}.vue`  | 真实的**模板 / 脚本 / 样式**，标准 SFC：`<template>` + `<script>`（含 `generate(info)` 工厂函数）+ `<style>`。                                                                           |

路径：`screen_{screenId}_{versionCode}/component/{id}_{name}.{json,vue}`；嵌套组件同分组/动态面板规则（`.../{groupId}_{groupName}/{id}_{name}.*`、`.../{panelId}_{panelName}/{stateId}_{stateName}/{id}_{name}.*`）。

## 铁律

1. 改**模板 / 脚本 / 样式** → 改 `.vue`，**绝不去 `.json` 里改 `option.template/js/css` 指针**（改指针无意义且会破坏组件）。
2. 改**其他属性**（数据、位置、尺寸、事件……）→ 改 `.json`。
3. `.vue` 的 `<script>` 顶部有一段带 `@__vp_types__` 的 JSDoc、文件末尾有一行带 `@__vp_anchor__` 的 `export default generate(...)` —— 那是给类型检查用的**锚点**，**不要删、不要改**，照常编辑 `generate` 函数体即可。回推时系统会自动剥除它们，不会进入后端。

## generate(info) 约定

`.vue` 的 `<script>` 是一个 `function generate(info) { ... return <组件选项对象> }` 工厂。运行时由 funBI 注入真实 `info` 并调用它：

| `info` 字段                | 说明                                                                                                                                                                                          |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | 组件 id                                                                                                                                                                                       |
| `list`                     | 绑定数据（来自组件 dataSource）                                                                                                                                                               |
| `emitEvent(name, payload)` | 触发交互事件，事件名固定为 `fireCustomCode_${id}`                                                                                                                                             |
| `defaultFun`               | 内置工具：`{ cloneDeep, debounce, throttle, axios, setMinioUrl, html2canvas, ElMessage, ElLoading }`（深拷贝/防抖/节流、axios 实例、minio 地址拼接、截图、Element Plus 的消息提示与 Loading） |

返回的组件选项对象遵循 Vue 2 Options API（`name` / `data()` / `computed` / `watch` / `methods` / 生命周期等）。模板里可直接使用全局注册的 **Element Plus** 组件（`el-button` / `el-table` 等），无需 import/注册。
