---
name: sw-bigscreen-hooks
description: >
  Screenwright 大屏 SDK 核心 Hooks 全局入口与参考指南。
  当需要了解大屏中有哪些重要的 hooks、某个 hook 的作用与用法、如何初始化大屏数据、如何访问组件树、如何触发事件与回调、如何管理数据过滤器、如何操作动画时，使用此 skill。
  触发场景：询问"大屏有哪些 hooks"、"如何使用 useEvent"、"怎么获取当前屏幕的组件列表"、"如何触发组件事件"、"useDataFilter 怎么用"、"如何注册动画"等。
  覆盖的 hooks（均来自 sdk 导出）：useInitLargeScreenData、useGlobalComponentData、useLargeScreenInfo、useEditStore、useDataFilter、useEvent、useEventHandling、useActionEvent、useEventCallbacks、useCallbackArguments、useEncodeEvent、useGlobalAnimation。
---

# Screenwright 大屏 SDK Hooks 全局入口

SDK 导出文件：`apps/app/src/views/view/exportEntry/sdk/hooks.ts`

## 架构分层

```
┌─────────────────────────────────────────────────────┐
│  数据层（屏幕初始化 & 状态）                           │
│  useInitLargeScreenData  useGlobalComponentData      │
│  useLargeScreenInfo                                  │
├─────────────────────────────────────────────────────┤
│  画布层（编辑状态 & 数据过滤）                         │
│  useEditStore            useDataFilter               │
├─────────────────────────────────────────────────────┤
│  事件系统层                                           │
│  useEvent（入口 facade）                              │
│    └─ useEventHandling（核心编排）                    │
│         ├─ useActionEvent（组件行为注册）              │
│         ├─ useEventCallbacks（泛型回调注册）           │
│         └─ useCallbackArguments（回调参数传播）        │
│  useEncodeEvent（Encode 面板专用）                    │
│  useGlobalAnimation（动画触发注册）                   │
└─────────────────────────────────────────────────────┘
```

## Hooks 索引

| Hook | 层级 | 一句话描述 |
|------|------|-----------|
| `useInitLargeScreenData` | 数据层 | 初始化大屏数据，加载屏幕详情与组件列表 |
| `useGlobalComponentData` | 数据层 | 全局组件树管理，提供各类组件 Map 索引 |
| `useLargeScreenInfo` | 数据层 | 屏幕元信息管理（尺寸、主题、版本等配置） |
| `useEditStore` | 画布层 | 画布编辑状态：当前选中组件、缩放比例、路由类型判断 |
| `useDataFilter` | 画布层 | 全局数据过滤器的增删改查与组件绑定 |
| `useEvent` | 事件层 | 事件触发入口（facade），最常用的事件调用点 |
| `useEventHandling` | 事件层 | 事件核心编排：条件判断、行为执行、回调分发 |
| `useActionEvent` | 事件层 | 组件挂载时注册自身行为方法，供事件系统调用 |
| `useEventCallbacks` | 事件层 | 泛型事件回调注册/执行，Set 去重，并发执行 |
| `useCallbackArguments` | 事件层 | 组件间回调参数关系管理，带防抖的值传播 |
| `useEncodeEvent` | 事件层 | Encode 面板（终端）事件，发送 terminal 消息 |
| `useGlobalAnimation` | 事件层 | 全局动画触发注册表，注册/卸载/执行动画 |

## 事件系统调用链

```
用户交互
  → useEvent.handleEventAndCallbackEvent(params)
      → useEventHandling.handleEvents()
          → 条件检查（useConditionChecking）
          → handleActions()：Strategy 执行各行为
              → useActionEvent（调用已注册的组件方法）
          → useCallbackArguments.handleCallback()（防抖值传播）
          → useEventCallbacks.executeCallbacks()（并发执行回调）
```

## References

| 文件 | 何时读取 |
|------|---------|
| [references/01-useInitLargeScreenData.md](references/01-useInitLargeScreenData.md) | 需要初始化大屏、加载屏幕数据、处理分享密码时 |
| [references/02-useGlobalComponentData.md](references/02-useGlobalComponentData.md) | 需要获取组件列表、查找组件、管理 Panel 子组件时 |
| [references/03-useLargeScreenInfo.md](references/03-useLargeScreenInfo.md) | 需要读取屏幕尺寸、主题配置、版本信息时 |
| [references/04-useEditStore.md](references/04-useEditStore.md) | 需要获取当前选中组件、画布缩放、路由类型判断时 |
| [references/05-useDataFilter.md](references/05-useDataFilter.md) | 需要管理全局数据过滤器、绑定组件与 filter 时 |
| [references/06-useEvent.md](references/06-useEvent.md) | 需要触发组件事件（最常用入口）时 |
| [references/07-useEventHandling.md](references/07-useEventHandling.md) | 需要理解事件编排机制、自定义 action 类型时 |
| [references/08-useActionEvent.md](references/08-useActionEvent.md) | 需要组件注册自身行为方法、合并多个 handler 时 |
| [references/09-useEventCallbacks.md](references/09-useEventCallbacks.md) | 需要注册/注销全局事件回调、并发执行多个回调时 |
| [references/10-useCallbackArguments.md](references/10-useCallbackArguments.md) | 需要在组件间传递回调参数、配置 cbArgs 关系时 |
| [references/11-useEncodeEvent.md](references/11-useEncodeEvent.md) | 需要向 Encode 面板发送终端消息时 |
| [references/12-useGlobalAnimation.md](references/12-useGlobalAnimation.md) | 需要注册动画触发器、播放组件进出场动画时 |
