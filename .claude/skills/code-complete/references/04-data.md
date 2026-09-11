# 数据设计

**基于《Code Complete 代码大全》第8-12章**

## 概述

数据是程序的核心。良好的数据设计能极大提高代码的可读性、可维护性和可靠性。本章讲述如何命名、组织和使用数据。

## 数据类型定义

### 为什么要自定义类型？

**自定义类型**是程序员最有力的工具之一，使程序更易读易维护。

**示例：**
```c
// ❌ 使用通用类型
float latitude;
float longitude;
float elevation;

// ✅ 使用自定义类型
typedef float Coordinate_t;

Coordinate_t latitude;   // latitude in degrees
Coordinate_t longitude;  // longitude in degrees
Coordinate_t elevation;  // elevation in meters from earth center
```

**优势：**
1. **可读性**：`Coordinate_t` 比 `float` 更清楚地表达意图
2. **可维护性**：如需改为 `double`，只需修改一处
3. **自文档化**：类型名本身就说明了用途

### 何时使用自定义类型？

**原则**：为任何有业务意义的概念创建类型。

**示例：**
```c
// ✅ 好的实践
typedef int UserID;           // 用户ID
typedef int StatusCode;       // 状态码
typedef float Temperature;     // 温度
typedef int AccountNumber;    // 账号

// ❌ 过度使用
typedef int MyInt1;           // 无意义
typedef int MyInt2;           // 无意义
```

## 数据命名

### 命名的重要性

**变量名决定代码可读性**

**反例：**
```c
X = X - XX;
XXX = Aretha + SalesTax(Aretha);
X = X + LateFee(X1, X) + XXX;
X = X + Interest(X1, X);
```
**问题**：X, XX, XXX, Aretha 代表什么？

**正例：**
```c
Balance = Balance - LastPayment;
MonthlyTotal = NewPurchases + SalesTax(NewPurchases);
Balance = Balance + LateFee(CustomerID, Balance) + MonthlyTotal;
Balance = Balance + Interest(CustomerID, Balance);
```
**清楚**：每个变量名都准确描述了它代表什么

### 好的命名原则

#### 1. 完全准确地描述变量

**方法**：用自然语言描述变量代表的实体，这个描述本身就是最好的名字。

**示例：**
| 变量用途 | 好的名字 | 坏的名字 |
|---------|---------|---------|
| 火车速度 | `Velocity`, `TrainVelocity`, `VelocityInMPH` | `VELT`, `V`, `TV`, `X` |
| 今天日期 | `CurrentDate`, `CrntDate` | `CD`, `Current`, `C`, `X` |
| 每页行数 | `LinesPerPage` | `LPP`, `Lines`, `X`, `X1` |

#### 2. 面向问题而非解决方案

**原则**：名称应说明"是什么"而非"怎么做"。

**示例：**
| 不好（计算导向） | 好（问题导向） | 原因 |
|---------------|--------------|------|
| `InputRec` | `EmployeeData` | "Employee" 是问题域概念 |
| `BitFlag` | `PrinterReady` | "PrinterReady" 说明业务含义 |
| `CalcVal` | `Sum` | "Sum" 说明计算的目的 |

#### 3. 最佳名称长度

**研究结论：**
- 10-16 个字符：最容易调试（COBOL）
- 8-20 个字符：调试难度相同
- **推荐**：9-15 个字符

**太长的例子：**
- ❌ `NumberOfPeopleOnTheUSOlympicTeam`
- ❌ `MaximumNumberOfPointsSince1896`

**太短的例子：**
- ❌ `N`, `NP`, `NTM`
- ❌ `M`, `MP`, `Max`, `Points`

**合适的长度：**
- ✅ `TeamMemberCount`, `NumTeamMembers`
- ✅ `SeatCount`, `NumSeats`

#### 4. 命名约定

**常见约定：**

1. **驼峰命名（camelCase）**
   ```javascript
   // ✅ 推荐用于 JavaScript/Java
   employeeName
   calculateTotal
   isActiveUser
   ```

2. **下划线命名（snake_case）**
   ```python
   # ✅ 推荐用于 Python
   employee_name
   calculate_total
   is_active_user
   ```

3. **帕斯卡命名（PascalCase）**
   ```csharp
   // ✅ 推荐用于类名
   EmployeeRecord
   DataProcessor
   ```

