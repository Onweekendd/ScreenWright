# 模块化和架构设计

**基于《Code Complete 代码大全》第6-7章**

## 概述

本章讲述如何设计高质量的模块和软件架构，重点是信息隐蔽、模块化和结构化设计原则。

## 模块化设计

### 模块 vs 子程序

**子程序（Routine）**：
- 具有单一功能的可调用函数或过程
- 例如：C 函数、Pascal 过程、Python 函数

**模块（Module）**：
- 数据及作用于数据的子程序的集合
- 例如：C 源文件、Pascal 单元、Ada 包、Java 类
- 提供一组相互联系的功能

**关键区别**：
```
子程序 = 代码
模块 = 代码 + 数据（和数据隐藏）
```

### 模块化设计的价值

**数据支持：**
- 89% 的程序员认为模块化改进了维护性
- 模块化程序的可读性比非模块化高 15%
- 信息隐蔽使大型程序的易修改性提高 4 倍

**目标**：使每个模块成为"黑盒子"
- 接口简单
- 功能明确
- 可预测的输入输出

### 模块内聚性

**原则**：一个模块应该提供一组相互联系的服务。

**好的内聚性示例：**

1. **驾驶控制模拟模块**
   ```
   模块：CruiseControl
   数据：当前设置、当前速度
   功能：
   - SetSpeed(speed)
   - GetCurrentSettings()
   - ResumeFormerSpeed()
   - Deactivate()
   ```
   ✅ 所有功能都与驾驶控制相关

2. **三角函数计算模块**
   ```
   模块：Trigonometry
   功能：
   - Sin(x)
   - Cos(x)
   - Tan(x)
   - Arcsin(x)
   - Arccos(x)
   ```
   ✅ 所有功能都是数学上相关的三角函数

**差的内聚性示例：**
```
模块：Miscellaneous
功能：
- init_stack()      // 堆栈操作
- push()            // 堆栈操作
- pop()             // 堆栈操作
- formatReport()    // 格式化报告 ❌
- defineGlobals()   // 全局数据 ❌
```
❌ 堆栈、报告格式化和全局数据之间没有联系

### 模块耦合

**原则**：模块应提供完整的功能集，使其他部分只需通过定义的接口与之交互。

**良好耦合的设计：**
```
模块：Stack
公开接口：
- init_stack()
- push(item)
- pop()
- is_empty()
- peek()

隐藏实现：
- 数据结构（数组或链表）
- 错误处理细节
- 内存管理策略
```

**设计要点：**
1. **功能完整性**：调用者不应需要访问内部数据
2. **接口清晰**：明确定义的公共接口
3. **最少暴露**：只暴露必要的功能

### 内聚与耦合的平衡

**挑战**：降低子程序间的耦合需要减少全局变量，但创建模块的原因之一是让子程序共享数据。

**解决方案：模块级数据共享**
```c
// 模块内部
static int stack_data[MAX_SIZE];  // 只对模块内子程序可见
static int top = 0;

// 模块公开接口
void push(int item) {
    // 可以直接访问 stack_data 和 top
    stack_data[top++] = item;
}

int pop() {
    // 可以直接访问 stack_data 和 top
    return stack_data[--top];
}
```

**关键决策**：哪些子程序需要对模块数据直接访问？
- ✅ 如果子程序服务于模块的核心功能 → 保留在模块内
- ❌ 如果子程序仅因能访问数据才留在模块中 → 移出

## 信息隐蔽（Information Hiding）

### 什么是信息隐蔽？

**定义**：设计子程序和模块时，隐藏可能变化的细节，使改动影响最小化。

**核心概念**："保密"（Secret）
- 每个模块都有要保护的秘密
- 可能是数据结构、文件格式、算法等
- 通过封装（Encapsulation）实现

**同义词**：
- 信息隐蔽 = 封装 = 黑盒子思想

**重要性**：
- 结构化设计和面向对象设计的基础
- 实践证明有效的少数软件理论之一
- 大型程序易修改性提高 4 倍

