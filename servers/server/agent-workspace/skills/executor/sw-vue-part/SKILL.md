---
name: sw-vue-part
description: FunBI vue2 片段（vue-part / 自定义代码组件，prop = "vue-part"）的编辑指南，供 agentBI 修改这类组件时使用。触发场景：(1) 修改 vue2 片段的模板/脚本/样式（HTML 模板、generate 函数、CSS），(2) 修改 vue-part 组件的属性或数据（位置、尺寸、绑定数据、事件），(3) 不清楚 vue-part 的 .vue 与 .json 该改哪个、改完如何生效时。
---

# FunBI vue2 片段（vue-part）编辑

vue-part 在工作区被**拆成两个文件**存储，改哪个取决于改什么。动手前先读 [concepts.md](references/concepts.md) 建立结构认知（含 .vue/.json 分工、option 指针、类型锚点、generate 约定），再按下表操作。

## 操作目录

| 要修改的内容 | 改哪个文件 | 参考文件 |
| --- | --- | --- |
| 模板 / 脚本(generate) / 样式 | `{id}.vue` | [edit-content.md](references/edit-content.md) |
| 数据 / 位置 / 尺寸 / 事件 等属性 | `{id}.json` | [edit-props.md](references/edit-props.md) |

> **两类修改 `edit_files` 都会自动合并并推送到前端，无需手动调用推送工具。**
> - 改 `.vue`：工具拆解 SFC、剥除类型锚点还原 `generate` 工厂、合并回 `{id}.json` 的 `option`，再推送完整组件。
> - 改 `.json`：走组件 schema 校验后推送。
>
> 遇到对应操作时，读取对应参考文件后再执行。