4. **匈牙利命名法（Hungarian Notation）**
   ```c
   // 示例：前缀表示类型
   int iCount;        // i = int
   char szName[100];  // sz = zero-terminated string
   BOOL bIsValid;     // b = boolean
   ```
   **注意**：现代开发中已较少使用，但在某些语言中仍有价值

**选择标准：**
- 遵循语言/项目的现有约定
- 保持一致性
- 团队统一标准

### 特定类型的命名规则

#### 循环变量

**短名称可接受的情况：**
```c
// ✅ 短循环中的循环变量
for (int i = 0; i < count; i++) { ... }

// ❌ 长循环或嵌套循环
for (int i = 0; i < 100; i++) {
    for (int j = 0; j < 100; j++) {
        // i 和 j 是什么？难以理解
    }
}

// ✅ 使用有意义的名称
for (int row = 0; row < rowCount; row++) {
    for (int col = 0; col < columnCount; col++) {
        // 清楚：row 和 column
    }
}
```

#### 临时变量

即使临时变量也应清晰命名：
```javascript
// ❌ 模糊
let t = calculateValue();
let x = process(t);

// ✅ 清晰
let totalAmount = calculateValue();
let finalResult = process(totalAmount);
```

#### 布尔变量

**命名模式：**
- 使用 `is`, `has`, `can`, `should` 等前缀
- 表达肯定/否定状态

**示例：**
| 好的名字 | 坏的名字 | 原因 |
|---------|---------|------|
| `isValid` | `valid` | 不是问句形式 |
| `hasData` | `data` | 不明确 |
| `canProceed` | `ok` | 不具体 |
| `shouldUpdate` | `update` | 是命令还是判断？ |

#### 状态变量

表示状态的变量应清晰说明状态：
```c
// ✅ 好的状态命名
enum ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    ERROR
};

// ❌ 模糊的状态命名
enum State {
    STATE_1,
    STATE_2,
    STATE_3,
    STATE_4
};
```

## 变量使用

### 作用域（Scope）

**定义**：变量名的影响范围，即可见性。

**原则：尽可能减小作用域**

**作用域层次：**
1. **块级作用域**（最小）
   ```c
   if (condition) {
       int temp = calculate();
       use(temp);
       // temp 在此块外不可见
   }
   ```

2. **函数级作用域**
   ```javascript
   function process() {
       let count = 0;  // 只在函数内可见
       count++;
   }
   ```

3. **模块级作用域**
   ```python
   # 模块级变量
   _connection_pool = []  # 以下划线开头表示私有
   ```

4. **全局作用域**（最大，应避免）
   ```c
   int globalCounter;  // ❌ 避免！任何地方都可以访问
   ```

**为什么最小化作用域？**
- **可管理性**：需要记住的变量越少，出错越少
- **可读性**：局部变量更易理解
- **可维护性**：修改局部变量影响有限

**实践建议：**
```c
// ❌ 过大的作用域
int count;  // 全局变量

void function1() {
    count = 10;
}

void function2() {
    count = 20;  // 可能意外影响 function1
}

// ✅ 最小化的作用域
void function1() {
    int count = 10;  // 局部变量
}

void function2() {
    int count = 20;  // 独立的局部变量
}
```

### 持久性（Lifetime）

**定义**：变量存在的时间。

**类型：**
1. **静态持久**：程序整个生命周期
   ```c
   static int count = 0;  // 只初始化一次
   ```

2. **自动持久**：块/函数执行期间
   ```c
   void function() {
       int temp;  // 函数返回时销毁
   }
   ```

3. **动态持久**：手动分配和释放
   ```c
   int* ptr = malloc(sizeof(int));  // 手动控制
   free(ptr);
   ```

**最佳实践：**
- 使用最短的有效持久期
- 优先使用自动变量
- 避免不必要的静态/全局变量

### 变量引用集中化

**原则**：将对同一变量的引用放在一起。

**反例：**
```c
void SummarizeData(...) {
    GetOldData(OldData, &NumOldData);
    GetNewData(NewData, &NumNewData);
    TtlOldData = Sum(OldData, NumOldData);
    TtlNewData = Sum(NewData, NumNewData);

    PrintOldDataSummary(OldData, TtlOldData, NumOldData);
    PrintNewDataSummary(NewData, TtlNewData, NumNewData);

    SaveOldDataSummary(TtlOldData, NumOldData);
    SaveNewDataSummary(TtlNewData, NumNewData);
}
```
**问题**：OldData 和 NewData 的使用分散，需要同时关注 6 个变量

