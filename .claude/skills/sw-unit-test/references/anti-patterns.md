# Screenwright 测试反模式清单

本文档记录本项目测试代码中已出现的错误模式，以及对应的正确写法。

---

## 1. 重复的 `it` 名称（最高优先级）

**问题**：同一 `describe` 内出现两个名称相同的 `it`，Vitest 只运行其中一个，另一个静默跳过。

```typescript
// 坏 — 两个 it 名称一样
it("测试过滤器一起执行效果", async () => { /* 测试 A */ });
it("测试过滤器一起执行效果", async () => { /* 测试 B，实际上不会跑 */ });
```

```typescript
// 好 — 每个 it 名称唯一且符合 USE
it("emitFilterTrigger，filter1*2 + filter2*3，返回原始数据乘6", async () => { ... });
it("handleFilterEnable，禁用 filter2 后，返回原始数据乘2", async () => { ... });
```

---

## 2. 测试内部有循环（Logic in Tests）

**问题**：`for...of` 循环中包含断言，失败时无法定位是第几次迭代出问题。

```typescript
// 坏
for (const filter of filters) {
  await handleFilterEnable({ filter, value: false, component });
}
expect(filterResultForCurrentComponent.value).toEqual(echartLine.data);
```

**正确做法 A**：明确逐步操作（场景步骤固定时）：

```typescript
// 好 — 步骤可读，失败时立刻知道在第几步
await handleFilterEnable({ filter: filters[0], value: false, component });
await handleFilterEnable({ filter: filters[1], value: false, component });
await handleFilterEnable({ filter: filters[2], value: false, component });
await handleFilterEnable({ filter: filters[3], value: false, component });
expect(filterResultForCurrentComponent.value).toEqual(echartLine.data);
```

**正确做法 B**：场景参数化时用 `test.each`（场景数量多且结构相同）：

```typescript
// 好 — 参数化，每个场景独立
test.each([
  [filters[0], expectedResult0],
  [filters[1], expectedResult1],
])("deleteFilterFromComponent，删除 %s，返回 %s", async (filter, expected) => {
  const res = await deleteFilterFromComponent(filter);
  expect(res.data![0]).toEqual(expected);
});
```

---

## 3. 单个 `it` 测试多个关注点

**问题**：一个 `it` 涵盖"保存过滤器"+"触发过滤链"+"禁用过滤器"+"再次触发"，失败时难以定位。

```typescript
// 坏 — 4个业务阶段混在一个 it
it("测试过滤器收集", async () => {
  await handleSave(filter1); await handleSave(filter2); await handleSave(filter3);
  const result = await filterData.run(...);
  expect(result).toEqual(...);
  await handleFilterEnable({ filter: filter2, value: false, ... });
  expect(filterResultForCurrentComponent.value).toEqual(...);
});
```

```typescript
// 好 — 每个 it 只关注一个阶段
it("FilterData.run，三个过滤器均启用，结果为原始数据*2*3+20000", async () => {
  // 保存三个过滤器 + 断言最终结果
});

it("FilterData.run，禁用乘3过滤器后，结果变为原始数据*2+20000", async () => {
  // 保存三个过滤器 + 禁用filter2 + 断言变更后的结果
});
```

---

## 4. `it` 名称缺少 USE 三要素

**问题**：名称中缺少"场景"或"期望结果"，读者无法从名称判断测试意图。

| 坏 | 好 |
|---|---|
| `"测试过滤器收集"` | `"filterResultForCurrentComponent，启用三个过滤器，结果为原始数据*2*3+20000"` |
| `"过滤器可以成功被删除"` | `"deleteFilterFromComponent，删除第一个过滤器，listenArgs 从4变为3"` |
| `"shouldShowTest：已有过滤器 + 新增过滤器"` | `"shouldShowTest，已有过滤器且 needTest=true，返回 true"` |

---

## 5. `beforeEach` 中漏掉 reset 步骤

**问题**：忘记 reset 某个 store，导致前一个测试的状态泄漏到下一个。

强制顺序：先 reset 所有需要的 store，再 fill。参考 [conventions.md](conventions.md) 中的标准初始化模式。
