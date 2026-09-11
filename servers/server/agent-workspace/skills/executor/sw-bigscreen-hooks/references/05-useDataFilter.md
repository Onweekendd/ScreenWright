# useDataFilter

## 作用

全局数据过滤器的生命周期管理。维护大屏所有过滤器的配置状态、与组件的绑定关系，并通过 `FilterResultCollector` 收集每次过滤器执行的 inputData / outputData 运行时结果。

## 文件路径

`apps/funBI/src/views/build/useDataFilter.ts`

## 重要：dataFilter 的数据结构

`dataFilter` 是 `ComputedRef<Record<string, Filter>>`，**以过滤器名称为 key**，不是数组。

```typescript
// 正确：按名称取单个过滤器
const filter = dataFilter.value['城市过滤器']

// 正确：遍历所有过滤器
Object.values(dataFilter.value).forEach(f => { /* ... */ })

// 错误：dataFilter 没有 .filters 字段
// 错误：dataFilter.value 不是数组，不能直接 .find()
```

## Filter 完整结构

```typescript
type Filter = {
  name: string                              // 过滤器名称（Record 的 key，同时是组件 listenArgs 中的引用 key）
  dataFormatter: string                      // 过滤器函数字符串，例如 "(data, callbackArgs) => { return data }"
  bindComponent: Array<{ id: number | string; label: string }> // 绑定的组件列表
  callBack: string[]                         // 回调参数字段列表（组件间传参）
  callBackStatus: boolean                    // 回调功能是否启用
  checked: boolean                           // 是否在 UI 中被选中
  show: boolean                              // 是否展开显示
  notSaved?: boolean                         // true = 临时未保存的新建 filter
  id?: string                                // 仅新建未保存的 filter 有此 uuid 字段，保存后会被删除
}
```

## 返回值（关键字段）

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `dataFilter` | `ComputedRef<Record<string, Filter>>` | 全局过滤器 Map，key 为过滤器名称 |
| `currentFilter` | `ComputedRef<Filter[]>` | 当前选中组件绑定的过滤器列表 |
| `filterResultForCurrentComponent` | `ComputedRef<any>` | 当前选中组件最后一次过滤器执行结果（UI 用） |
| `filterAllResultForCurrentComponent` | `ComputedRef<ResultCollectItem[]>` | 当前选中组件所有过滤器的完整执行结果列表 |
| `getFilterResultsByComponentId(id)` | `Function` | **通过组件 ID 获取该组件所有过滤器的运行时执行结果** |
| `handleSave(filter)` | `async Function` | 保存过滤器（含重名校验） |
| `deleteFilter(filterName)` | `async Function` | 全局删除一个过滤器（解绑所有组件） |
| `deleteFilterFromComponent(filter, component?)` | `async Function` | 从指定组件移除 filter 绑定 |
| `handleFilterEnable({filter, value, component})` | `async Function` | 切换 filter 在组件上的启用状态 |
| `addDataFilterToComponent(name?)` | `async Function` | 为当前组件添加已有过滤器，或新建临时过滤器 |
| `updateFilterOnComponentDeleted(id)` | `async Function` | 删除组件后清理 filter 绑定 |
| `updateFilterOnComponentPasted(id)` | `async Function` | 粘贴组件后同步 filter 绑定 |
| `onFilterCodeChange(item, value)` | `Function` | 更新过滤器 dataFormatter 代码并标记未保存 |

## getFilterResultsByComponentId 返回结构

```typescript
// 成功时（组件存在）
{
  success: true,
  results: Array<{
    filterName: string       // 过滤器名称
    inputData: any[]         // 过滤器接收到的原始 API 数据
    outputData: any[]        // 过滤器 dataFormatter 处理后输出给组件的数据
    success: boolean         // 该次执行是否成功
    error?: string           // 执行失败时的错误信息
  }>
}

// 组件不存在时
{ success: false, error: "组件 xxx 不存在", results: [] }
```

> `results` 为空数组时，说明该组件还没有触发过任何过滤器执行（大屏未加载或无数据绑定）。

## 在 execute_in_browser 中的正确用法

```javascript
// 查看组件过滤器的实际输出（最常用场景）
const { getFilterResultsByComponentId } = useDataFilter();
return getFilterResultsByComponentId('12345');

// 查看全局所有过滤器的配置（静态配置，非运行时数据）
const { dataFilter } = useDataFilter();
return Object.values(dataFilter.value).map(f => ({
  name: f.name,
  bindComponent: f.bindComponent,
  dataFormatter: f.dataFormatter
}));

// 按名称查找某个过滤器的配置
const { dataFilter } = useDataFilter();
return dataFilter.value['城市过滤器'];
```

## 注意事项

- 使用 `createGlobalState`，全局单例
- `dataFilter` 的数据来源是 `navInfo.value.dataFilterArr`（Record 结构）
- `id` 字段仅存在于**新建未保存**的临时 filter，调用 `handleSave` 后该字段会被删除
- 运行时结果（inputData/outputData）存储在 `FilterResultCollector` 单例的 WeakMap 中，只在浏览器内存中存在，workspace 文件中没有