**正例：**
```c
void SummarizeDaily(...) {
    // 集中使用 OldData
    GetOldData(OldData, &NumOldData);
    TtlOldData = Sum(OldData, NumOldData);
    PrintOldDataSummary(OldData, TtlOldData, NumOldData);
    SaveOldDataSummary(TtlOldData, NumOldData);

    // 集中使用 NewData
    GetNewData(NewData, &NumNewData);
    TtlNewData = Sum(NewData, NumNewData);
    PrintNewDataSummary(NewData, TtlNewData, NumNewData);
    SaveNewDataSummary(TtlNewData, NumNewData);
}
```
**好处**：每次只需关注 3 个变量

### 变量功能单一性

**原则**：一个变量只应有一个用途。

**反例：**
```c
int temp;

temp = calculateInput();
processInput(temp);

temp = calculateOutput();
processOutput(temp);  // temp 的含义改变了！
```
**问题**：`temp` 用于两个不同的目的，容易混淆

**正例：**
```c
int inputValue = calculateInput();
processInput(inputValue);

int outputValue = calculateOutput();
processOutput(outputValue);
```
**好处**：每个变量用途清晰

### 全局变量

**为什么要避免全局变量？**

**问题：**
1. **破坏模块化**：任何地方都可以访问和修改
2. **难以理解**：需要追踪所有使用该变量的地方
3. **难以测试**：无法隔离测试依赖全局变量的代码
4. **并发问题**：多线程环境下不安全
5. **隐式依赖**：隐藏函数之间的依赖关系

**示例问题：**
```c
int globalCounter;  // ❌ 全局变量

void functionA() {
    globalCounter++;  // 副作用不明显
}

void functionB() {
    globalCounter++;  // 可能意外影响 functionA
}
```

**如何避免全局变量？**

1. **使用参数传递**
   ```c
   // ❌ 全局变量
   int configValue;
   void process() { use(configValue); }

   // ✅ 参数传递
   void process(int configValue) { use(configValue); }
   ```

2. **使用返回值**
   ```c
   // ❌ 全局变量
   int result;
   int calculate() {
       result = 42;
   }

   // ✅ 返回值
   int calculate() {
       return 42;
   }
   ```

3. **使用访问函数**
   ```c
   // ✅ 封装全局状态
   static int _counter;  // 私有（仅模块内可见）

   int getCounter() { return _counter; }
   void setCounter(int value) { _counter = value; }
   ```

4. **使用类/对象**
   ```javascript
   // ✅ 对象封装状态
   class Counter {
       constructor() {
           this._count = 0;
       }

       get() { return this._count; }
       increment() { this._count++; }
   }
   ```

**何时可以使用全局变量？**
- 真正的全局常量（只读）
- 系统级单例（通过访问函数）
- 性能关键且明确的例外

## 基本数据类型

### 数字类型

#### 避免魔法数字（Magic Numbers）

**定义**：代码中出现的不加解释的常数。

**反例：**
```c
for (int i = 0; i < 100; i++) { ... }  // 100 是什么？
if (status == 4) { ... }               // 4 代表什么？
array[7] = value;                        // 7 有何含义？
```

**正例：**
```c
const int MAX_ENTRIES = 100;
const int STATUS_ERROR = 4;
const int LAST_INDEX = 7;

for (int i = 0; i < MAX_ENTRIES; i++) { ... }
if (status == STATUS_ERROR) { ... }
array[LAST_INDEX] = value;
```

**好处：**
1. **易于修改**：只改一处，不会遗漏
2. **提高可读性**：名称说明含义
3. **避免错误**：`MAX_ENTRIES + 1` 比 `100 + 1` 更清楚

**例外**：0 和 1 可以直接使用
```c
for (int i = 0; i < MAX; i++) { ... }  // ✅ 0 作为初始值
count = count + 1;                      // ✅ 1 作为增量
```

#### 整数溢出

**问题**：整数超出范围时行为未定义。

**防护措施：**
```c
#include <limits.h>

// ✅ 检查溢出
int add(int a, int b) {
    if (a > INT_MAX - b) {
        // 处理溢出
        return INT_MAX;
    }
    return a + b;
}

// ✅ 使用更大类型
long long safeAdd(int a, int b) {
    return (long long)a + b;
}
```

