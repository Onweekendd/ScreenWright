# 缓存 Worker 系统

## 概述

为了避免主线程在处理大量缓存数据时的阻塞，我们实现了基于 Web Worker 的缓存系统。该系统将缓存数据的构建和 IndexedDB 操作迁移到 Worker 线程中，并保持原有的防抖功能。

## 架构

```
主线程 (useCacheData.ts)
    ↓ 传递Vue响应式数据的序列化版本
Worker线程 (cacheWorker.ts)
    ↓ 处理缓存构建和数据库操作
IndexedDB (IndexedDBManager)
```

## 主要组件

### 1. cacheWorker.ts

- 运行在 Worker 线程中的缓存处理器
- 包含防抖功能
- 处理缓存数据构建和 IndexedDB 操作
- 支持消息通信协议

### 2. cacheWorkerManager.ts

- Worker 生命周期管理
- 消息通信封装
- Promise 化的 API 接口
- 自动初始化和错误处理

### 3. useCacheData.ts (已修改)

- 保持原有 API 不变
- 将 Vue 响应式数据序列化后传递给 Worker
- 使用 cacheWorkerManager 进行 Worker 通信

## 使用方式

### 基本缓存操作（异步，不等待完成）

```typescript
import { useCacheData } from "@/views/build/useCacheData"

const { cacheData } = useCacheData()

// 缓存当前状态（推荐用于响应拦截器等场景）
await cacheData()

// 缓存并指定时间戳
await cacheData(1640995200000)
```

### 缓存操作并等待完成

```typescript
const { cacheDataWithResponse } = useCacheData()

// 缓存并等待Worker完成
const result = await cacheDataWithResponse()
console.log("缓存完成时间:", result.timestamp)
```

### 获取缓存数据

```typescript
const { getCacheData } = useCacheData()

// 获取指定ID的缓存
const cachedData = await getCacheData(123)
if (cachedData) {
  console.log("缓存数据:", cachedData.result)
}
```

## 关键特性

### 1. 防抖处理

- Worker 中实现 1 秒防抖
- 多次快速调用只执行最后一次
- 避免频繁的数据库操作

### 2. 非阻塞操作

- 主线程不会因缓存操作而阻塞
- 大数据处理在 Worker 中完成
- 更流畅的用户体验

### 3. 错误处理

- Worker 异常不会影响主线程
- 完整的错误传播机制
- 超时保护

### 4. 向后兼容

- 保持原有 API 接口不变
- 现有代码无需修改
- 渐进式升级

## 消息协议

### 发送到 Worker 的消息

```typescript
interface WorkerMessage {
  type: "CACHE_DATA" | "GET_CACHE_DATA" | "INIT_DB"
  payload: any
  requestId?: string
}
```

### Worker 返回的消息

```typescript
interface WorkerResponse {
  type: "CACHE_COMPLETE" | "CACHE_ERROR" | "GET_CACHE_COMPLETE" | "GET_CACHE_ERROR" | "INIT_COMPLETE"
  payload: any
  requestId?: string
}
```

## 注意事项

1. **数据传递**: Vue 响应式数据会被序列化为普通对象传递给 Worker
2. **生命周期**: Worker 在页面卸载时自动销毁
3. **兼容性**: 需要浏览器支持 Web Worker 和动态导入
4. **调试**: Worker 中的 console.log 可在浏览器开发者工具的专门 Worker 面板中查看

## 性能优化

- 使用`cacheData()`进行异步缓存，不阻塞后续操作
- 仅在需要确认完成时使用`cacheDataWithResponse()`
- 防抖机制避免重复操作
- Worker 池化可进一步优化（可考虑未来实现）
