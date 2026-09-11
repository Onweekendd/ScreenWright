# useStatusCache 测试指南

## 📋 测试文件位置

[useStatusCache.test.ts](file:///c:/screenwright-monorepo/apps/app/src/tests/dynamicPanel/useStatusCache.test.ts)

## 🎯 测试覆盖内容

### 1. 基础缓存功能

- ✅ 缓存当前状态
- ✅ 缓存相邻状态（启用预加载时）
- ✅ 尊重 maxCacheSize 限制

### 2. LRU 缓存清理逻辑

- ✅ 按访问顺序管理缓存
- ✅ 将重新访问的状态移到队列末尾
- ✅ 超出限制时移除最旧的状态

### 3. 相邻状态预加载

- ✅ 预加载前一个状态
- ✅ 预加载后一个状态
- ✅ 第一个/最后一个状态的边界情况
- ✅ 禁用预加载的情况

### 4. 边界情况

- ✅ maxCacheSize = 0（不限制）
- ✅ activeStatusId 为 null
- ✅ 只有一个状态

### 5. 复杂场景

- ✅ 连续切换相邻状态
- ✅ 跳跃访问状态时的LRU清理

### 6. 功能测试

- ✅ resetCache 重置缓存

## 🚀 运行测试

### 运行所有测试

```bash
cd c:\screenwright-monorepo\apps\app
pnpm test
```

### 只运行 useStatusCache 测试

```bash
pnpm test useStatusCache
```

### Watch 模式（代码变化自动重新测试）

```bash
pnpm test:watch useStatusCache
```

### 查看测试覆盖率

```bash
pnpm test:coverage
```

### 使用 UI 界面

```bash
pnpm test:ui
```

## 📊 测试案例说明

### 案例1: LRU 基础逻辑

```typescript
// 测试：连续访问 4 个状态，maxCacheSize = 3
访问顺序: 状态1 → 状态2 → 状态3 → 状态4

缓存演变:
[状态1]
[状态1, 状态2]
[状态1, 状态2, 状态3]
[状态2, 状态3, 状态4]  ← 状态1被移除（最旧）
```

### 案例2: 重新访问旧状态

```typescript
// 测试：重新访问状态会移到队列末尾
初始: [状态1, 状态2, 状态3]
重新访问状态1
结果: [状态2, 状态3, 状态1]  ← 状态1移到末尾（最新）
```

### 案例3: 相邻预加载

```typescript
// 测试：当前状态5，启用预加载
renderedStatusIds = [状态5, 状态4, 状态6]
                     ↑当前  ↑前   ↑后
```

### 案例4: 边界情况

```typescript
// 测试：第一个状态
当前: 状态1
renderedStatusIds = [状态1, 状态2]  ← 没有前一个状态

// 测试：最后一个状态
当前: 状态10
renderedStatusIds = [状态10, 状态9]  ← 没有后一个状态
```

## 🔍 调试测试

### 查看详细输出

```bash
pnpm test useStatusCache -- --reporter=verbose
```

### 调试单个测试

在测试代码中使用 `it.only`:

```typescript
it.only("应该按访问顺序管理缓存（LRU）", () => {
  // 只运行这个测试
});
```

### 跳过某个测试

```typescript
it.skip("暂时跳过的测试", () => {
  // 不会运行
});
```

## 📝 测试结果示例

```
✓ useStatusCache - LRU 缓存逻辑 (8)
  ✓ 基础缓存功能 (3)
    ✓ 应该缓存当前状态
    ✓ 应该在缓存中包含相邻状态（启用预加载时）
    ✓ 应该尊重 maxCacheSize 限制
  ✓ LRU 缓存清理逻辑 (2)
    ✓ 应该按访问顺序管理缓存（LRU）
    ✓ 应该将重新访问的状态移到队列末尾
  ✓ 相邻状态预加载 (5)
    ✓ 应该预加载前一个状态
    ✓ 应该预加载后一个状态
    ✓ 第一个状态不应该预加载前一个状态
    ✓ 最后一个状态不应该预加载后一个状态
    ✓ 禁用预加载时只应返回当前状态

Test Files  1 passed (1)
     Tests  17 passed (17)
```

## 🎯 测试要点

1. **纯逻辑测试** - 不涉及任何 UI 渲染
2. **快速执行** - 所有测试应该在毫秒级完成
3. **可重复** - 每次运行结果一致
4. **独立性** - 每个测试互不影响

## 🔧 扩展测试

如果需要添加更多测试，可以在文件中添加新的 `describe` 或 `it` 块：

```typescript
describe("新的测试场景", () => {
  it("应该做某事", () => {
    // 测试代码
  });
});
```

## 📚 相关文档

- [Vitest 文档](https://vitest.dev/)
- [Vue Testing 指南](https://test-utils.vuejs.org/)
