# switchState — 切换组件状态

适用于 `dynamicPanel`（动态面板）组件，切换到指定状态。

## 字段

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `stateId` | string | 状态面板ID，用于状态切换（从组件的状态列表中获取目标状态 ID） |
| `animation.type` | string | 动画类型：`"none"` / `"opacity"` / `"slideLeft"` / `"slideRight"` / `"slideUp"` / `"slideDown"` |
| `animation.timingFunction` | string | 缓动函数 |
| `animation.duration` | number (ms) | 动画持续时间（毫秒） |
| `animation.delay` | number (ms) | 动画延迟时间（毫秒） |
