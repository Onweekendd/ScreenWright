# common-animation — 通用动画字段

大多数行为都会用到以下 `animation` 对象中的字段。各 action 文件中不再重复说明这些字段的含义。

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `animation.delay` | number (ms) | 动画延迟时间（毫秒），默认 0 |
| `animation.duration` | number (ms) | 动画持续时间（毫秒），默认 1000 |
| `animation.timingFunction` | string | 时间函数/缓动效果：`"none"` / `"linear"` / `"ease"` / `"ease-in"` / `"ease-out"` / `"ease-in-out"` |
| `animation.type` | string | 动画类型：`"none"` / `"opacity"` / `"slideLeft"` / `"slideRight"` / `"slideUp"` / `"slideDown"` |
