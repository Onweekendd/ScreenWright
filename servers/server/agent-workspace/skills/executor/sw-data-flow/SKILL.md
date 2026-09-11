---
name: sw-data-flow
description: >
  FunBI 大屏数据流的**细节查询入口**：数据接入、过滤器、回调参数、事件联动这条闭环。
  固定流程（分诊、五个字段的真值、联动五步、接入七步、完成前的强制核查）已常驻在系统提示词里，
  **不需要为了确认它们再调本 skill**。
  什么时候调：要查数据容器请求怎么配、过滤器/绑定的字段级写法、回调链路的源码级依据与完整排错表、
  验证失败后的逐段诊断。触发词示例："有哪些接口 / 数据源"、"这个字段到底叫什么"、
  "配了但没生效，怎么查"。
---

# FunBI 数据流 · 细节索引

> **先确认你真的需要读这里。** 数据流的固定流程已在系统提示词的「BI 领域基本功」里：
> 分诊表、`cbArgs`/`callbackArgs`/`listenArgs`/`callBack`/`openFilter` 五个名字的真值、
> `origin.value` 填什么、过滤器 JS 必须扛住 `callbackArgs` 为空、联动五步、接入七步、
> 完成前的四项强制核查（含 `simulateEvent` 干跑）。
> 那些都不用查。**本 skill 只回答「具体字段怎么写」和「不生效时怎么查」。**

## 按需要读哪一篇

| 你要什么 | 读这篇 |
| --- | --- |
| **回调链路的源码级依据、五个字段的真相来源、完整排错表** | [references/callback-chain.md](references/callback-chain.md) |
| 抛出对象长什么样、哪些组件的 `dataChange` 抛的不是数据项 | 同上，§5 |
| 过滤器的五个执行时机（挂载 / data 变化 / autoRefresh / 回调 / 外部） | 同上，§6 |
| 核心概念与工作区文件路径 | [references/concepts.md](references/concepts.md) |
| 查可用 API 接口、配置数据容器请求 | [references/configure-container.md](references/configure-container.md) |
| 创建过滤器与回调参数的字段级写法 | [references/create-filter.md](references/create-filter.md) |
| 目标组件绑定的字段级写法 | [references/bind-target.md](references/bind-target.md) |
| 干跑或运行时验证没过，逐段诊断 | [references/verify-flow.md](references/verify-flow.md) |
| 目标组件期望的 `dataChart` 数据格式 | `sw-component-schema` 的 `references/components/<族>/<prop>.md` |

## 工具速查

| 工具 | 用途 |
|------|------|
| `read_file` | 读组件 JSON、过滤器 JSON/JS、api-registry |
| `edit_files` | 改组件 JSON（路径含 `/component/` 时自动推送前端） |
| `write_file` | 新建过滤器 JS 与 JSON |
| `create_component` | 创建数据容器组件并推送画布 |
| `create_data_filter` | 创建过滤器（写 JSON + JS 并自动推送） |
| `createEventTemplate` | 建事件；`insertTo` 一步写入并推送 |
| `listAvailableEvents` | 查源组件支持哪些 trigger |

## `_callback_flows/{argName}.json` 怎么读

每次大屏同步后自动生成，一个回调参数名一个文件，描述谁在哪些事件上抛出它、哪些过滤器消费它。
验证时用刚配的 `cbArgs[].value.target.value` 作为 argName 直接读：

- `emittedBy[n].onEvents` 为空数组 → 该组件事件没配，回调永远不会触发
- `consumedBy` 为空 → 下游过滤器的 `callBack` 没声明这个参数名，是真实配置错误
