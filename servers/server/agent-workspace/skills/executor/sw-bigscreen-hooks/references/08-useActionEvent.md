# useActionEvent

## 作用

组件行为方法的全局注册表。组件在挂载时将自身暴露的行为方法（如 `show`、`hide`、`refresh`）注册到此 hook，事件系统执行 Action 时通过 key 查找并调用对应方法。

## 文件路径

`apps/funBI/src/hooks/eventHandling/useActionEvent.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `eventList` | `Ref<TotalPanelEventMap>` | 所有已注册的组件行为 Map |
| `addEvent(event)` | `Function` | 注册一个组件的完整行为对象 |
| `addEventHandler<K, F, T>(key, functionName, handler)` | `Function` | 向已注册对象的某方法添加/合并 handler |

## TotalPanelEventMap 结构

```typescript
// key 格式：`${componentType}-${componentId}`，如 "FtMutual-123"
type TotalPanelEventMap = {
  [key: string]: {
    show?: (...args: any[]) => void
    hide?: (...args: any[]) => void
    refresh?: (...args: any[]) => void
    // ...其他组件自定义行为
  }
}
```

## 核心使用场景

- **组件挂载时注册行为**：让事件系统能够远程调用组件的 `show/hide/refresh` 等方法
- **合并多个 handler**：同一个行为被多处注册时，`addEventHandler` 自动串联执行
- **事件系统内部**：`useEventHandling` 在执行 `"component"` 类型 action 时，通过 key 从 `eventList` 中查找并调用

## 基本实现示例

```typescript
// 组件内部：挂载时注册自身行为
const { addEvent } = useActionEvent()
const componentKey = `${props.config.prop}-${props.config.id}` // e.g. "FtMutual-123"

onMounted(() => {
  addEvent({
    [componentKey]: {
      show: () => { visible.value = true },
      hide: () => { visible.value = false },
      refresh: () => { fetchData() }
    }
  })
})

// 合并追加一个 handler（不覆盖已有的）
addEventHandler(componentKey, 'refresh', () => {
  console.log('refresh triggered')
})
// 此时调用 refresh 会同时执行原始 handler 和新增的 handler
```

## addEventHandler 合并逻辑

```typescript
// 伪代码
if (已有 functionName) {
  const original = eventList[key][functionName]
  eventList[key][functionName] = (...args) => {
    original(...args)
    newHandler(...args)
  }
} else {
  eventList[key][functionName] = newHandler
}
```

## 注意事项

- 使用 `createGlobalState`，全局单例
- key 格式 `${prop}-${id}` 需与 Action 配置中的 `component` 字段格式一致（`$component(id)` 会被解析为此 key）
- 组件卸载时无需手动注销（事件系统调用时若找不到 key 会静默跳过）
