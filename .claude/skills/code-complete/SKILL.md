---
name: code-complete
description: 基于 Steve McConnell《Code Complete 代码大全》的软件构建最佳实践指南。当需要以下场景时使用此 skill：(1) 设计软件架构或模块结构，(2) 编写或评审代码以确保质量和可维护性，(3) 创建子程序、函数或方法，(4) 命名变量、常量或其他数据元素，(5) 组织控制结构和语句，(6) 添加注释或文档，(7) 进行代码评审或质量保证，(8) 编写测试或调试代码，(9) 优化代码性能，(10) 重构或改进现有软件，(11) 提升个人编程习惯和实践，(12) 建立团队编码标准和规范
---

# Code Complete 代码大全

基于 Steve McConnell 经典著作《Code Complete 代码大全（第2版）》的软件构建最佳实践。

## 概述

本 skill 提供构建高质量软件的全面指导，涵盖从设计到优化的完整开发生命周期。材料按9个主题参考组织，便于高效访问。

**核心理念**：软件构建是艺术、科学和技艺的结合。高质量代码源于良好习惯、正确方法和持续改进。

## 主题参考

本 skill 包含9个主题参考：

1. **[01-foundations.md](references/01-foundations.md)** - 软件构建基础（第1-3章）
   - 软件开发的隐喻
   - 准备工作和技术选择

2. **[02-routines.md](references/02-routines.md)** - 子程序设计（第4-5章）
   - 高质量子程序设计原则
   - 参数设计和验证
   - 命名规范和最佳实践

3. **[03-design.md](references/03-design.md)** - 模块化和架构（第6-7章）
   - 软件设计的重要性
   - 复杂度管理策略
   - 设计模式和启发式方法

4. **[04-data.md](references/04-data.md)** - 数据相关（第8-12章）
   - 数据定义和声明
   - 数据结构选择
   - 数据组织和访问模式

5. **[05-statements.md](references/05-statements.md)** - 控制结构（第13-17章）
   - 语句组织
   - 条件语句和逻辑
   - 循环结构和迭代

6. **[06-code-style.md](references/06-code-style.md)** - 代码风格和文档（第18-20章）
   - 代码格式和布局
   - 注释编写技巧
   - 编程风格指南

7. **[07-quality.md](references/07-quality.md)** - 质量保证（第21-27章）
   - 项目规模对开发的影响
   - 质量保证方法和评审
   - 测试、调试和系统集成

8. **[08-optimization.md](references/08-optimization.md)** - 代码优化（第28-30章）
   - 性能优化策略
   - 代码调整技术
   - 软件进化和重构

9. **[09-philosophy.md](references/09-philosophy.md)** - 编程哲学（第31-33章）
   - 程序员性格和特质
   - 开发方法论
   - 持续学习资源

## 快速参考

### 常见开发任务

| 任务 | 参考文档 | 要点 |
|------|---------|------|
| **设计子程序** | [02-routines.md](references/02-routines.md) | 内聚性、长度<50行、参数<7个 |
| **变量命名** | [04-data.md](references/04-data.md) | 面向问题命名、具体vs一般 |
| **编写循环** | [05-statements.md](references/05-statements.md) | 保持简单、最小化嵌套、使用有意义的名称 |
| **添加注释** | [06-code-style.md](references/06-code-style.md) | 注释为什么而非什么、使用PDL |
| **代码评审** | [07-quality.md](references/07-quality.md) | 使用检查表、关注缺陷而非修正 |
| **性能优化** | [08-optimization.md](references/08-optimization.md) | 先测量、Pareto原则（80/20法则） |
| **重构** | [08-optimization.md](references/08-optimization.md) | 提高内在质量、创建新子程序 |

### 关键指标和指南

