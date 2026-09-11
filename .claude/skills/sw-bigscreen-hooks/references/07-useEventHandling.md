# useEventHandling

## 作用

事件系统的核心编排层。负责：过滤匹配的事件、检查执行条件、通过 Strategy 模式分发行为（Action）、驱动回调参数传播、执行所有注册的通用回调。通常不直接使用，应通过 `useEvent` 调用。

## 文件路径

`apps/app/src/hooks/eventHandling/useEventHandling.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `handleEvents(params)` | `Function` | 事件处理主入口 |
| `handleActions(params)` | `async Function` | 单独执行行为列表（跳过事件过滤步骤） |
| `activeChildComponent` | `Ref<any>` | 当前激活的子组件 |
| `registerCallback` | `(cb) => () => void` | 注册通用回调（返回注销函数） |
| `registerCallbacks` | `(cbs) => () => void` | 批量注册回调 |
| `unregisterCallback` | `(cb) => void` | 注销单个回调 |
| `clearCallbacks` | `() => void` | 清空所有回调 |
| `getCallbackCount` | `() => number` | 当前回调数量 |

## 行为执行流程（handleEvents 内部）

```
1. 在编辑模式且 isExecuteOnlyInViewMod=true → 直接返回
2. 深克隆 throwValue
3. 过滤 events 列表：只保留 trigger 匹配的事件
4. 对每个事件：
   a. 检查条件（useConditionChecking）
   b. 调用 handleActions() 执行行为列表
5. 如果 throwCallback=true：
   → useCallbackArguments.handleCallback()（值传播）
6. useEventCallbacks.executeCallbacks()（并发执行所有注册回调）
```

## 支持的 customActionType

| customActionType | 行为说明 |
|-----------------|---------|
| `"component"` | 组件显隐/属性变更（通过 Strategy 执行） |
| `"message"` | TCP/UDP WebSocket 消息发送（含重试） |
| `"statusAnimation"` | 触发状态动画切换 |
| 其他 | 通过 `ActionStrategyFactory` 扩展 |

## 基本实现示例

```typescript
// 通常不直接用，通过 useEvent 调用
// 以下为需要自定义回调时的场景
const {
  handleEvents,
  registerCallback,
  activeChildComponent
} = useEventHandling()

// 注册一个通用回调，监听所有事件触发
const unregister = registerCallback(async ({ throwValue, id, triggerType }) => {
  console.log('事件触发：', triggerType, throwValue)
  // 执行自定义逻辑
})

// 组件卸载时注销
onUnmounted(unregister)

// 触发事件
handleEvents({
  throwValue: { value: 'Beijing' },
  events: component.events,
  triggerType: EventTypeEnum.click,
  id: component.id,
  throwCallback: true
})
```

## 注意事项

- `handleEvents` 基于 `createGlobalState` 的全局状态，注册的回调跨组件共享
- `message` 类型的行为包含 TCP/UDP 重连逻辑，会有副作用
- `throwValue` 在内部会被深克隆，不影响原始对象
