---
name: design-patterns
description: |
  设计模式助手，基于《深入设计模式 v2021-1.25》。包含GoF 22种经典设计模式的详细说明。

  当需要以下帮助时使用此skill：
  (1) 理解某个设计模式的概念、结构和应用场景
  (2) 选择合适的设计模式来解决特定问题
  (3) 学习设计模式的实现方式和优缺点
  (4) 了解不同设计模式之间的关系
  (5) 代码重构时引入设计模式
---

# 设计模式助手

本skill基于《深入设计模式》，涵盖了GoF（Gang of Four）提出的22种经典设计模式。

## 模式分类总览

### 创建型模式 (5种)
处理对象创建机制，增加代码灵活性和可复用性。

| 模式 | 英文 | 主要用途 | 详细文档 |
|------|------|----------|----------|
| 工厂方法 | Factory Method | 定义创建对象的接口，由子类决定实例化类型 | [查看 →](references/creational/factory-method.md) |
| 抽象工厂 | Abstract Factory | 创建一系列相关或依赖对象的家族 | [查看 →](references/creational/abstract-factory.md) |
| 生成器 | Builder | 分步骤创建复杂对象 | [查看 →](references/creational/builder.md) |
| 原型 | Prototype | 复制已有对象，无需依赖所属类 | [查看 →](references/creational/prototype.md) |
| 单例 | Singleton | 保证类只有一个实例，提供全局访问点 | [查看 →](references/creational/singleton.md) |

**快速索引**：[创建型模式总览](references/creational-patterns.md) | [所有模式文档](references/README.md)

### 结构型模式 (7种)
介绍如何将对象和类组装成较大的结构。

| 模式 | 英文 | 主要用途 | 详细文档 |
|------|------|----------|----------|
| 适配器 | Adapter | 让接口不兼容的对象可以协同工作 | [查看 →](references/structural/adapter.md)
| 桥接 | Bridge | 将抽象部分与实现部分分离 | [查看 →](references/structural/bridge.md)
| 组合 | Composite | 将对象组合成树形结构以表示部分-整体层次 | [查看 →](references/structural/composite.md)
| 装饰 | Decorator | 动态地为对象添加行为 | [查看 →](references/structural/decorator.md)
| 外观 | Facade | 为子系统中的一组接口提供统一接口 | [查看 →](references/structural/facade.md)
| 享元 | Flyweight | 共享对象以减少内存占用 | [查看 →](references/structural/flyweight.md)
| 代理 | Proxy | 为其他对象提供代理以控制对这个对象的访问 | [查看 →](references/structural/proxy.md)

**快速索引**：[结构型模式总览](references/structural-patterns.md) | [所有模式文档](references/README.md)

### 行为模式 (11种)
负责对象间的高效沟通和职责委派。

| 模式 | 英文 | 主要用途 | 详细文档 |
|------|------|----------|----------|
| 责任链 | Chain of Responsibility | 将请求沿处理链传递 | [查看 →](references/behavioral/chain-of-responsibility.md)
| 命令 | Command | 将请求转换为对象 | [查看 →](references/behavioral/command.md)
| 迭代器 | Iterator | 遍历集合元素 | [查看 →](references/behavioral/iterator.md)
| 中介者 | Mediator | 集中管理对象间的交互 | [查看 →](references/behavioral/mediator.md)
| 备忘录 | Memento | 保存和恢复对象状态 | [查看 →](references/behavioral/memento.md)
| 观察者 | Observer | 定义订阅机制，通知多个订阅者 | [查看 →](references/behavioral/observer.md)
| 状态 | State | 允许对象在内部状态改变时改变行为 | [查看 →](references/behavioral/state.md)
| 策略 | Strategy | 定义一系列算法，使它们可以互相替换 | [查看 →](references/behavioral/strategy.md)
| 模板方法 | Template Method | 在父类中定义算法框架，子类实现具体步骤 | [查看 →](references/behavioral/template-method.md)
| 访问者 | Visitor | 在不修改类的前提下定义新操作 | [查看 →](references/behavioral/visitor.md)

**快速索引**：[行为模式总览](references/behavioral-patterns.md) | [所有模式文档](references/README.md)

## 如何使用本skill

### 查找特定模式
- 查阅上表找到对应的设计模式
- 点击详细说明链接查看完整的模式介绍

### 选择设计模式
根据你的问题类型选择：
1. **对象创建问题** → 查看创建型模式
2. **对象结构/组合问题** → 查看结构型模式
3. **对象交互/通信问题** → 查看行为模式

### 每个模式包含的内容
- **问题**：模式要解决的实际问题
- **解决方案**：模式的核心思想
- **结构**：UML图和组件说明
- **伪代码**：实现示例
- **应用场景**：何时使用该模式
- **实现方式**：具体实现步骤
- **优缺点**：使用该模式的利弊
- **模式关系**：与其他模式的关系

## 设计原则参考

良好的软件设计应当遵循：
- **单一职责原则**：一个类只负责一件事
- **开闭原则**：对扩展开放，对修改封闭
- **里氏替换原则**：子类应能替换父类
- **接口隔离原则**：不应强迫实现不用的接口
- **依赖倒置原则**：依赖抽象而非具体实现
