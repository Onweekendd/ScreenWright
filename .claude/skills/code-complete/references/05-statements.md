# 控制结构

**基于《Code Complete 代码大全》第13-17章**

## 概述

控制结构决定了程序的执行流程。良好的控制结构设计使代码清晰、易读、易维护。

## 顺序执行（第13章）

### 依赖关系明显化

**原则**：使语句间的依赖关系清晰可见。

**反例（依赖关系不明显）：**
```c
ComputeMonthlyRevenues(Revenues);
ComputeQuarterlyRevenues(Revenues);
ComputeAnnualRevenues(Revenues);
```
**问题**：从代码本身看不出执行顺序的必要性

**正例（依赖关系清晰）：**
```c
InitializeExpenseData(expenseData);
ComputeMarketingExpenses(expenseData);
ComputeMISExpenses(expenseData);
ComputeAccountingExpenses(expenseData);
PrintExpenseSummary(expenseData);
```
**好处**：通过参数传递清楚显示依赖关系

### 使依赖关系明显的方法

1. **使用子程序参数**
   ```c
   // ❌ 无参数，依赖关系隐藏
   void processData() {
       initialize(data);
       compute(data);
   }

   // ✅ 参数传递，依赖关系清晰
   void processData(Data* data) {
       initialize(data);
       compute(data);
   }
   ```

2. **清晰的命名**
   ```c
   // ❌ 名称不反映依赖
   void computeMarketing() {
       initGlobals();  // 隐藏的初始化
   }

   // ✅ 名称准确反映功能
   void initializeAndComputeMarketing() {
       initializeData();
       computeMarketing();
   }

   // 或者更好的分离
   void initializeExpenseData();
   void computeMarketingExpenses();
   ```

3. **组织相关代码**
   ```c
   // ✅ 将相关操作集中
   initializeData();
   computeMonthly();
   computeQuarterly();
   computeAnnual();
   ```

## 条件语句（第14章）

### if 语句最佳实践

#### 1. 正常路径优先

**原则**：先处理正常情况，再处理异常情况。

**反例（正常和异常混杂）：**
```c
OpenFile(InputFile, Status);
if (Status == Error) {
    ErrorType = FileOpenError;  // 异常
} else {
    ReadFile(InputFile, FileData, Status);  // 正常
    if (Status == Success) {
        SummarizeFileData(FileData, SummaryData, Status);  // 正常
        if (Status == Error) {
            ErrorType = DataSummaryError;  // 异常
        } else {
            PrintSummary(SummaryData);  // 正常
            SaveSummaryData(SummaryData, Status);
            if (Status == Error) {
                ErrorType = SummarySaveError;  // 异常
            } else {
                UpdateAllAccounts();  // 正常
            }
        }
    } else {
        ErrorType = FileReadError;  // 异常
    }
}
```
**问题**：正常路径和异常路径混在一起，难以理解主流程

**正例（正常路径清晰）：**
```c
OpenFile(InputFile, Status);
if (Status != Error) {  // 正常路径
    ReadFile(InputFile, FileData, Status);

    if (Status == Success) {  // 正常路径
        SummarizeFileData(FileData, SummaryData, Status);

        if (Status != Error) {  // 正常路径
            PrintSummary(SummaryData);
            SaveSummaryData(SummaryData, Status);

            if (Status != Error) {  // 正常路径
                UpdateAllAccounts();
                EraseUndoFile();
            } else {
                ErrorType = SummarySaveError;  // 异常
            }
        } else {
            ErrorType = DataSummaryError;  // 异常
        }
    } else {
        ErrorType = FileReadError;  // 异常
    }
} else {
    ErrorType = FileOpenError;  // 异常
}
```
**好处**：
- 主流程（正常路径）在左边，一目了然
- 异常处理在右侧，层次分明
- 易于理解的"快乐路径"

#### 2. 使用有意义的语句

**反例：**
```c
if (someTest) {
    ;  // 空语句，什么也不做
}
```

**正例：**
```c
if (someTest) {
    doNothing();  // 即使是空操作，也明确表达意图
}
```

或者使用注释：
```c
if (someTest) {
    // 空语句：等待条件改变
}
```

### case 语句

#### 完整性检查

**原则**：确保处理所有情况。

**反例：**
```javascript
switch (type) {
    case 'A':
        handleA();
        break;
    case 'B':
        handleB();
        break;
    // 缺少 default！
}
```

**正例：**
```javascript
switch (type) {
    case 'A':
        handleA();
        break;
    case 'B':
        handleB();
        break;
    default:
        // 明确处理未知类型
        console.error('Unknown type:', type);
        break;
}
```

