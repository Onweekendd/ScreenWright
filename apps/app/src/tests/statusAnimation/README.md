# 状态动画测试模块

## 概述

原始的大型测试文件 `useStatusAnimation.test.ts`（2268 行）已按功能模块拆分为多个小的、可维护的测试文件。这种拆分提高了测试的可读性、可维护性和执行效率。

## 文件结构

### 核心测试文件

1. **`useStatusAnimation.basic.test.ts`** - 基础功能测试

   - 状态动画初始化
   - 添加图片组件到状态动画
   - 全量创建组件动画配置

2. **`useStatusAnimation.properties.test.ts`** - 属性管理测试

   - 按需为组件添加过渡属性
   - 删除组件属性相关测试
   - `getRenderTableData` 相关测试
   - 多组件属性独立性测试

3. **`useStatusAnimation.trigger.test.ts`** - 动画触发测试

   - 组件动画触发时按需赋值属性测试
   - 嵌套属性按需赋值测试
   - 安全性测试（未添加任何属性时的处理）

4. **`useStatusAnimation.generator.test.ts`** - 生成器系统测试

   - 生成器基本功能测试（直接映射、嵌套映射、复合映射）
   - 生成器与动画触发集成测试
   - 生成器自定义映射测试
   - 生成器调试模式测试
   - 生成器边界情况测试
   - 性能测试

5. **`useStatusAnimation.extract.test.ts`** - 生成器反向提取测试

   - 反向提取基本功能测试
   - 各种映射类型的反向提取测试
   - 双向转换一致性测试
   - 自定义映射测试
   - 性能测试

6. **`useStatusAnimation.sync.test.ts`** - 配置同步测试
   - 配置同步反向提取测试
   - 各种属性类型的同步测试（直接映射、嵌套映射、复合映射）
   - 图片属性同步测试

### 支持文件

7. **`test-utils.ts`** - 公共测试工具

   - 包含所有测试的公共 mock 设置
   - 提供统一的测试环境设置和清理
   - 封装常用的测试操作（添加组件、触发动画等）

8. **`componentData.mock.json`** - 测试数据
   - 包含用于测试的组件数据

## 运行测试

### 运行所有状态动画测试

```bash
npm test statusAnimation
```

### 运行特定模块测试

```bash
# 基础功能测试
npm test useStatusAnimation.basic.test.ts

# 属性管理测试
npm test useStatusAnimation.properties.test.ts

# 动画触发测试
npm test useStatusAnimation.trigger.test.ts

# 生成器系统测试
npm test useStatusAnimation.generator.test.ts

# 反向提取测试
npm test useStatusAnimation.extract.test.ts

# 配置同步测试
npm test useStatusAnimation.sync.test.ts
```

### 运行特定测试用例

```bash
# 运行包含特定关键词的测试
npm test -- --grep "基础功能"
npm test -- --grep "生成器"
npm test -- --grep "反向提取"
```

## 测试覆盖范围

### 功能覆盖

- ✅ 状态动画初始化
- ✅ 组件添加和移除
- ✅ 属性管理（添加、删除、修改）
- ✅ 动画触发和执行
- ✅ 生成器系统（构建、提取、验证）
- ✅ 配置同步
- ✅ 边界情况和错误处理
- ✅ 性能测试

### 映射类型覆盖

- ✅ 直接映射（direct）
- ✅ 嵌套映射（nested）
- ✅ 复合映射（compound）
- ✅ 数组索引映射（array）

### 属性类型覆盖

- ✅ 位置属性（left, top）
- ✅ 尺寸属性（width, height）
- ✅ 透明度属性（opacity）
- ✅ 旋转属性（rotateX, rotateY, rotateZ）
- ✅ 显示属性（display, zIndex）
- ✅ 图片属性（image）

## 测试工具类

### StatusAnimationTestUtils

提供统一的测试环境管理：

```typescript
const testUtils = createTestUtils()

// 设置测试环境
await testUtils.setupTestEnvironment()

// 获取测试组件
const imageComponent = testUtils.getImageComponent()

// 初始化状态动画
testUtils.initStatusAnimation()

// 设置当前动画和状态
const { animationId, statusId } = testUtils.setupCurrentAnimationAndStatus()

// 添加组件到状态动画
await testUtils.addComponentToStatusAnimation(imageComponent)

// 添加过渡属性
await testUtils.addTransitionProperties(componentId, ["opacity", "left"])

// 触发状态动画
const result = await testUtils.triggerStatusAnimation(componentId, animationId, statusId)

// 同步组件配置
await testUtils.syncComponentConfig(imageComponent)

// 清理测试环境
testUtils.cleanupTestEnvironment()
```

## 维护指南

### 添加新测试

1. 确定测试属于哪个功能模块
2. 在对应的测试文件中添加测试用例
3. 使用 `StatusAnimationTestUtils` 进行环境设置
4. 遵循现有的测试命名和结构规范

### 修改现有测试

1. 确保修改不会影响其他模块的测试
2. 更新相关的文档和注释
3. 运行完整的测试套件确保没有回归

### 性能考虑

- 每个测试文件独立运行，避免相互影响
- 使用 `beforeEach` 和 `afterEach` 确保测试隔离
- 大型测试数据使用 mock 避免真实数据依赖

## 注意事项

1. **测试隔离**：每个测试文件都有独立的 `beforeEach` 和 `afterEach` 设置
2. **Mock 数据**：所有测试使用统一的 mock 数据，确保结果可预测
3. **异步处理**：动画相关的测试都是异步的，需要正确处理 Promise
4. **类型安全**：所有测试都使用 TypeScript，确保类型安全
5. **错误处理**：测试包含各种边界情况和错误场景的验证

## 贡献指南

1. 新功能测试应该添加到相应的模块文件中
2. 如果新功能涉及多个模块，考虑是否需要创建新的测试文件
3. 保持测试的简洁性和可读性
4. 确保测试覆盖率达到要求
5. 更新此 README 文档以反映新的测试结构
