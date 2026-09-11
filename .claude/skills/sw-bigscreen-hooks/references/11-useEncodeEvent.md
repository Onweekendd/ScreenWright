# useEncodeEvent

## 作用

专门处理 Encode 面板（终端控制面板）的事件。判断是否需要跳过（如不在查看/分享页），满足条件时向目标 encode 组件发送 terminal 消息（控制信号）。

## 文件路径

`apps/app/src/hooks/encodeHanding/useEncodeEvent.ts`

## 返回值

| 字段/方法 | 类型 | 说明 |
|-----------|------|------|
| `handleEncodeEvent(params)` | `Function` | 处理 encode 事件（立即执行） |
| `handleEncodeEventThrottled(params)` | `Function` | 节流版本（500ms），高频触发场景使用 |

## 参数

```typescript
interface HandleEncodeEventParams {
  sourceComponent?: ComponentType  // 触发事件的源组件（用于条件检查）
  encodes: EncodeEvent[]           // 组件配置的 encode 事件数组
  throwValue: any                  // 传递给 encode 组件的值
}

interface EncodeEvent {
  encodeId: number | string        // 目标 encode 组件 ID
  encodeKey: string | null         // 控制键（控制哪个属性）
  conditions?: Condition[]         // 执行条件
  trigger: EncodeEventTypeEnum     // 触发类型
  isChecked?: boolean
}
```

## 发送的消息结构

```typescript
interface MessageToSend {
  id: number                       // 目标 encode 组件 ID
  encodeKey: number | string | null
  isChecked?: boolean
  trigger: EncodeEventTypeEnum
  throwValue: any
}
```

## 核心使用场景

- **控制终端面板**：组件交互时向 encode panel 发送控制信号（如开关、调节参数）
- **iframe 嵌套大屏**：组件有 `parentEncodeId` 时跳过 encode 过滤，直接透传到父级 iframe
- **高频事件**：滑块拖动等高频操作使用 `handleEncodeEventThrottled` 避免过多消息

## 基本实现示例

```typescript
// 组件内部：点击时发送 encode 消息
const { handleEncodeEvent, handleEncodeEventThrottled } = useEncodeEvent()

function onButtonClick(value: any) {
  handleEncodeEvent({
    encodes: props.config.encodes,       // 组件配置的 encode 绑定
    throwValue: value,
    sourceComponent: props.config
  })
}

// 高频场景（如 slider 拖动）
function onSliderChange(value: number) {
  handleEncodeEventThrottled({
    encodes: props.config.encodes,
    throwValue: value,
    sourceComponent: props.config
  })
}
```

## 执行条件判断

```
handleEncodeEvent(params)
  → 检查当前路由是否为 view / shareScreen / encodePanel
  → 若组件有 parentEncodeId（iframe 内嵌）→ 跳过路由检查
  → 对每个 encode：检查条件（useConditionChecking）
  → 满足条件 → sendTerminalMessage({ ...message, largeId? })
```

## 注意事项

- 仅在查看模式下生效（非 build 路由）
- `largeId` 用于 iframe 内嵌场景，标识目标大屏 ID
- `EncodeEventTypeEnum` 与 `EventTypeEnum` 是两套独立的枚举
