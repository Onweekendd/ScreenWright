# useGlobalAnimation

## 作用

全局动画触发注册表。组件将自身的动画触发函数注册到此 hook，事件系统或外部逻辑通过 ID 查找并调用，实现跨组件的动画控制（进场、离场、预览）。

## 文件路径

`apps/app/src/views/build/components/buildRender/hooks/useGlobalAnimation.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `triggerRegistry` | `Ref<Map<id, AnimationTrigger>>` | 所有已注册的动画触发器 Map |
| `registerAnimationTrigger(id, trigger)` | `Function` | 注册组件的动画触发函数 |
| `unregisterAnimationTrigger(componentId)` | `Function` | 注销组件的动画触发函数 |
| `getAllTriggers()` | `Function` | 返回所有已注册的组件 ID 数组 |
| `resetTriggerRegistry()` | `Function` | 清空所有注册（页面卸载时调用） |

## AnimationTrigger 结构

```typescript
type AnimationTrigger = (options: {
  animation: AnimationConfig     // 动画配置（name、duration、delay 等）
  type: 'enter' | 'leave'        // 动画类型
  triggerType?: 'preview' | 'play'
  newAnimationCallback?: {       // 可选：覆盖动画结束回调
    onEnter?: () => void
    onLeave?: () => void
  }
}) => void
```

## 核心使用场景

- **组件挂载时注册**：让外部能通过 ID 控制该组件播放动画
- **状态动画切换**：`useEventHandling` 处理 `"statusAnimation"` action 时，通过 registry 查找并调用 trigger
- **预览动画**：在编辑器中预览组件进/出场动画效果
- **页面卸载时清理**：`resetTriggerRegistry()` 释放所有引用

## 基本实现示例

```typescript
// 组件内部：挂载时注册自身动画触发函数
const { registerAnimationTrigger, unregisterAnimationTrigger } = useGlobalAnimation()

onMounted(() => {
  registerAnimationTrigger(props.config.id, ({ animation, type, triggerType }) => {
    // 执行对应的 CSS 动画
    playAnimation(animation, type)
  })
})

onUnmounted(() => {
  unregisterAnimationTrigger(props.config.id)
})

// 外部触发（如事件系统内部）
const { triggerRegistry } = useGlobalAnimation()

function triggerComponentAnimation(componentId: number, animation: AnimationConfig) {
  const trigger = triggerRegistry.value.get(componentId)
  if (trigger) {
    trigger({ animation, type: 'enter', triggerType: 'play' })
  }
}
```

## 与 useAnimation 的关系

| Hook | 职责 |
|------|------|
| `useGlobalAnimation` | **注册表**：维护 `id → triggerFn` 的全局 Map |
| `useAnimation`（组件级） | **执行层**：真正计算 CSS className、管理播放状态、处理回调 |

组件内通常同时使用两者：`useAnimation` 提供 trigger 函数，`useGlobalAnimation.registerAnimationTrigger` 将其暴露给外部。

## 注意事项

- 使用 `createGlobalState`，全局单例
- 注册 key 为组件的数字 ID（`number`），与 `allComponentMap` 的 key 类型一致
- 组件卸载时务必调用 `unregisterAnimationTrigger` 防止内存泄漏和无效触发
