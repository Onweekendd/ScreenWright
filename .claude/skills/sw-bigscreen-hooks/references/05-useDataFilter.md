# useDataFilter

## 作用

全局数据过滤器的生命周期管理。负责过滤器的创建、校验、启用/禁用、与组件的绑定关系维护，以及 filter 被删除/粘贴组件时的同步清理。

## 文件路径

`apps/app/src/views/build/useDataFilter.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `dataFilter` | `ComputedRef<DataFilter[]>` | 全局过滤器数组（来自 navInfo.filterConfig） |
| `currentFilter` | `Ref<DataFilter \| null>` | 当前正在编辑/查看的过滤器 |
| `filterResultForCurrentComponent` | `Ref<FilterResult \| null>` | 最近一次 filter 执行结果 |
| `handleSave(filter)` | `Function` | 保存过滤器（含校验，写入 navInfo） |
| `deleteFilterFromComponent(filter, component)` | `Function` | 从指定组件移除 filter 绑定 |
| `handleFilterEnable({filter, value, component})` | `Function` | 切换 filter 在组件上的启用状态 |
| `updateFilterOnComponentPasted(id)` | `Function` | 粘贴组件后同步 filter 绑定 |
| `updateFilterOnComponentDeleted(id)` | `Function` | 删除组件后清理 filter 绑定 |
| `onFilterCodeChange(item, value)` | `Function` | 追踪 filter code 变更（用于绑定关系迁移） |
| `getFilterResultsByComponentId(id)` | `Function` | 获取指定组件所有过滤器的运行时执行结果 |

## DataFilter 核心结构

```typescript
interface DataFilter {
  id: string            // filter 唯一标识
  code: string          // filter 编码（用于组件引用）
  name: string          // 显示名称
  bindComponent: string[] // 绑定的组件 ID 列表
  enabled: boolean      // 是否全局启用
  // ... 其他配置
}
```

## getFilterResultsByComponentId 返回结构

```typescript
// 成功时
{
  success: true,
  results: Array<{
    filterName: string       // 过滤器名称
    inputData: unknown[]     // 过滤器接收到的原始数据
    outputData: unknown[]    // 过滤器处理后输出给组件的数据
    success: boolean         // 该过滤器是否执行成功
    error?: string           // 执行失败时的错误信息
  }>
}

// 组件不存在时
{ success: false, error: string, results: [] }
```

> 需要浏览器处于打开状态且大屏已加载，否则返回空 results。

## 核心使用场景

- **读取所有 filter**：`dataFilter.value` 遍历展示过滤器列表
- **查看过滤器运行时结果**：`getFilterResultsByComponentId(componentId)` 获取某组件的实际 inputData / outputData
- **保存 filter 配置**：用户编辑后调用 `handleSave(filter)`（内部自动去重校验）
- **启用/禁用 filter**：`handleFilterEnable({ filter, value: true/false, component })`
- **组件删除时清理**：`updateFilterOnComponentDeleted(componentId)` 防止僵尸绑定
- **组件粘贴时同步**：`updateFilterOnComponentPasted(newComponentId)`

## 基本实现示例

```typescript
const {
  dataFilter,
  handleSave,
  handleFilterEnable,
  updateFilterOnComponentDeleted
} = useDataFilter()

// 读取所有过滤器
console.log(dataFilter.value)

// 保存一个过滤器
await handleSave({
  id: 'filter_001',
  code: 'cityFilter',
  name: '城市过滤',
  bindComponent: ['123', '456'],
  enabled: true
})

// 删除组件时清理绑定
updateFilterOnComponentDeleted(deletedComponentId)
```

## 注意事项

- 使用 `createGlobalState`，全局单例
- filter 的 `code` 字段变更时需调用 `onFilterCodeChange` 以保持组件绑定引用一致
- `handleSave` 包含重名/重码校验，失败时会弹出 ElMessage 提示