### 信息隐蔽的实践

**原则**：模块应该像冰山——只露出 1/8，其余 7/8 隐藏在水下。

**接口设计：**
```javascript
// 好的设计：冰山模式
class LinkedList {
  // 公开接口（冰山一角）
  public:
    getFirst() { ... }
    getLast() { ... }
    add(item) { ... }
    remove(item) { ... }

  // 隐藏实现（水下部分）
  private:
    Node* head;           // 数据结构
    Node* tail;
    int size;
    Node* findNode(index) { ... }  // 内部辅助方法
    validateIndex(index) { ... }
}
```

### 为什么要信息隐蔽？

#### 1. 易于修改

**反模式（直接暴露数据结构）：**
```c
// 到处都是这样的代码
node = node.next;
phone = node.data.phone;

// 问题：如果想改用数组索引代替指针？
// 需要在 20000 行代码中一一修改！
```

**好的设计（使用访问子程序）：**
```c
// 使用访问子程序
node = NearestNeighbor(node);
phone = EmergencyContact(node);

// 改动：只需修改访问子程序，其他代码不变！
Node* NearestNeighbor(Node* node) {
    // 旧实现：链表
    // return node->next;

    // 新实现：数组索引
    return node_array[node.array_index].next;
}
```

#### 2. 清晰意图

**直接操作数据结构：**
```c
node = node.next;  // 这是链表，但...然后呢？
```

**使用访问子程序：**
```c
node = NearestNeighbor(node);  // 清楚表达业务意图！
```

**好处**：
- 代码更易读
- 揭示问题域概念（邻居）而非实现（next 指针）
- 提醒使用更好的命名（node 应该叫什么？）

#### 3. 提高可靠性

**集中安全检查：**
```c
// ❌ 分散的检查
if (node != null && node.next != null) {
    node = node.next;
}
// ... 在 100 个地方重复 ...

// ✅ 集中的检查
Node* GetNextNode(Node* node) {
    if (node == null || node.next == null) {
        return null;  // 或抛出错误
    }
    return node.next;
}

// 使用
node = GetNextNode(node);  // 检查自动进行
```

#### 4. 易于调试

**集中控制点：**
```c
// 在访问子程序中添加调试代码
Node* GetNextNode(Node* node) {
    #ifdef DEBUG
    if (!ValidateNode(node)) {
        LogError("Invalid node in GetNextNode");
    }
    #endif

    return node->next;
}
// 所有访问都会被检查！
```

#### 5. 平行组织

**原则**：对数据的访问要么通过访问子程序，要么直接访问，不能混用。

```c
// ✅ 好的设计：平行组织
// 模块内部：直接访问（性能）
stack_array[top++] = item;

// 模块外部：通过访问子程序（封装）
stack.push(item);

// ❌ 坏的设计：混用
// 有时直接访问，有时通过子程序 → 难以维护和调试
```

### 需要隐藏的常见信息

#### 1. 容易改动的区域

**策略**：将不稳定的区域隔离到一个模块中。

**步骤：**
1. **识别可能改动的地方**
   - 硬件依赖
   - 输入输出格式
   - 复杂数据结构
   - 业务规则
   - 外部接口

2. **分离易变部分**
   - 为每个易变区域创建独立模块
   - 通过接口隔离变化

3. **隐藏变化细节**
   - 不暴露实现
   - 提供稳定的接口

**示例：**
```javascript
// 易变：数据库实现细节
class UserRepository {
    // 隐藏具体数据库（MySQL, PostgreSQL, MongoDB）
    findById(id) {
        // return db.query('SELECT * FROM users WHERE id = ?', [id]);
    }

    save(user) {
        // 隐藏 SQL 细节
        // 如果数据库改变，只需修改这个类
    }
}
```

#### 2. 复杂的数据

**原则**：隐藏复杂数据结构的实现细节。