| 指标 | 指南 | 参考文档 |
|------|------|---------|
| 子程序长度 | < 50行 | [02-routines.md](references/02-routines.md) |
| 参数数量 | < 7个 | [02-routines.md](references/02-routines.md) |
| 嵌套深度 | < 3层 | [05-statements.md](references/05-statements.md) |
| 函数复杂度 | < 10个决策点 | [05-statements.md](references/05-statements.md) |
| 注释密度 | 根据清晰度需要 | [06-code-style.md](references/06-code-style.md) |

## 核心原则

### 1. 正确性优先

- 正确的代码比快速的代码更重要
- 不要为了性能牺牲正确性
- 先使代码工作，再使代码快速

### 2. 可读性至上

- 为人编写代码，其次为计算机
- 优先清晰而非聪明
- 好的代码只需最少注释

### 3. 模块化设计

- 将复杂问题分解为简单部分
- 创建短小、专注的子程序
- 限制子程序复杂度

### 4. 质量内建

- 从一开始就注重质量
- 主动使用评审和测试
- 不要依赖事后修复

### 5. 持续改进

- 重视软件进化
- 每次修改提高质量
- 培养良好编程习惯

## 使用此 Skill

### 针对特定开发阶段

**设计阶段：**
- 架构设计 → [03-design.md](references/03-design.md)
- 数据结构 → [04-data.md](references/04-data.md)
- 子程序规划 → [02-routines.md](references/02-routines.md)

**编码阶段：**
- 变量命名 → [04-data.md](references/04-data.md)
- 控制结构 → [05-statements.md](references/05-statements.md)
- 注释 → [06-code-style.md](references/06-code-style.md)
- 代码格式 → [06-code-style.md](references/06-code-style.md)

**质量保证：**
- 代码评审 → [07-quality.md](references/07-quality.md)
- 测试 → [07-quality.md](references/07-quality.md)
- 调试 → [07-quality.md](references/07-quality.md)
- 优化 → [08-optimization.md](references/08-optimization.md)

**重构和维护：**
- 重构 → [08-optimization.md](references/08-optimization.md)
- 性能 → [08-optimization.md](references/08-optimization.md)
- 质量改进 → [07-quality.md](references/07-quality.md)

**个人发展：**
- 编程习惯 → [09-philosophy.md](references/09-philosophy.md)
- 团队实践 → [09-philosophy.md](references/09-philosophy.md)

### 有效使用模式

**代码评审时**：使用各参考中的检查表系统性地评估质量。

**编写代码时**：针对手头的任务查阅特定参考（如子程序设计查阅 [02-routines.md](references/02-routines.md)）。

**调试时**：从 [07-quality.md](references/07-quality.md) 的调试章节开始，然后应用具体技术。

**优化时**：遵循 [08-optimization.md](references/08-optimization.md) 的工作流：测量→识别热点→调整→再测量。

**建立标准时**：从多个参考中提取相关指南，创建团队特定的检查表。

## 最佳实践总结

### ✅ 应该做

1. **编码前计划**：先设计，后实现
2. **保持简单**：编写简单直接的代码；避免过度设计
3. **关注质量**：编写可读代码、进行评审、维护测试
4. **持续重构**：每次修改都改进代码结构
5. **持续学习**：研究优秀代码、阅读技术文献

### ❌ 不应该做

1. **过早优化**：测量前先优化；优先考虑正确性
2. **忽视质量**：不要为了速度跳过评审、测试或可读性
3. **积累技术债务**：发现问题立即修复
4. **教条主义**：对不同方法保持开放；根据情况选择工具

## 相关资源

### 推荐书籍

1. **《Code Complete 代码大全》** - Steve McConnell（本 skill 来源）
2. **《Refactoring 重构》** - Martin Fowler（与第30章互补）
3. **《Clean Code 代码整洁之道》** - Robert C. Martin（与风格章节互补）

### 专业组织

- ACM (计算机协会)
- IEEE Computer Society（IEEE计算机分会）

---

**注意**：每个参考都包含详细的检查表、示例和常见陷阱。在开发和代码评审时将它们作为实用指南使用。
