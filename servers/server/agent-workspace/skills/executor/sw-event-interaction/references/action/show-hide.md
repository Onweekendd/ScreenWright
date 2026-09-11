# show / hide / show/hide — 显示 / 隐藏 / 显隐切换

控制目标组件显示或隐藏，可配置入场/出场动画效果。

## 字段

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `animation.type` | string | 动画类型：`"none"` / `"opacity"` / `"slideLeft"` / `"slideRight"` / `"slideUp"` / `"slideDown"` |
| `animation.timingFunction` | string | 缓动函数：`"none"` / `"linear"` / `"ease"` / `"ease-in"` / `"ease-out"` / `"ease-in-out"` |
| `animation.duration` | number (ms) | 动画持续时间（毫秒） |
| `animation.delay` | number (ms) | 动画延迟时间（毫秒） |
