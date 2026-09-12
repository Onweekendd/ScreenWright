# ComponentSchema - 子组件、层级与父子关系字段

> Source: `packages/type/src/schemas/component.ts`

## 目录
1. [children - 子组件列表](#1-children---子组件列表)
2. [presetChild - 预设子组件](#2-presetchild---预设子组件)
3. [panelData - 动态面板状态](#3-paneldata---动态面板状态)
4. [父子关系字段](#4-父子关系字段)
5. [ComponentSchema vs ComponentFlatSchema](#5-componentschema-vs-componentflatschema)
6. [ChildComponentSchema - 轻量子组件](#6-childcomponentschema---轻量子组件)

---

## 1. children - 子组件列表

```ts
// ComponentSchema (递归版) 中:
children?: Array<ComponentSchema | string | number>

// ComponentFlatSchema (扁平版) 中:
children?: string[]  // 仅存 ID 列表
```

**说明：**
- `children` 用于分组组件（`group: true`）或容器类组件
- 运行时可能是完整 `ComponentSchema` 对象或组件 ID（字符串/数字）
- 向工具传参时使用 `ComponentFlatSchema`（`children` 为 `string[]`），避免递归类型问题

---

## 2. presetChild - 预设子组件

```ts
presetChild?: ChildComponentSchema[]  // 子组件完整对象列表
```

**与 children 的区别：**
- `children` 是分组容器的子组件（顶层组件的嵌套）
- `presetChild` 是组件内部内置的子配置单元（如轮播图的每一帧、Tab 的每个页签）
- `presetChild` 使用 `ChildComponentSchema`（见第6节）

---

## 3. panelData - 动态面板状态

动态面板组件（`prop: "v-dynamic-panel"` 等）专用字段：

```ts
panelData?: PanelStateSchema[]

// PanelStateSchema:
{
  id: string,                  // 状态唯一 ID
  title: string,               // 状态显示标题
  name: string,                // 状态名称
  config: Array<ComponentSchema | string | number>,  // 该状态下的组件列表
  backgroundColor: string,     // 背景颜色
  showBackgroundImage: boolean, // 是否显示背景图片
  backgroundImage: string,     // 背景图片 URL
  showScreenAdaptation: boolean, // 是否显示屏幕适配
  adaptationNorm: string,      // 屏幕适配规范
  adaptationType: number,      // 适配类型
  minioIds?: Array<number | null>  // 关联资源 ID 列表
}
```

**与 activeStatusId 配合使用：**
- `panelData` 定义所有状态
- `activeStatusId` 记录当前显示哪个状态（对应 `PanelState.id`）
- 通过事件动作 `"switchPanelStatus"` 切换状态

---

## 4. 父子关系字段

| 字段 | 类型 | 说明 |
|------|------|------|
| `parent` | `number?` | 父组件 ID（该组件是某分组/容器的子元素时设置） |
| `parentDynamicPanelId` | `number[]?` | 所有祖先动态面板的 ID 列表（嵌套场景下可能有多层） |
| `parentEncodeId` | `string?` | 父级加密组件 ID |

**层级关系说明：**
- 顶层组件：`parent` 为空
- 分组内子组件：`parent` 指向分组组件 `id`，分组组件的 `children` 包含该子组件 `id`
- 动态面板内组件：`parentDynamicPanelId` 记录所有外层动态面板的 `id`

---

## 5. ComponentSchema vs ComponentFlatSchema

| | `ComponentFlatSchema` | `ComponentSchema` |
|---|---|---|
| 用途 | 工具入参、API 传参 | 完整运行时数据 |
| `children` 类型 | `string[]`（仅 ID） | `Array<ComponentSchema \| string \| number>` |
| `panelData` 类型 | `string[]` | `PanelStateSchema[]` |
| 递归 | 无 | 有（`z.lazy()`）|
| 推荐场景 | agentBI 工具调用 | 读取组件树状态 |

---

## 6. ChildComponentSchema - 轻量子组件

`presetChild` 数组中每项的 Schema，比 `ComponentSchema` 轻量，额外包含数据请求配置：

```ts
ChildComponentSchema = {
  id: string,              // 子组件 ID（字符串，非数字）
  isEdit: boolean,
  show: boolean,
  showOperation: boolean,
  type: string,            // 子组件类型标识
  // 数据请求配置（子组件独立请求数据）
  dataMethod: "get" | "post" | "put" | "delete",
  dataType: number,
  requestHeader: Record<string, any>,
  requestBody: Record<string, any>,
  crossOrigin: boolean,
  needCookie: boolean,
  autoRefresh: boolean,
  sql: string,
  // 布局字段（同 ComponentSchema）
  component: { prop, width, height, name },
  option: any,
  name, left, top, isLock, zIndex, display, data, img, title,
  listenArgs, cbArgs?, openFilter, dataSource, dataRemark, events,
  encodes?, url?, path?, dataQuery?,
  loadAnimation, presetChild?, minioArr?,
  enableDataAnalysis?, dataAnalysisName?
  // + catchall: 允许任意扩展字段
}
```
