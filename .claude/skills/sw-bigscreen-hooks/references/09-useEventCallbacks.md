# useEventCallbacks

## 作用

泛型事件回调注册与执行系统。任意模块可注册回调函数，当事件系统完成事件处理后，所有已注册的回调会被**并发执行**（Promise.allSettled）。用于在事件触发后执行横切逻辑，如日志、埋点、状态同步等。

## 文件路径

`apps/app/src/hooks/eventHandling/useEventCallbacks.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `registerCallback(cb)` | `(cb) => () => void` | 注册回调，返回注销函数 |
| `registerCallbacks(cbs)` | `(cbs) => () => void` | 批量注册，返回批量注销函数 |
| `unregisterCallback(cb)` | `Function` | 注销单个回调 |
| `clearCallbacks()` | `Function` | 清空所有回调 |
| `executeCallbacks(params)` | `async Function` | 并发执行所有回调 |
| `getCallbackCount()` | `() => number` | 获取当前回调数量 |

## EventCallbackParams 参数

```typescript
interface EventCallbackParams {
  throwValue: Record<string, any>  // 事件携带的数据
  id?: number | string             // 触发事件的组件 ID
  triggerType?: EventTypeEnum      // 触发类型
}
```

## 核心使用场景

- **全局事件监听**：不关心具体哪个组件触发，只想在任意事件发生时执行逻辑
- **埋点/日志**：记录用户交互行为
- **状态同步**：事件触发后同步某个全局状态
- **测试/调试**：注入回调观察事件流

## 基本实现示例

```typescript
const { registerCallback, unregisterCallback } = useEventCallbacks()

// 注册一个回调，监听所有事件触发
const unregister = registerCallback(async ({ throwValue, id, triggerType }) => {
  // 每次有事件触发时执行
  analytics.track('component_event', { throwValue, id, triggerType })
})

// 组件卸载时注销
onUnmounted(unregister)

// 批量注册
const unregisterAll = registerCallbacks([
  async (params) => { /* 回调 A */ },
  async (params) => { /* 回调 B */ }
])
onUnmounted(unregisterAll)
```

## 执行特性

- 使用 `Set<Function>` 存储，**同一函数引用注册两次只执行一次**
- `executeCallbacks` 使用 `Promise.allSettled`，**某个回调抛出错误不影响其他回调执行**
- 错误会被 `console.error` 捕获，不向上冒泡

## 注意事项

- 使用 `createGlobalState`，全局单例（注册的回调跨组件共享）
- 注意内存泄漏：组件卸载时务必调用返回的注销函数
- 本 hook 由 `useEventHandling` 在每次事件处理结束时内部调用，无需手动触发 `executeCallbacks`