**示例：**
```c
// 复杂数据结构
typedef struct {
    Node* first;
    Node* last;
    int size;
    Node* current;
    Node* previous;
    // ...更多复杂性
} ComplexDataStructure;

// ❌ 暴露复杂性
extern ComplexDataStructure data;
data.first->next->previous->data = value;

// ✅ 隐藏复杂性
class DataStructure {
public:
    addFirst(item);
    addLast(item);
    getCurrent();
    moveForward();
    moveBackward();

private:
    ComplexDataStructure m_data;  // 隐藏实现
};
```

#### 3. 复杂的逻辑

**原则**：隐藏复杂的算法或业务逻辑。

**示例：**
```javascript
// ❌ 暴露复杂逻辑
function calculateTax(income, deductions, year, state) {
    // 50 行复杂计算...
}

// ✅ 隐藏复杂逻辑
class TaxCalculator {
    calculate(income, deductions) {
        // 隐藏：
        // - 复杂的税率表查找
        // - 州和联邦税计算
        // - 特殊情况处理
        // - 抵扣逻辑
    }

    // 内部辅助方法
    _getFederalTaxRate(year) { ... }
    _getStateTaxRate(state, year) { ... }
    _applyDeductions(...) { ... }
}
```

#### 4. 编程语言层次的操作

**原则**：隐藏低级语言特性。

**示例：**
```c
// ❌ 暴露位操作
unsigned int flags = 0xFF00;
flags |= 0x01;  // 设置第一位
flags &= ~0x02; // 清除第二位
if (flags & 0x04) { ... }  // 检查第三位

// ✅ 隐藏位操作
enum UserPermissions {
    READ = 0x01,
    WRITE = 0x02,
    EXECUTE = 0x04,
    ADMIN = 0x08
};

class UserPermissions {
public:
    grant(Permission p) { flags |= p; }
    revoke(Permission p) { flags &= ~p; }
    has(Permission p) { return flags & p; }

private:
    unsigned int flags;
};

// 使用清晰的高级接口
permissions.grant(UserPermissions::READ);
if (permissions.has(UserPermissions::WRITE)) { ... }
```

## 结构化设计

### 设计层次

**4个设计层次：**

```
层次1：子系统划分
├── 用户接口
├── 数据库接口
├── 业务逻辑
└── 报告生成

层次2：模块划分
├── 用户认证
├── 数据验证
└── 数据转换

层次3：子程序划分
├── validateInput()
├── authenticateUser()
└── transformData()

层次4：子程序内部设计
├── 编写 PDL
├── 选择算法
└── 组织代码
```

### 自顶向下设计（Top-Down Design）

**又称**：逐步求精、分解

**原则**：
1. **从高层次开始**：先定义主要功能
2. **逐步细化**：将每个功能分解为更小的子功能
3. **延迟细节**：在下一层次才考虑细节
4. **每个层次都要验证**

**示例：**
```
Level 1: processUserInput()
    ↓
Level 2: validateInput() → processRequest() → generateResponse()
    ↓
Level 3: validateFormat() → checkPermissions() → executeCommand()
    ↓
Level 4: 代码实现
```

**优势**：
- 符合人类认知（一次只考虑有限细节）
- 易于测试（每层可独立验证）
- 支持迭代开发

**注意事项**：
- 不要过分关注语言细节
- 每层都要验证再进入下一层
- 保持接口清晰

### 结构化设计的组成

1. **系统组织**
   - 黑盒子原则
   - 明确的接口
   - 隐藏实现细节

2. **开发策略**
   - 自顶向下
   - 逐步求精
   - 迭代设计

3. **评估准则**
   - 内聚性
   - 耦合性
   - 信息隐蔽

4. **问题分解**
   - 清晰的问题定义
   - 合理的抽象层次

5. **表达工具**
   - PDL
   - 结构图
   - 流程图

## 面向对象设计

### 核心概念

**面向对象 = 抽象 + 封装 + 继承 + 多态**

**与信息隐蔽的关系**：
- 信息隐蔽是基础
- 面向对象是信息隐蔽的自然延伸
- 类 = 完美的信息隐蔽单元

