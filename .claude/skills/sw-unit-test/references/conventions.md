# Screenwright 测试固定模板

## 目录结构

```
src/tests/
├── setup.ts                        # 全局 setup（禁用 Transition 动画）
├── <module>/
│   ├── componentData.mock.json     # mock 数据
│   └── useHookName.test.ts         # 测试文件
```

---

## 文件头部固定 mock（每个测试文件必须）

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// 1. Mock Vue 生命周期 — 阻止 composable 内部的副作用在测试中执行
const mockOnBeforeMount = vi.fn();
const mockOnMounted = vi.fn();
const mockOnUnmounted = vi.fn();
const mockInject = vi.fn();

vi.mock("vue", async () => ({
  ...((await vi.importActual("vue")) as any),
  onBeforeMount: (fn: Function) => mockOnBeforeMount(fn),
  onMounted: (fn: Function) => mockOnMounted(fn),
  onUnmounted: (fn: Function) => mockOnUnmounted(fn),
  inject: (key: any, defaultValue?: any) => mockInject(key, defaultValue)
}));

// 2. Mock 工具函数 — 固定随机值
vi.mock("@/utils/utils", () => ({
  uuid: vi.fn(() => "mock-uuid-1234"),
  handleMessageBox: vi.fn(() => Promise.resolve(true))
}));

// 3. Mock API — 深拷贝返回，防止测试间数据污染
import mockDetail from "./componentData.mock.json";

vi.mock("@/api/build", () => ({
  getLargeScreenInfo: vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve({ result: JSON.parse(JSON.stringify(mockDetail)) })
    )
}));

// 4. Mock 服务模块
vi.mock("@/utils/service", () => ({ createRequest: vi.fn() }));
vi.mock("@/utils/cacheService", () => ({ createRequest: vi.fn() }));
```

---

## beforeEach — 标准初始化顺序

顺序固定：**reset 所有 store → 加载 mock 数据 → fill 所有 store**。

```typescript
beforeEach(async () => {
  const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
  const { setGroupData, groupData, resetGroupData } = useGlobalComponentData();
  const { initCallbackArguments, onClear } = useCallbackArguments();
  const { setDetail2Config, resetEditStore } = useEditStore();
  const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();

  // Step 1: 重置
  onClear();
  resetEditStore();
  resetNavInfo();
  resetGroupData();
  resetDataFilter();

  // Step 2: 加载
  const res = await getLargeScreenInfo(23595);

  // Step 3: 填充
  setNavInfo(res.result);
  setGroupData(res.result);
  setDetail2Config(res.result);
  initCallbackArguments(groupData.value);
  cloneDataFilterOnInit();
});
```

---

## 工厂函数模式 — 多 describe 共享初始化时使用

当一个测试文件有多个 `describe`，且每个 `describe` 的初始状态不同时，用工厂函数替代 `beforeEach`：

```typescript
const makeInitializedStores = async () => {
  const { resetNavInfo, setNavInfo } = useLargeScreenInfo();
  const { setGroupData, groupData, resetGroupData } = useGlobalComponentData();
  const { initCallbackArguments, onClear } = useCallbackArguments();
  const { setDetail2Config, resetEditStore } = useEditStore();
  const { resetDataFilter, cloneDataFilterOnInit } = useDataFilter();

  onClear(); resetEditStore(); resetNavInfo(); resetGroupData(); resetDataFilter();

  const res = await getLargeScreenInfo(23595);
  setNavInfo(res.result);
  setGroupData(res.result);
  setDetail2Config(res.result);
  initCallbackArguments(groupData.value);
  cloneDataFilterOnInit();

  return { groupData };
};

describe("场景 A", () => {
  it("...", async () => {
    const { groupData } = await makeInitializedStores();
    // ...
  });
});
```

---

## afterEach — 清理缓存并验证代理清洁性

`buildWorkerCacheInput` 构建完整的大屏缓存对象（同步到 IndexedDB），`structuredClone` 用于**验证数据中没有 Vue 代理对象**——如果组件数据被 Vue reactive 包裹，`structuredClone` 会抛出错误，这是一个有意义的不变式检查。

```typescript
afterEach(async () => {
  const { buildWorkerCacheInput } = useCacheData();
  const workerCacheInput = buildWorkerCacheInput(Date.now());
  structuredClone(workerCacheInput); // 验证缓存数据无 Vue 代理污染，会在有代理时抛出

  // 重置 mock（如有）
  mockFnWithCallCount.mockReset();

  await nextTick();
  await nextTick();
});
```

---

## it 内部写法

在 `it` 中直接调用 hook，解构出 state 和方法后操作和断言：

```typescript
it("handleSave，保存同名过滤器，返回 success: false 且 error 为 duplicate_name", async () => {
  // Arrange
  const { handleSave, addNewDataFilterToGlobal } = useDataFilter();
  const { groupData } = useGlobalComponentData();
  const { setTargetSelectChart } = useEditStore();
  setTargetSelectChart(`${groupData.value[0].id}`);

  // Act
  const filter = addNewDataFilterToGlobal();
  const result = await handleSave(filter);

  // Assert
  expect(result.success).toBe(false);
  expect(result.error).toBe("duplicate_name");
});
```
