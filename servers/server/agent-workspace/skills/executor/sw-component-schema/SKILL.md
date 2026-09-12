---
name: sw-component-schema
description: FunBI 低代码大屏平台 ComponentSchema 字段说明与参考指南。当需要了解组件数据结构、读写组件字段、构造/修改组件 JSON、理解组件树结构、处理 agentBI 工具中的组件参数时使用此 skill。所有低代码组件共享 ComponentSchema 作为基础结构，每种组件类型在此基础上通过 option 字段扩展专属配置。触发场景：(1) 询问组件字段含义，(2) 构造或修改组件配置 JSON，(3) 理解 events/actions/conditions 结构，(4) 处理数据源、过滤器、子组件等配置，(5) 调用 agentBI 工具时需要填写组件参数
---

# FunBI ComponentSchema 参考指南

## Schema 概览

所有大屏组件共用 `ComponentSchema`，定义在：
`packages/type/src/schemas/component.ts`

**两个核心变体：**

- `ComponentSchema` — 递归版（含嵌套组件对象），用于运行时读取组件树
- `ComponentFlatSchema` — 扁平版（children/panelData 简化为 ID 列表），**agentBI 工具传参时用此版本**

## 字段分组速查

| 分组                 | 包含字段                                                                                                                                                    | 参考文件                                                              |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 身份/布局/基础配置   | `id` `name` `title` `img` `left` `top` `zIndex` `display` `isLock` `component` `option` `group` `selected` `activeStatusId` `unitPavenType`                 | [component-base-identity.md](references/component-base-identity.md)   |
| 数据源与数据配置     | `data` `dataType` `dataSource` `dataRemark` `dataQuery` `url` `path` `listenArgs` `cbArgs` `openFilter` | [component-base-data.md](references/component-base-data.md)           |
| 事件/动作/条件       | `events` `encodes`                                                                                                                                          | [component-base-events.md](references/component-base-events.md)       |
| 子组件/层级/父子关系 | `children` `presetChild` `panelData` `parent` `parentDynamicPanelId` `parentEncodeId`                                                                       | [component-base-hierarchy.md](references/component-base-hierarchy.md) |
| 动画/Minio           | `loadAnimation` `minioArr`                                                                                                                                  | [component-base-features.md](references/component-base-features.md)   |

## 何时读哪个文件

- **构造/修改组件位置、尺寸、显隐** → 读 `component-base-identity.md`
- **配置组件数据来源（SQL/API/静态）** → 读 `component-base-data.md`
- **添加/理解事件联动（点击触发显隐等）** → 读 `component-base-events.md`（也可同时参考 `sw-event-interaction` skill）
- **处理分组、动态面板、嵌套组件** → 读 `component-base-hierarchy.md`
- **配置进入动画、Minio 资源文件** → 读 `component-base-features.md`

## 组件类型索引

所有组件按类型分组，详细列表在各类型的 index.md 中。

| 组件类型   | 中文名      | 组件数量 | 参考索引                                               |
| ---------- | ----------- | -------- | ------------------------------------------------------ |
| 图表组件   | echart      | 32       | [index.md](references/components/echart/index.md)      |
| 文字组件   | text        | 11       | [index.md](references/components/text/index.md)        |
| 媒体组件   | media       | 9        | [index.md](references/components/media/index.md)       |
| 指标组件   | indicator   | 14       | [index.md](references/components/indicator/index.md)   |
| 交互组件   | interactive | 21       | [index.md](references/components/interactive/index.md) |
| 扩展组件   | extends     | 15       | [index.md](references/components/extends/index.md)     |
| 系统组件   | system      | 3        | [index.md](references/components/system/index.md)      |
| 第三方组件 | third-party | 4        | [index.md](references/components/third-party/index.md) |

## 关键约定

1. **组件引用格式**：事件 `actions` 中的 `component` 字段使用 `"$component(数字ID)"` 格式
2. **option 字段**：每种组件类型有专属 option schema，`ComponentSchema` 中为 `any`，需结合具体组件类型文档
3. **ID 类型**：顶层组件 `id` 为 `number`；`ChildComponentSchema`（presetChild）中 `id` 为 `string`
4. **工具传参**：使用 `ComponentFlatSchema`，避免递归类型导致的 schema 问题
