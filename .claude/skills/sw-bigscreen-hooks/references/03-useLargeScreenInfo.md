# useLargeScreenInfo

## 作用

管理大屏元信息（屏幕尺寸、主题、背景、水印、版本号、协作模式等配置）。数据来自 API 返回的 `detailInfo`，经 JSON 安全解析后存储，供全局读取。

## 文件路径

`apps/app/src/views/build/useLargeScreenInfo.ts`

## 返回值

| 字段 | 类型 | 说明 |
|------|------|------|
| `navInfo` | `Ref<NavInfo>` | 屏幕元信息对象（含 width、height、bgColor、theme 等） |
| `isMultiPerson` | `ComputedRef<boolean>` | 是否为多人协作模式（`navInfo.type === 2`） |
| `setNavInfo(detailInfo)` | `Function` | 从 detailInfo 解析并写入 navInfo |
| `setVersionCode(code)` | `Function` | 更新版本号（用于保存/发布后同步） |
| `resetNavInfo()` | `Function` | 重置为默认值 |

## NavInfo 核心字段

```typescript
interface NavInfo {
  id: number
  name: string          // 大屏名称
  width: number         // 设计宽度（px）
  height: number        // 设计高度（px）
  bgColor: string       // 背景色
  bgImage: string       // 背景图
  theme: string         // 主题标识
  versionCode: string   // 当前版本号
  type: number          // 1=普通, 2=多人协作
  waterConfig: object   // 水印配置（JSON字符串，自动解析）
  filterConfig: object  // 全局过滤器配置
  // ... 其他配置字段
}
```

## 核心使用场景

- **获取屏幕尺寸**：`navInfo.value.width / height`（用于画布缩放计算）
- **判断协作模式**：`isMultiPerson.value` 决定是否启用多人编辑逻辑
- **读取主题**：`navInfo.value.theme` 控制全局样式变量
- **发布后同步版本**：`setVersionCode(newCode)` 更新前端缓存的版本号

## 基本实现示例

```typescript
const { navInfo, isMultiPerson, setVersionCode } = useLargeScreenInfo()

// 获取画布尺寸
const canvasWidth = navInfo.value.width   // e.g. 1920
const canvasHeight = navInfo.value.height // e.g. 1080

// 判断是否多人协作
if (isMultiPerson.value) {
  // 启用 WebSocket 同步逻辑
}

// 发布成功后更新版本号
await publishAPI()
setVersionCode(newVersionCode)
```

## 注意事项

- `setNavInfo` 内部会对 `waterConfig`、`filterConfig` 等 JSON 字符串字段自动解析，无需手动 `JSON.parse`
- 使用 `createGlobalState`，全局单例
