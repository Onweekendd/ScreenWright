# updateConfig — 更新组件配置

更新目标组件的完整配置。该行为需要完整的 `componentConfig` 对象，通常通过 UI 弹窗填写，agent 应从用户输入或现有组件配置中获取。

## 字段

| 字段路径 | 类型 | 说明 |
|---------|------|------|
| `componentConfig` | object | 组件配置参数（完整配置对象，包含 component/option/name/left/top 字段） |
| `animation.delay` | number (ms) | 动画延迟时间（毫秒） |