#### 排列 case 的顺序

**建议：**
1. 最常见的情况在前
2. 按字母顺序或逻辑顺序
3. default 放最后

## 循环（第15章）

### 循环类型选择

#### while 循环

**适用场景**：
- 事先不知道循环次数
- 可能一次也不执行

**示例：**
```c
// ✅ 读取直到文件结束
while (!feof(file)) {
    readData(file, data);
    processData(data);
}

// ✅ 处理链表
while (node != NULL) {
    process(node);
    node = node->next;
}
```

#### for 循环

**适用场景**：
- 计数循环（已知次数）
- 遍历数组/集合

**示例：**
```c
// ✅ 简单计数
for (int i = 0; i < MAX_COUNT; i++) {
    array[i] = i * 2;
}

// ✅ 遍历数组
for (int i = 0; i < array.length; i++) {
    process(array[i]);
}
```

#### do-while 循环

**适用场景**：
- 至少需要执行一次
- 后置条件检查

**示例：**
```c
// ✅ 至少执行一次
do {
    getInput(input);
} while (isValid(input));

// ✅ 菜单驱动
do {
    displayMenu();
    choice = getUserChoice();
    processChoice(choice);
} while (choice != EXIT);
```

### 循环控制最佳实践

#### 1. 循环初始化

**原则**：在循环前初始化所有相关变量。

**反例：**
```c
int count = 0;
// ... 100 行代码 ...
for (int i = 0; i < max; i++) {
    count += i;
}
```
**问题**：初始化和使用相距太远

**正例：**
```c
int count = 0;
for (int i = 0; i < max; i++) {
    count += i;
}
```

#### 2. 循环终止条件

**原则**：使终止条件清晰明显。

**反例：**
```c
// ❌ 终止条件不明显
for (int i = 0; ; i++) {
    if (shouldStop(i)) {
        break;
    }
}
```

**正例：**
```c
// ✅ 终止条件明显
for (int i = 0; i < MAX && !shouldStop(i); i++) {
    process(i);
}
```

#### 3. 循环索引

**原则**：使用有意义的循环变量名。

**反例：**
```c
// ❌ 模糊的变量名
for (int i = 0; i < employees.size(); i++) {
    for (int j = 0; j < employees[i].tasks.size(); j++) {
        process(employees[i].tasks[j]);
    }
}
```

**正例：**
```c
// ✅ 清晰的变量名
for (int employeeIndex = 0; employeeIndex < employees.size(); employeeIndex++) {
    for (int taskIndex = 0; taskIndex < employees[employeeIndex].tasks.size(); taskIndex++) {
        process(employees[employeeIndex].tasks[taskIndex]);
    }
}
```

#### 4. 循环长度

**原则**：循环体应简短，一眼能看清。

**反例（过长）：**
```c
for (int i = 0; i < 1000; i++) {
    // 50 行代码
    initialize();
    compute();
    validate();
    save();
    // ...更多代码...
}
```

**正例：**
```c
for (int i = 0; i < 1000; i++) {
    processItem(i);  // 提取为函数
}
```

### 循环与数组的关系

**原则**：使用循环简化数组操作。

**反例：**
```c
// ❌ 手动处理数组
array[0] = value * 1;
array[1] = value * 2;
array[2] = value * 3;
// ... 重复代码
```

**正例：**
```c
// ✅ 使用循环
for (int i = 0; i < ARRAY_SIZE; i++) {
    array[i] = value * (i + 1);
}
```

## 少见的控制结构（第16章）

### goto 语句

#### 争论

**反对者观点：**
- Dijkstra: "goto 是有害的"
- 破坏程序结构
- 使代码难以理解和维护
- 影响编译器优化

**支持者观点：**
- 某些特殊情况很有用
- 减少代码重复
- 可以提高效率

#### 现代共识

**原则**：避免使用 goto，但了解何时可以使用。

**❌ 不好的使用：**
```c
// 模拟循环
int i = 0;
loop_start:
    process(array[i]);
    i++;
    if (i < max) goto loop_start;

// 错误时跳转
if (error) {
    goto cleanup;
}
```

**✅ 可接受的使用（极端例外）：**

1. **集中错误处理和清理：**
```c
if (allocateResource1() == SUCCESS) {
    if (allocateResource2() == SUCCESS) {
        processData();
    } else {
        cleanup1();
        goto error_handler;
    }
} else {
    error_handler:
    cleanupAll();
    handleError();
}
```