#### 浮点数精度

**原则**：浮点数比较需要容差。

**反例：**
```c
float a = 0.1 + 0.2;  // 0.30000001...
float b = 0.3;
if (a == b) { ... }  // ❌ 可能永远为 false！
```

**正例：**
```c
#include <math.h>

const float EPSILON = 0.0001;

if (fabs(a - b) < EPSILON) { ... }  // ✅ 正确的比较
```

**最佳实践：**
- 货务计算使用整数（分为单位）
- 科学计算使用 `double` 而非 `float`
- 避免直接比较相等性

### 字符和字符串

#### 字符处理

```c
// ✅ 使用字符常量而非数字
if (ch == 'A') { ... }  // 清晰
if (ch == 65) { ... }   // ❌ 不清晰（ASCII 码）

// ✅ 字符分类
#include <ctype.h>
if (isdigit(ch)) { ... }     // 检查数字
if (isalpha(ch)) { ... }     // 检查字母
```

#### 字符串处理

**原则**：使用字符串库而非手动操作。

```c
#include <string.h>

// ❌ 手动复制
char dest[100];
for (int i = 0; src[i] != '\0'; i++) {
    dest[i] = src[i];
}
dest[i] = '\0';

// ✅ 使用库函数
strcpy(dest, src);  // 更安全：strncpy(dest, src, sizeof(dest));
```

**安全性：**
```c
// ✅ 使用安全版本
strncpy(dest, src, sizeof(dest) - 1);
dest[sizeof(dest) - 1] = '\0';

// ✅ 检查长度
if (strlen(src) < sizeof(dest)) {
    strcpy(dest, src);
}
```

### 布尔变量

**使用布尔变量简化复杂条件**

**反例：**
```c
// ❌ 重复的复杂条件
if ((user.isAdmin && document.isEditable) ||
    (user.isOwner && document.isShared) ||
    (user.hasPermission && document.isPublic)) {
    allowAccess();
}

if ((user.isAdmin && document.isEditable) ||
    (user.isOwner && document.isShared) ||
    (user.hasPermission && document.isPublic)) {
    downloadDocument();
}
```

**正例：**
```c
// ✅ 提取为布尔变量
bool canAccess = (user.isAdmin && document.isEditable) ||
                 (user.isOwner && document.isShared) ||
                 (user.hasPermission && document.isPublic);

if (canAccess) {
    allowAccess();
}

if (canAccess) {
    downloadDocument();
}
```

### 枚举类型

**使用枚举代替魔法数字**

**反例：**
```c
#define COLOR_RED 0
#define COLOR_GREEN 1
#define COLOR_BLUE 2

int color = COLOR_RED;
```

**正例：**
```c
enum Color {
    COLOR_RED,
    COLOR_GREEN,
    COLOR_BLUE
};

enum Color color = COLOR_RED;  // 类型安全
```

**优势：**
- 类型安全
- 调试器显示符号名而非数字
- 自动赋值，无需手动管理

### 数组

#### 数组初始化

**原则**：显式初始化所有元素。

```c
// ❌ 部分初始化（其余为未定义）
int array[10];
array[0] = 1;

// ✅ 完全初始化
int array[10] = {0};  // 全部为 0

// ✅ 指定初始化
int array[10] = {
    [0] = 1,
    [1] = 2,
    [2] = 3
};
```

#### 数组边界检查

**原则**：始终检查数组索引。

```c
// ❌ 无边界检查
int array[10];
array[15] = 42;  // ❌ 越界！未定义行为

// ✅ 边界检查
if (index >= 0 && index < sizeof(array)/sizeof(array[0])) {
    array[index] = 42;  // ✅ 安全
}
```

### 指针

#### 指针安全

**原则**：始终初始化和检查指针。

```c
// ❌ 未初始化的指针
int* ptr;
*ptr = 42;  // ❌ 崩溃！ptr 指向随机地址

// ✅ 初始化
int* ptr = NULL;
ptr = malloc(sizeof(int));
if (ptr != NULL) {
    *ptr = 42;  // ✅ 安全
}

// ❌ 野指针
int* ptr = malloc(sizeof(int));
free(ptr);
*ptr = 42;  // ❌ 使用已释放的内存

// ✅ 释放后置 NULL
free(ptr);
ptr = NULL;
```