### OOP 的优势

1. **自然的模块化**
   ```
   类 = 数据 + 操作数据的方法
   ```

2. **更好的封装**
   ```
   私有字段 + 公共方法
   ```

3. **继承支持代码复用**
   ```
   基类定义通用行为
   派生类特化
   ```

4. **多态支持灵活性**
   ```
   同一接口，不同实现
   ```

### 设计权衡

**结构化设计 vs 面向对象：**

| 方面 | 结构化设计 | 面向对象设计 |
|------|----------|------------|
| 组织方式 | 功能分解 | 数据抽象 |
| 主要单元 | 函数/过程 | 类 |
| 代码复用 | 函数库 | 继承/组合 |
| 适用场景 | 算法密集 | 领域建模 |

**实践建议**：
- 两者可以结合使用
- 根据问题选择合适方法
- 不要教条地坚持某一种

## 往返设计（Iterative Design）

### 设计不是线性的

**传统观念**：
```
需求 → 设计 → 编码 → 测试
```

**实际情况**：
```
需求 → 设计 → 编码
         ↑       ↓
         └───────┘
    （迭代和反馈）
```

### 往返设计原则

1. **设计是启发式过程**
   - 需要创造性
   - 需要深刻理解
   - 不是确定性过程

2. **设计随理解深入而演进**
   - 初期设计：粗略
   - 编码时：发现设计问题
   - 测试时：验证设计假设
   - 维护时：改进设计

3. **在合适的时间停止设计**
   - 不要过度设计
   - 不要设计不足
   - 平衡点：80% 设计，20% 实现时调整

### 实践建议

**设计-编码循环：**
```
1. 初始设计（高层次）
2. 编写一些代码
3. 发现设计问题
4. 修改设计
5. 继续编码
6. 重复...
```

**关键**：
- 不要害怕修改设计
- 不要等待"完美设计"
- 在编码中学习设计

## 模块化设计检查清单

### 设计阶段

- [ ] 模块是否提供相互联系的服务？
- [ ] 模块接口是否完整？
- [ ] 是否隐藏了实现细节？
- [ ] 是否只暴露必要的功能？
- [ ] 内聚性是否强？
- [ ] 耦合性是否松散？

### 信息隐蔽

- [ ] 是否识别了易变的区域？
- [ ] 复杂数据是否隐藏？
- [ ] 复杂逻辑是否封装？
- [ ] 低级操作是否抽象？
- [ ] 是否提供了访问子程序而不是直接数据访问？

### 接口设计

- [ ] 接口是否简单清晰？
- [ ] 是否易于理解和使用？
- [ ] 是否稳定（不易变化）？
- [ ] 是否完整（功能齐全）？

## 常见错误

### ❌ 不要

1. **混合抽象层次**
   - 高层业务逻辑和底层实现混在一起

2. **过度暴露**
   - 暴露内部数据结构
   - 提供过多接口

3. **忽视信息隐蔽**
   - 到处直接操作复杂数据结构
   - 分散的错误处理

4. **过早优化**
   - 在设计阶段过度关注性能
   - 忽视可维护性

### ✅ 应该

1. **关注接口而非实现**
   - 先定义公共接口
   - 隐藏实现细节

2. **隔离变化**
   - 识别易变区域
   - 通过接口隔离

3. **使用访问子程序**
   - 封装数据访问
   - 集中验证逻辑

4. **迭代改进设计**
   - 在编码中学习
   - 在测试中验证
   - 在维护中完善

## 何时参考此内容

查阅此材料当：
- 设计新的模块或类
- 重构现有代码结构
- 决定如何组织代码
- 评估软件架构
- 考虑信息隐蔽策略
- 进行代码评审时评估设计质量

## 相关阅读

- **子程序设计**：参见 `02-routines.md`
- **数据相关**：参见 `04-data.md`
- **质量保证**：参见 `07-quality.md`
- **代码风格**：参见 `06-code-style.md`
