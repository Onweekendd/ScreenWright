# useEvent

## 作用

事件触发的对外 facade（入口层）。对 `useEventHandling` 的薄封装，提供简洁的 API，并默认强制传播回调参数（`throwCallback: true`）。**绝大多数组件应通过此 hook 触发事件，而非直接调用 `useEventHandling`。**

## 文件路径

`apps/app/src/hooks/useEvent.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `handleEvents(params)` | `Function` | 触发事件（不强制 throwCallback） |
| `handleEventAndCallbackEvent(params)` | `Function` | 触发事件并强制开启回调参数传播 |
| `isBuild` | `ComputedRef<boolean>` | 是否在编辑器（route.name === 'build'） |
| `activeChildComponent` | `Ref<any>` | 当前激活的子组件（Panel 切换使用） |

## HandleEventsParams 参数

```typescript
{
  throwValue: Record<string, any>   // 抛出的数据值（事件携带的数据）
  events: Event[]                   // 组件上配置的事件数组
  triggerType: EventTypeEnum        // 触发类型（click / dataChange / mouseEnter...）
  id?: number | string              // 触发组件的 ID
  modelId?: string                  // 组件 modelId（用于 encode 场景）
  isExecuteOnlyConditionSatisfied?: boolean  // default: true，只在条件满足时执行
  throwCallback?: boolean           // 是否传播回调参数
  isExecuteOnlyInViewMod?: boolean  // default: true，只在查看模式执行
}
```

## 核心使用场景

- **图表点击触发事件**：用户点击图表时，携带点击数据触发 `click` 事件
- **数据加载完成触发**：组件数据请求完毕后触发 `dataChange` 事件
- **鼠标悬停触发**：hover 进入/离开时触发 `mouseEnter`/`mouseLeave`
- **组件间联动**：通过事件将数据抛给其他组件（显隐控制、过滤联动等）

## 基本实现示例

```typescript
// 在组件内部使用
const { handleEventAndCallbackEvent, isBuild } = useEvent()

// 图表点击时触发事件
function onChartClick(params: EChartsClickParams) {
  handleEventAndCallbackEvent({
    throwValue: { value: params.value, name: params.name },
    events: props.config.events,   // 组件配置的事件列表
    triggerType: EventTypeEnum.click,
    id: props.config.id
  })
}

// 数据加载完成触发
function onDataLoaded(data: any[]) {
  handleEventAndCallbackEvent({
    throwValue: { data },
    events: props.config.events,
    triggerType: EventTypeEnum.dataChange,
    id: props.config.id
  })
}
```

## handleEvents vs handleEventAndCallbackEvent

| 方法 | throwCallback 默认值 | 适用场景 |
|------|---------------------|---------|
| `handleEvents` | 由调用方传入，默认 undefined | 需要手动控制是否传播回调时 |
| `handleEventAndCallbackEvent` | 强制 `true` | 绝大多数组件交互场景（推荐） |

## 注意事项

- 在编辑模式（`isBuild.value === true`）且 `isExecuteOnlyInViewMod: true`（默认）时，事件不会执行
- `throwValue` 的字段名需与目标组件配置的 callback 字段名匹配
