# ComponentSchema - 身份、布局与基础配置字段

> Source: `packages/type/src/schemas/component.ts` → `ComponentFlatSchema`

## 目录
1. [核心标识字段](#1-核心标识字段)
2. [布局定位字段](#2-布局定位字段)
3. [component 子对象](#3-component-子对象)
4. [option 字段](#4-option-字段)
5. [可见性与状态字段](#5-可见性与状态字段)

---

## 1. 核心标识字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | `number` | ✅ | 组件唯一 ID（数字型），由平台自动分配 |
| `name` | `string` | ✅ | 组件实例名称，用于画布图层列表显示 |
| `title` | `string` | ✅ | 组件标题，通常与组件类型名相同 |
| `img` | `string` | ✅ | 组件缩略图 URL，用于物料库展示 |

---

## 2. 布局定位字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `left` | `number` | ✅ | 组件距画布左侧的距离；**单位由 `unitPavenType` 决定**（默认像素，percent 时为百分比） |
| `top` | `number` | ✅ | 组件距画布顶部的距离；**单位由 `unitPavenType` 决定**（默认像素，percent 时为百分比） |
| `zIndex` | `number` | ✅ | Z 轴层级，数值越大越靠前 |
| `isLock` | `boolean?` | ❌ | 是否锁定（锁定后无法在画布拖拽移动） |
| `unitPavenType` | `"percent"?` | ❌ | 尺寸/定位单位。缺省=像素；设为 `"percent"` 时 `left`/`top` 与 `component.width`/`height` 全部是**百分比**（相对大屏/父容器），不是像素。详见下方 ⚠️ |

> ⚠️ **判断组件大小/是否铺满前，必须先看 `unitPavenType`。**
> 当 `unitPavenType: "percent"` 时，`component.width: 100, height: 100` 表示 **100% × 100%，即铺满整个屏幕**，而不是 100×100px 的小窗。
> 常见误判：把 percent 单位的全屏背景（如 3D 场景 `threescene`、地图 `map`）按像素读成"角落小窗"。百分比要先按大屏宽高换算成像素再判断；铺满全屏的组件应识别为**背景层/主视觉**，而非小窗角标。

---

## 3. component 子对象

`component` 字段存储组件的**类型声明与尺寸**，是每个组件的核心元数据：

```ts
component: {
  prop: string,   // 组件类型标识（allComponentTypeSchema 枚举值），如 "v-text"、"v-bar"
  width: number,  // 组件宽度（像素）
  height: number, // 组件高度（像素）
  name: string    // 组件类型显示名称，如 "文本"、"柱状图"
}
```

**关键点：**
- `prop` 是组件类型的唯一标识符，决定渲染哪个 Vue 组件
- `component.name` 是类型名（如"柱状图"），`name`（顶层）是实例名（如"销售柱状图"）
- `width`/`height` 控制组件在画布上的尺寸

---

## 4. option 字段

```ts
option: any  // 组件专属配置，每种组件类型的 option 结构完全不同
```

**说明：**
- `option` 存储各组件类型特有的配置（颜色、字体、图表样式等）
- 类型为 `any`，需结合具体组件类型的 option schema 使用
- 每个组件类型都有对应的 `xxxOptionSchema`（如 `BarOptionSchema`、`TextOptionSchema`）

---

## 5. 可见性与状态字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `display` | `boolean` | ✅ | 是否在画布上显示（控制 CSS display） |
| `group` | `boolean?` | ❌ | 是否为分组容器组件 |
| `selected` | `boolean?` | ❌ | 是否被选中（画布交互状态，非持久化） |
| `activeStatusId` | `string \| null?` | ❌ | 当前激活的动态面板状态 ID，用于动态面板组件 |
