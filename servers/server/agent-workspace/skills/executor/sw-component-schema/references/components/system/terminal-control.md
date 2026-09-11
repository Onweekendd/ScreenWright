# terminal-control (终端交互) 配置说明

基于配置文件：`systemGlobal/terminalControlGlobal.vue`

## dataChart 数据格式

终端交互为容器组件，不绑定数据。`template` 为空数组，无需配置 dataChart。其子组件的事件通过 WebSocket 协议传递到大屏运行时触发目标组件行为。

---

## option 完整字段参考

### 全局配置（terminalControlGlobal.vue）

| 字段 | 类型 | 说明 |
|------|------|------|
| enableOpen | boolean | 默认启用该终端交互，启用后可通过 WS 触发大屏事件；可发布后在运行时切换 |
| enableScroll | boolean | 内容区域是否允许溢出滚动 |
| hiddenLoading | boolean | 是否隐藏加载动画 |
| display | boolean | 运行时是否显示该终端面板 |

> **注意**：终端交互内部组件配置的"控制事件"（如点击、触发等）会经由 WebSocket 发送到主大屏，`enableOpen` 决定该终端是否处于激活可通信状态。大屏运行时的 `terminalEnableArr` 记录了所有已启用终端的 id 与名称映射。

---

## 常用配置示例

### 默认启用的终端交互

```json
{
  "enableOpen": true,
  "enableScroll": false,
  "hiddenLoading": false,
  "display": false
}
```

### 禁用状态（不触发跨屏事件）

```json
{
  "enableOpen": false,
  "enableScroll": false,
  "hiddenLoading": false,
  "display": false
}
```
