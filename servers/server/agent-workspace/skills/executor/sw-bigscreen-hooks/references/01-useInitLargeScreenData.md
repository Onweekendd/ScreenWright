# useInitLargeScreenData

## 作用

大屏数据的顶层初始化 hook。负责从 API 拉取屏幕详情、组件列表、初始化缓存、动画、回调参数等整条启动链路。是大屏页面加载的唯一入口。

## 文件路径

`apps/funBI/src/views/build/useInitLargeScreenData.ts`

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `detailInfo` | `Ref<DetailInfo>` | 屏幕完整详情数据 |
| `isLoad` | `Ref<boolean>` | 是否正在加载 |
| `groupData` | `ComputedRef<Component[]>` | 全局组件列表（来自 useGlobalComponentData） |
| `initLargeScreen(id, shareConfig?)` | `Function` | 启动加载，支持分享密码 |
| `initLargeScreenData(res)` | `Function` | 从响应数据内部初始化（供缓存命中时复用） |
| `initCallbackArguments` | `Function` | 初始化组件间回调参数关系 |

## 核心使用场景

- **大屏查看页**：调用 `initLargeScreen(id)` 初始化整个大屏
- **分享页**：调用 `initLargeScreen(id, { shareCode })` 传入分享密码
- **缓存命中**：直接调用 `initLargeScreenData(cachedRes)` 跳过网络请求

## 基本实现示例

```typescript
// 在大屏查看页 onMounted 中调用
const { initLargeScreen, isLoad, groupData } = useInitLargeScreenData()

onMounted(async () => {
  await initLargeScreen(route.params.id as string)
})

// 分享页（带密码）
await initLargeScreen(id, { shareCode: 'abc123' })
```

## 初始化链路

```
initLargeScreen(id)
  → 检查缓存是否过期（useCacheTime）
  → 调用 API 获取屏幕详情
  → initLargeScreenData(res)
      → setNavInfo()         → useLargeScreenInfo
      → setGroupData()       → useGlobalComponentData
      → initCallbackArguments() → useCallbackArguments
      → 初始化动画配置
```

## 注意事项

- 使用 `createGlobalState`，全局单例，多处调用拿到同一个状态
- `isLoad` 为 `true` 时说明正在请求，可用于显示 loading
