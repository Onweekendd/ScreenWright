# useGlobalComponentData

## 作用

全局组件树的单一数据源。维护大屏所有组件的扁平列表与多种 Map 索引，支持按类型（普通组件、encode 面板、动态 panel 子组件）快速查询。

## 文件路径

`apps/app/src/views/build/useGlobalComponentData.ts`

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `groupData` | `Ref<Component[]>` | 所有组件的原始数组 |
| `globalComponentMap` | `ComputedRef<Map<id, Component>>` | 排除 encode panel 后的组件 Map |
| `encodeComponentMap` | `ComputedRef<Map<id, Component>>` | 仅 encode panel 的 Map |
| `allComponentMap` | `ComputedRef<Map<id, Component>>` | 所有组件（含 encode）的合并 Map |
| `panelChildComponentMap` | `ComputedRef<Map<panelId, Component[]>>` | 动态 panel 的子组件列表 Map |
| `panelChildComponentMapByStatus` | `ComputedRef<Map<panelId_status, Component[]>>` | 按 panel+状态分组的子组件 Map |
| `setGroupData(detailInfo)` | `Function` | 从 detailInfo 初始化所有组件 |
| `resetGroupData()` | `Function` | 清空所有组件数据 |
| `findTargetDynamicPanel({data, parentIds})` | `Function` | 递归查找指定 ID 路径的动态 panel |

## 核心使用场景

- **获取全部组件**：通过 `groupData` 遍历所有组件
- **按 ID 查找组件**：`allComponentMap.value.get(componentId)`
- **获取 panel 子组件**：`panelChildComponentMap.value.get(panelId)`
- **区分 encode 组件**：用 `encodeComponentMap` 单独处理终端类组件
- **初始化**：由 `useInitLargeScreenData` 在启动时调用 `setGroupData`

## 基本实现示例

```typescript
const {
  groupData,
  allComponentMap,
  panelChildComponentMap
} = useGlobalComponentData()

// 按 ID 查找组件
const target = allComponentMap.value.get(123)

// 获取某个动态 panel 的所有子组件
const children = panelChildComponentMap.value.get(panelId) ?? []

// 遍历全部组件
groupData.value.forEach(comp => { /* ... */ })
```

## 注意事项

- 使用 `createGlobalState`，全局单例
- `globalComponentMap` 不含 encode panel，用于普通组件的 ID 查找
- `panelChildComponentMapByStatus` 的 key 格式为 `"${panelId}_${statusId}"`
