# xUnit 模式

## 测试用例（Test Case）

> "如何表示测试用例的上下文？创建一个TestCase的子类。"

**结构**：
- 每种新固件应该是TestCase的新子类
- 每个测试方法是TestCase的实例
- 继承共用固件，独立执行每个测试

## 测试方法（Test Method）

> "如何表示单个测试？作为测试类的一个方法。"

**命名约定**：
- 方法名以"test"开头
- 描述被测试的行为
- 清楚说明期望的结果

```java
public void testMultiplication() {
    Dollar five = new Dollar(5);
    five.times(2);
    assertEquals(10, five.amount);
}
```

## 运行方法（Run Method）

> "如何执行测试？在测试对象上调用run()。"

**接口**：
```java
public interface Test {
    public abstract int countTestCases();
    public abstract void run(TestResult result);
}
```

**特点**：
- TestCase和TestSuite都实现此接口
- 支持可组合和可运行的测试
- 动态类型语言可以直接实现操作

## 测试套件（Test Suite）

> "如何表示多个测试？使用TestSuite组合测试。"

**实现**：
- 将测试添加到集合中
- 依次运行每个测试
- 支持嵌套套件

## 测试结果（Test Result）

> "如何收集测试结果？传递TestResult对象给测试的run方法。"

**区分**：
- **失败（Failure）** - 断言失败，调试时间更长
- **错误（Error）** - 异常抛出
- GUI通常将错误放在顶部

## 设置/拆除（SetUp/TearDown）

> "如何为测试准备环境和清理？覆盖setUp()和tearDown()。"

**执行顺序**：setUp → testMethod → tearDown

**模板方法模式**：
- 框架定义算法骨架
- 子类覆盖特定步骤

## 插件方法（Plug-in Methods）

> "如何让框架调用用户代码？定义框架将调用的方法。"

**方法**：
- `setUp()` - 每个测试前调用
- `tearDown()` - 每个测试后调用
- `runTest()` - 执行测试逻辑

**避免大步重构**：
- 想要大改时，思考最后一步如何变得平凡
- 然后向后工作

## 反射（Reflection）

> "如何自动发现测试方法？使用反射查找以"test"开头的方法。"

**收益**：
- 不需要显式注册测试
- 添加新测试只需写新方法
- 框架自动发现和执行

## 参数集合（Collection of Parameters）

> "如何传递多个参数给操作？将它们收集到一个对象中。"

**应用**：
- 简化方法签名
- 易于添加新参数
- 相关参数组合在一起

## 哈希标记（HashMark）

> "如何快速找到测试中的问题？使用标记定位。"

**用途**：
- 标记测试中的关注点
- 帮助快速导航问题
- 支持调试

## xUnit 实现指南

如果需要实现自己的测试框架：

1. **首先关注测试用例** - 实现细节不如测试用例重要
2. **支持隔离和组合的测试** - 这是先行开发的基础
3. **保持简单** - xUnit的精神是简洁
4. **失败 vs 错误** - 区分断言失败和异常

**为什么要实现自己的xUnit**：
- **精通** - 对工具有掌控感
- **探索** - 学习新语言时，实现前8-10个测试用例会探索许多日常编程功能