**更好的替代方案（现代语言）：**
```c
// ✅ RAII（C++）
class ResourceHandler {
    ResourceHandler() { allocateResource1(); allocateResource2(); }
    ~ResourceHandler() { cleanupAll(); }
};

// ✅ try-catch（异常处理）
try {
    allocateResource1();
    allocateResource2();
    processData();
} catch (Exception& e) {
    handleError();
}
```

2. **跳出深层嵌套：**
```c
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        for (int k = 0; k < depth; k++) {
            if (found) {
                goto found_label;  // 可接受：跳出多层循环
            }
        }
    }
}
found_label:
handleResult();
```

**更好的替代方案：**
```c
// ✅ 使用标志变量
bool found = false;
for (int i = 0; i < rows && !found; i++) {
    for (int j = 0; j < cols && !found; j++) {
        for (int k = 0; k < depth && !found; k++) {
            if (target == array[i][j][k]) {
                found = true;
            }
        }
    }
}

// ✅ 提取为函数
bool search() {
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            for (int k = 0; k < depth; k++) {
                if (target == array[i][j][k]) {
                    return true;
                }
            }
        }
    }
    return false;
}
```

**结论**：99% 的情况下不应使用 goto。使用结构化替代方案。

### return 语句

**原则**：每个函数应只有一个返回点。

**反例：**
```c
int function() {
    if (error1) {
        return -1;  // 早期返回
    }

    if (error2) {
        return -2;  // 早期返回
    }

    if (error3) {
        return -3;  // 早期返回
    }

    return SUCCESS;  // 正常返回
}
```
**问题**：多个返回点使资源清理困难

**正例：**
```c
int function() {
    int result = ERROR;

    if (!error1 && !error2 && !error3) {
        result = SUCCESS;
    }

    // 单一返回点，易于添加清理代码
    return result;
}
```

### 递归调用

**原则**：谨慎使用递归。

**递归的适用场景：**
- 问题本质上是递归的（树、图遍历）
- 数据结构是递归的
- 简化代码（分治算法）

**递归的风险：**
- 栈溢出
- 性能问题
- 难以理解和调试

**递归示例（阶乘）：**
```c
// ❌ 递归实现（可能栈溢出）
int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// ✅ 迭代实现（更安全）
int factorial(int n) {
    int result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
```

**递归示例（快速排序 - 适用场景）：**
```c
// ✅ 递归是自然选择
void quickSort(int array[], int low, int high) {
    if (low < high) {
        int pivot = partition(array, low, high);
        quickSort(array, low, pivot - 1);
        quickSort(array, pivot + 1, high);
    }
}
```

## 常见控制问题（第17章）

### 布尔表达式

#### 使用 True/False 而非 0/1

**反例：**
```basic
IF PRINTERROR = 0 GOSUB 2000
IF PRINTERROR = 1 GOSUB 3000
```
**问题**：不清楚 0 和 1 哪个代表真

**正例：**
```basic
TRUE = 1
FALSE = 0

IF PRINTERROR = FALSE GOSUB 2000
IF PRINTERROR = TRUE GOSUB 3000
```

**C/C++ 示例：**
```c
// ✅ 清晰的布尔定义
#define TRUE (1 == 1)
#define FALSE (!TRUE)

// 使用
if (isValid == TRUE) { ... }

// 更好的现代方式（C++）
bool isValid = true;
if (isValid) { ... }
```

#### 隐式布尔比较

**原则**：简化布尔表达式。

**反例：**
```c
while (done == FALSE) { ... }
while ((a = b) == TRUE) { ... }
```

**正例：**
```c
while (!done) { ... }
while (a = b) { ... }
```

#### 简化复杂表达式

**原则**：使用中间变量或函数分解复杂条件。

**反例：**
```c
if ((eof(InputFile) && (!InputError)) &&
    ((MIN_ELEMENTS < CountElementsRead) &&
     (CountElementsRead <= MAX_ELEMENTS))) {
    // ...
}
```

**正例（提取为函数）：**
```c
bool canContinueReading() {
    return eof(InputFile) && !InputError &&
           MIN_ELEMENTS < CountElementsRead &&
           CountElementsRead <= MAX_ELEMENTS;
}

if (canContinueReading()) {
    // ...
}
```

**或使用中间变量：**
```c
bool hasData = eof(InputFile) && !InputError;
bool countInRange = MIN_ELEMENTS < CountElementsRead &&
                   CountElementsRead <= MAX_ELEMENTS;

if (hasData && countInRange) {
    // ...
}
```

### 复合语句（块）