#### 指针 vs 引用

**现代语言优先使用引用：**

```cpp
// C++ 示例
// ✅ 使用引用（更安全）
void process(int& value) {
    value = 42;  // 清楚表达修改意图
}

// ⚠️ 使用指针（需要检查）
void process(int* value) {
    if (value != NULL) {
        *value = 42;
    }
}
```

## 复杂数据类型

### 结构和记录

#### 为什么使用结构？

1. **表明数据间的关系**

**反例：**
```c
// 没有结构化数据，关系模糊
Name = InputName;
Address = InputAddress;
Phone = InputPhone;
Title = InputTitle;
Department = InputDepartment;
Bonus = InputBonus;
// 哪些数据相关？不清楚
```

**正例：**
```c
struct Employee {
    char Name[100];
    char Address[200];
    char Phone[20];
};

struct Supervisor {
    char Title[50];
    char Department[50];
    float Bonus;
};

Employee.Name = InputName;
Employee.Address = InputAddress;
Employee.Phone = InputPhone;

Supervisor.Title = InputTitle;
Supervisor.Department = InputDepartment;
Supervisor.Bonus = InputBonus;
// 关系清晰！
```

2. **简化对成块数据的操作**

**反例：**
```c
// 复制雇员数据需要多行代码
NewName = OldName;
NewAddress = OldAddress;
NewPhone = OldPhone;
NewSSN = OldSSN;
NewSex = OldSex;
NewSalary = OldSalary;
// ...需要很多行
```

**正例：**
```c
struct Employee {
    char Name[100];
    char Address[200];
    char Phone[20];
    int SSN;
    char Sex;
    float Salary;
};

Employee newEmployee = oldEmployee;  // 一行搞定！
```

#### 结构设计原则

1. **内聚性**：结构中的字段应逻辑相关
2. **清晰性**：字段名称应清楚描述内容
3. **最小化**：只包含必要的数据

**反例：**
```c
struct MiscData {
    int employeeId;      // 雇员
    float temperature;   // 温度 ❌
    char cityName[50];   // 城市 ❌
    int orderCount;      // 订单
};
// 字段之间无关联
```

**正例：**
```c
struct Employee {
    int id;
    char name[100];
    char department[50];
    float salary;
};

struct Weather {
    float temperature;
    char cityName[50];
    char condition[20];
};

struct Order {
    int id;
    int customerId;
    float amount;
    Date orderDate;
};
```

### 表驱动方法（Table-Driven Methods）

**定义**：用查找表代替复杂的逻辑。

**应用场景：**
- 复杂的条件逻辑
- 状态转换
- 配置数据

**反例（复杂的条件逻辑）：**
```c
if (month == 1) {
    days = 31;
} else if (month == 2) {
    days = isLeapYear ? 29 : 28;
} else if (month == 3) {
    days = 31;
} else if (month == 4) {
    days = 30;
}
// ...很多重复代码
```

**正例（表驱动）：**
```c
const int DAYS_IN_MONTH[] = {
    31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31
};

int days = DAYS_IN_MONTH[month - 1];
if (month == 2 && isLeapYear) {
    days = 29;
}
```

**更复杂的例子：状态转换**
```c
// ✅ 表驱动的状态机
typedef struct {
    State currentState;
    Event event;
    State nextState;
    Action action;
} StateTransition;

StateTransition transitions[] = {
    {LOCKED, COIN, UNLOCKED, NULL},
    {LOCKED, PASS, LOCKED, ALARM},
    {UNLOCKED, COIN, UNLOCKED, NULL},
    {UNLOCKED, PASS, LOCKED, NULL}
};

void processEvent(State current, Event event) {
    for (int i = 0; i < sizeof(transitions)/sizeof(transitions[0]); i++) {
        if (transitions[i].currentState == current &&
            transitions[i].event == event) {
            if (transitions[i].action != NULL) {
                transitions[i].action();
            }
            return transitions[i].nextState;
        }
    }
}
```

### 抽象数据类型（ADT）

**定义**：数据结构 + 操作数据的方法。

**示例：栈（Stack）**

