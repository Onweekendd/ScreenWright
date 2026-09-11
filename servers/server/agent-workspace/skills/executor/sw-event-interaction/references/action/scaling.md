# scaling / scalingHide — 缩放 / 缩放隐藏

对目标组件进行缩放，或缩放后隐藏。

## 字段

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `scale.x` | number | X轴缩放比例 |
| `scale.y` | number | Y轴缩放比例 |
| `scale.lock` | boolean | 是否锁定缩放（锁定时等比缩放） |
| `scale.origin` | string | 缩放原点，如 `"center"` |
| `animation.duration` | number (ms) | 动画持续时间（毫秒） |
| `animation.timingFunction` | string | 缓动函数：`"none"` / `"linear"` / `"ease"` / `"ease-in"` / `"ease-out"` / `"ease-in-out"` |
| `animation.delay` | number (ms) | 动画延迟时间（毫秒） |
