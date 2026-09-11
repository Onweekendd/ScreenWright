# useCallbackArguments

## 作用

组件间回调参数关系的全局管理中心。维护"源组件的 cbArgs（回调参数）→ 目标组件的 listenArgs（监听参数）"的映射关系，并在事件触发时带防抖地将值从源组件传播到所有订阅的目标组件。

## 文件路径

`apps/funBI/src/hooks/callbackArguments/useCallbackArguments.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `callbackEventManager` | `CallbackEventManager` | 基于 Map 的发布/订阅事件管理器 |
| `callbackArgumentsManager` | `ComputedRef<CallbackManager>` | 回调关系管理器实例 |
| `callbackArgumentsInstance` | `Ref<CallbackArguments>` | 回调参数数据对象 |
| `initCallbackArguments(componentList)` | `Function` | 初始化所有组件的回调关系 |
| `addCallbackArgument(component)` | `Function` | 注册单个组件的回调关系 |
| `handleCallback(options)` | `async Function` | 执行回调参数传播（防抖） |
| `setCallbackArgs(key, value)` | `Function` | 手动设置某个 cbArgs 字段的值 |
| `updateCallbackRelation(component)` | `Function` | 更新组件的回调关系 |
| `deleteCallbackRelation(component)` | `Function` | 删除组件的回调关系 |
| `onCallbackFieldTrigger(options)` | `Function` | 监听某字段被触发 |
| `offCallbackFieldTrigger(options)` | `Function` | 取消监听 |
| `emitCallbackFieldTrigger(targetKey, id)` | `async Function` | 手动触发某字段的值传播 |
| `onFilterTrigger(componentId, cb)` | `Function` | 监听组件的 filter 触发 |
| `emitFilterTrigger(componentId, customComp?)` | `async Function` | 触发组件的 filter 数据刷新 |

## handleCallback 参数

```typescript
interface HandleCallbackOptions {
  throwValue: Record<string, any>  // 源组件抛出的数据
  id: string | number              // 源组件 ID
  targetKey?: string               // 可选：仅传播指定字段
  debounceTime?: number            // 防抖时间（default: 300ms）
}
```

## 核心使用场景

- **初始化**：大屏启动时 `initCallbackArguments(groupData)` 建立所有关系
- **事件触发时传播**：`useEventHandling` 在 `handleEvents` 后调用 `handleCallback`
- **组件新增/删除时同步**：`addCallbackArgument` / `deleteCallbackRelation`
- **手动触发传播**：`emitCallbackFieldTrigger(fieldKey, componentId)`
- **filter 联动**：`emitFilterTrigger(componentId)` 触发某组件重新拉取数据

## 基本实现示例

```typescript
const {
  initCallbackArguments,
  handleCallback,
  onCallbackFieldTrigger,
  offCallbackFieldTrigger
} = useCallbackArguments()

// 大屏初始化时建立回调关系
initCallbackArguments(groupData.value)

// 监听某个 cbArgs 字段被触发（目标组件中使用）
const options = {
  targetKey: 'cityFilter',    // cbArgs 字段名
  id: props.config.id,        // 本组件 ID（作为目标）
  callback: (value: any) => {
    // 当源组件的 cityFilter 字段有新值时执行
    queryParams.city = value
    fetchData()
  }
}

onMounted(() => onCallbackFieldTrigger(options))
onUnmounted(() => offCallbackFieldTrigger(options))
```

## 数据流说明

```
源组件 (cbArgs: { cityFilter: '北京' })
  → handleCallback({ throwValue: { cityFilter: '北京' }, id: sourceId })
      → 防抖 300ms
      → 查找所有监听 cityFilter 且 sourceId 在列表中的目标组件
      → emitCallbackFieldTrigger('cityFilter', targetId)
          → 触发目标组件注册的 onCallbackFieldTrigger 回调
```

## 注意事项

- 使用 `createGlobalState`，全局单例
- 防抖 key 为 `"${targetKey}-${id}"` 或仅 `id`，多字段独立防抖
- `filterTrigger` 与 `callbackFieldTrigger` 是两套独立的发布订阅，分别服务于"数据联动"与"filter 联动"
