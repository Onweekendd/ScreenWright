---
name: sw-unit-test
description: Screenwright 低代码平台单元测试生成指南。技术栈：Vitest + @vue/test-utils + jsdom。核心模式：不挂载 Vue 组件，直接调用 composable hooks 测试业务逻辑。当用户需要：(1) 为某个 hook/composable 新建测试文件，(2) 向现有测试文件追加测试用例，(3) 评审或修改已有测试代码时使用。触发场景："给 useXxx 写测试"、"这个 hook 怎么测"、"帮我补充测试用例"。
---

# Screenwright Unit Test Guide

## 核心原则

**不挂载任何 Vue 组件**，直接调用 composable hooks 测试业务逻辑。

每个测试文件对应一个业务 hook，放在 `src/tests/<module>/useHookName.test.ts`，mock JSON 与测试文件同目录。

## 工作流

### Step 1：确认被测 hook 和场景

明确：
- 被测 hook 的路径和名称
- 测试场景列表（正常路径 + 边界情况 + 错误路径）

### Step 2：读取被测 hook 的源码

了解 hook 依赖哪些其他 hook、API 接口、store，这决定了需要 mock 哪些模块。

### Step 3：准备 mock JSON

查看现有 `componentData.mock.json` 是否满足需求。如需新数据，按最小必要原则构造 JSON。

### Step 4：生成测试文件

按照 [固定模板](references/conventions.md) 生成，严格遵守 [反模式清单](references/anti-patterns.md)。

---

## 测试命名规范（USE）

每个 `it` 名称必须包含三部分：

```
"<被测方法>，<场景/条件>，<预期结果>"
```

示例：
```typescript
// 好
it("deleteFilterFromComponent，删除已绑定的过滤器，listenArgs 数量减一")
it("handleSave，保存同名过滤器，返回 success: false 且 error 为 duplicate_name")
it("shouldShowTest，过滤器已禁用时 needTest=true，仍返回 false")

// 坏
it("测试过滤器")        // 无场景、无期望
it("过滤器可以被删除")  // 缺场景
it("it works")
```

---

## 断言原则

每个 `it` 只测一个关注点。多个 `expect` 可以，但必须描述同一件事：

```typescript
// 好 — 都在描述"删除成功后的状态"
expect(currentFilter.value.length).toBe(3)
expect(selectTargetData.value[0].listenArgs.length).toBe(3)
expect(filter.bindComponent.length).toBe(0)

// 坏 — 混合了"保存结果"和"UI 状态"
expect(res.success).toBe(true)
expect(filter.notSaved).toBe(false)
expect(mockLogger).toHaveBeenCalled()   // 与上面无关
```

---

## 快速检查清单

生成测试前逐项确认：

- [ ] `it` 名称符合 USE 格式（方法 + 场景 + 期望），无重复
- [ ] mock JSON 使用深拷贝（`JSON.parse(JSON.stringify(...))`）
- [ ] `beforeEach` 有完整的 reset → fill 顺序
- [ ] `it` 内部没有 `if/for/while` 控制流
- [ ] 每个 `it` 只关注一个关注点
- [ ] `afterEach` 里没有无效代码（结果未被使用的表达式）
- [ ] `it` 中操作步骤多于 3 步时，考虑拆分为多个 `it`

---

## 参考资料

- [固定模板与初始化模式](references/conventions.md) — mock 样板代码、beforeEach/afterEach 写法
- [反模式清单](references/anti-patterns.md) — 本项目已出现的错误模式及修正方法