**原则**：总是使用代码块，即使只有一条语句。

**反例：**
```javascript
// ❌ 危险：没有使用代码块
if (condition)
    doSomething();
    doAnotherThing();  // 这行总是执行！
```

**正例：**
```javascript
// ✅ 安全：使用代码块
if (condition) {
    doSomething();
    doAnotherThing();
}
```

**C/C++ 最佳实践：**
```c
// ✅ 总是使用大括号
if (condition) {
    statement;
}

// 即使只有一条语句
if (condition) {
    singleStatement;
}
```

### 空语句

**原则**：避免空语句，或明确注释。

**反例：**
```c
while (array[i++] == target) {
    ;  // 空循环体，意图不明
}
```

**正例：**
```c
while (array[i++] == target) {
    // 空语句：等待找到目标
}

// 或更好的方式
while (array[i++] != target) {
    // 等待找到目标
}
```

### 防止深层嵌套

**原则**：嵌套不应超过 3-4 层。

**反例（过深嵌套）：**
```c
if (condition1) {
    if (condition2) {
        if (condition3) {
            if (condition4) {
                if (condition5) {
                    // 5 层嵌套！
                }
            }
        }
    }
}
```

**解决方案：**
1. **提前返回**
   ```c
   if (!condition1) return;
   if (!condition2) return;
   if (!condition3) return;
   if (!condition4) return;
   if (!condition5) return;
   // 主逻辑
   ```

2. **提取函数**
   ```c
   if (condition1) {
       if (condition2) {
           if (condition3) {
               // 提取为函数
               handleDeeplyNestedCase();
           }
       }
   }

   void handleDeeplyNestedCase() {
       if (condition4) {
           if (condition5) {
               // 主逻辑
           }
       }
   }
   ```

3. **使用状态模式**
   ```c
   void process() {
       switch (state) {
           case STATE_1:
               if (condition1) {
                   state = STATE_2;
               }
               break;
           case STATE_2:
               if (condition2) {
                   state = STATE_3;
               }
               break;
           // ...
       }
   }
   ```

## 控制结构检查清单

### 顺序执行

- [ ] 语句间依赖关系是否清晰？
- [ ] 变量名是否反映依赖关系？
- [ ] 是否使用参数传递显示依赖？
- [ ] 相关代码是否组织在一起？

### 条件语句

- [ ] 正常路径是否优先处理？
- [ ] if-else 是否完整？
- [ ] 是否有 default 分支？
- [ ] case 语句是否完整？
- [ ] 条件是否清晰？

### 循环

- [ ] 循环类型是否合适？
- [ ] 循环变量是否有意义？
- [ ] 终止条件是否清晰？
- [ ] 是否正确初始化？
- [ ] 循环体是否简短？
- [ ] 是否容易理解？

### 嵌套

- [ ] 嵌套层次是否 ≤ 3-4 层？
- [ ] 是否使用了提取函数减少嵌套？
- [ ] 是否使用提前返回简化逻辑？
- [ ] 代码是否仍然可读？

## 常见错误

### ❌ 不要

1. **滥用 goto**
   ```c
   goto cleanup;  // 应避免
   ```

2. **过深嵌套**
   ```c
   if (a) {
       if (b) {
           if (c) {
               if (d) {
                   // 太深了
               }
           }
       }
   }
   ```

3. **多个返回点**
   ```c
   int func() {
       if (error1) return -1;
       if (error2) return -2;
       return 0;
   }
   ```

4. **复杂条件**
   ```c
   if (a && b && c || d && !e && f) { ... }
   ```

### ✅ 应该

1. **使用结构化控制**
   ```c
   while (condition) {
       process();
   }
   ```

2. **限制嵌套深度**
   ```c
   if (!isValid()) return;
   if (!hasPermission()) return;
   processData();
   ```

3. **单一返回点**
   ```c
   int func() {
       int result = ERROR;
       if (noError) {
           result = SUCCESS;
       }
       return result;
   }
   ```

4. **简化条件**
   ```c
   bool canProcess = isValid() && hasPermission();
   if (canProcess) {
       processData();
   }
   ```

## 何时参考此内容

查阅此材料当：
- 编写新的控制流程
- 重构复杂的条件逻辑
- 优化循环性能
- 处理深层嵌套
- 进行代码评审时评估控制结构

## 相关阅读

- **子程序设计**：参见 `02-routines.md`
- **数据相关**：参见 `04-data.md`
- **代码风格**：参见 `06-code-style.md`
- **质量保证**：参见 `07-quality.md`