```c
// ❌ 暴露实现
int stack[100];
int top = 0;

stack[top++] = value;  // 直接访问
value = stack[--top];

// ✅ 抽象数据类型
typedef struct {
    int data[100];
    int top;
} Stack;

void Stack_Init(Stack* s) {
    s->top = 0;
}

void Stack_Push(Stack* s, int value) {
    if (s->top < 100) {
        s->data[s->top++] = value;
    }
}

int Stack_Pop(Stack* s) {
    if (s->top > 0) {
        return s->data[--s->top];
    }
    return -1;  // 错误
}

bool Stack_IsEmpty(Stack* s) {
    return s->top == 0;
}

// 使用
Stack stack;
Stack_Init(&stack);
Stack_Push(&stack, 42);
if (!Stack_IsEmpty(&stack)) {
    int value = Stack_Pop(&stack);
}
```

**ADT 的优势：**
1. **封装**：隐藏实现细节
2. **安全**：可以添加验证
3. **灵活性**：可以改变实现而不影响使用方
4. **清晰**：操作语义明确

## 数据初始化

### 初始化原则

**原则**：在使用前初始化所有变量。

```c
// ❌ 未初始化
int count;
count++;  // 未定义行为！

// ✅ 初始化
int count = 0;
count++;

// ✅ 就近初始化
int count = 0;
// ...使用 count 的代码...
```

### 成员初始化

**类/结构成员应在构造时初始化**

```cpp
// C++ 示例
class Employee {
public:
    Employee() : id(0), salary(0.0), isActive(true) {
        // 初始化列表确保所有成员初始化
    }

private:
    int id;
    float salary;
    bool isActive;
};
```

### 初始化时机

**就近初始化**：在即将使用前初始化。

**反例：**
```c
int count = 0;
int sum = 0;
int average = 0;
// ... 100 行代码 ...
count = calculateCount();
sum = calculateSum();
average = sum / count;
```

**正例：**
```c
int count = calculateCount();
int sum = calculateSum();
int average = sum / count;
```

**好处：**
- 变量声明和使用靠近，易于理解
- 减少未初始化变量的窗口
- 避免不必要的初始化（如果路径不使用）

## 数据设计检查清单

### 命名检查

- [ ] 变量名是否准确描述其用途？
- [ ] 名称是否面向问题而非解决方案？
- [ ] 名称长度是否合适（9-15 字符）？
- [ ] 布尔变量是否使用 `is/has/can` 前缀？
- [ ] 是否遵循项目命名约定？

### 类型定义

- [ ] 是否为业务概念定义了自定义类型？
- [ ] 类型名称是否清晰表达意图？
- [ ] 是否使用了枚举代替魔法数字？
- [ ] 常量是否有名称而非直接使用数字？

### 变量使用

- [ ] 作用域是否最小化？
- [ ] 是否避免了全局变量？
- [ ] 变量引用是否集中放置？
- [ ] 变量是否只用于单一目的？
- [ ] 是否在使用前初始化？

### 类型安全

- [ ] 是否检查了数组边界？
- [ ] 是否检查指针是否为 NULL？
- [ ] 浮点数比较是否使用了容差？
- [ ] 类型转换是否显式？
- [ ] 是否避免了混合类型比较？

## 常见错误

### ❌ 不要

1. **使用魔法数字**
   ```c
   if (status == 4) { ... }  // 神秘数字
   ```

2. **过度使用全局变量**
   ```c
   int g_count;  // 全局
   ```

3. **变量名模糊**
   ```c
   int temp;  // temp 是什么？
   ```

4. **未初始化变量**
   ```c
   int value;
   printf("%d", value);  // 未定义行为
   ```

### ✅ 应该

1. **使用命名常量**
   ```c
   const int STATUS_ERROR = 4;
   if (status == STATUS_ERROR) { ... }
   ```

2. **最小化作用域**
   ```c
   void function() {
       int count = 0;  // 局部
       count++;
   }
   ```

3. **使用清晰的名称**
   ```c
   int employeeCount;  // 清晰
   ```

4. **始终初始化**
   ```c
   int value = 0;  // 已初始化
   ```

## 何时参考此内容

查阅此材料当：
- 定义新的变量或数据结构
- 重命名变量以提高可读性
- 设计类的数据成员
- 考虑使用全局变量
- 处理数组、指针等复杂数据类型
- 进行代码评审时评估数据使用

## 相关阅读

- **子程序设计**：参见 `02-routines.md`
- **模块化设计**：参见 `03-design.md`
- **控制结构**：参见 `05-statements.md`
- **代码风格**：参见 `06-code-style.md`
