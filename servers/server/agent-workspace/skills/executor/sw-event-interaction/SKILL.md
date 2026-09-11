---
name: sw-event-interaction
description: >
  FunBI 事件驱动 **UI 动作**（显隐、动画、移动、缩放、切面板状态、跳页、视频控制、场景与 UE4 消息）
  的**细节查询入口**。
  分诊（数据变不变）、`createEventTemplate` 的 `insertTo` 用法、不要预览 template 的反模式、
  simulateEvent 干跑验证——这些固定内容已常驻在系统提示词里，**不需要为了确认它们再调本 skill**。
  什么时候调：要查 Event/Action/Condition 的数据结构、某个 action 的配置字段、条件怎么写、
  多目标/多条件的组织方式、删改已有事件的做法。
---

# FunBI 事件交互 · 细节索引

> **先确认你真的需要读这里。** 系统提示词的「BI 领域基本功」已经讲了：
> 怎么分诊（目标组件的数据变不变 → 变则走 `sw-data-flow`）、
> 用 `createEventTemplate` 的 `insertTo` 一步创建+写入+推送、
> 不要先调 `createActionTemplate` 预览再喂进去这个反模式、
> 多组件时 `actionType` 只支持 `show`/`hide`/`showHide`、
> `componentScope` 由工具自动填、条件不满足时回调照抛、
> 以及 `simulateEvent` 干跑怎么跑怎么判。**那些都不用查。**

## 按需要读哪一篇

| 你要什么 | 读这篇 |
| --- | --- |
| Event / Action / Condition 的字段结构 | [references/data-structure.md](references/data-structure.md) |
| 条件怎么写、事件的数据来源 | [references/condition-guide.md](references/condition-guide.md) |
| 某个 action 类型有哪些配置参数 | [references/action-config-map.md](references/action-config-map.md) |
| 源组件支持哪些 trigger / 目标组件支持哪些 action | 直接调 `listAvailableEvents` / `listAvailableActions`，别翻文档 |
| 目标组件的数据要跟着变 | **不在这里**，走 `sw-data-flow` |

## 定位源组件

组件 JSON 在 `screen_{screenId}_{versionCode}/component/{componentId}_{name}.json`，
`events` 数组是事件列表，`component.prop` 是组件标识。

想快速看某组件已有哪些事件，读 `_event_flows/{componentId}.json`——直接给出
trigger / conditions / targets，比解析整个组件 JSON 快得多。

## 多场景怎么组织

| 场景 | 操作策略 |
| --- | --- |
| 一个触发 → 一个目标 | `createEventTemplate({ actions: [{ componentId: [id], actionType }], insertTo })` 一次到位 |
| 一个触发 → 多目标（同行为） | 一个 action，`componentId` 传多个 ID |
| 一个触发 → 多目标（不同行为） | 一个事件，`actions[]` 里放多个 `{ componentId, actionType }` |
| 不同条件下不同行为 | 多次 `createEventTemplate`，各带自己的条件与行为，各自 `insertTo` |
| 向已有事件追加 action | 读组件文件 → `createActionTemplate(...)` → `edit_files` 写回 |
| 修改已有事件 / 行为 | 读组件文件 → 按 `id` 找到 → 改字段 → `edit_files` 写回 |
| 删除事件 / 行为 / 条件 | 读组件文件 → 从对应数组 filter 掉该 `id` → `edit_files` 写回 |
| 多个源组件各自触发 | 每个源组件的 JSON 独立读写 |

> 只有上表后三行（改 / 删 / 追加）才需要 `edit_files`。走 `insertTo` 新建时，
> 工具已经做完 Zod 校验和前端推送。

## 干跑输出怎么逐段看

`simulateEvent` 工具的回执按「事件 → 动作 → 回调参数」三段输出（`summary` 是人话版，`events`/`actions`/`callbacks` 是结构化版）：

- 「事件」段说没有该 trigger 的事件 → `trigger` 类型配错了
- 「事件」段说条件不满足 → 检查条件的字段名 / compare / expected 与实际数据是否匹配
- 目标组件出现在「动作」段 → 事件配置正确 ✅
- 配了回调参数但「回调参数」段说没有组件监听 → 消费方 `listenArgs.callbackFields` 与源组件
  `cbArgs` 的 target 对不上（细节见 `sw-data-flow` 的 `references/callback-chain.md`）
- 「回调参数」段有输出但条数不对 → 过滤器 `dataFormatter` 的逻辑问题，不是事件配置问题

动作在 Node 里不真执行（没有 DOM），显隐 / 动画 / 跳转只报告"会被触发"。
