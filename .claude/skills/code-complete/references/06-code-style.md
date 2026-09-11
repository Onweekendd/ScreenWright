# 代码风格与文档

**基于《Code Complete 代码大全》第18-20章**

## 概述

代码风格和文档是软件质量的"面子工程"。良好的风格使代码易读易维护，良好的文档是专业的标志。

## 代码布局（第18章）

### 布局基本原则

**目标**：使代码的视觉结构反映其逻辑结构。

**布局好的代码特点：**
- 一目了然的逻辑结构
- 清晰的层次关系
- 易于理解的代码分组

### 缩进

**原则**：缩进应反映逻辑层次。

**标准缩进：**
- 空格 vs Tab：选择其一并保持一致
- 推荐：4 个空格（大多数标准）
- IDE：配置自动缩进

**反例（无缩进）：**
```c
for i = 1 to 10 do
if condition then
doSomething();
end if;
end for;
```

**正例（正确缩进）：**
```c
for i = 1 to 10 do
    if condition then
        doSomething();
    end if;
end for;
```

### 代码块布局

#### 单条语句
```c
// ✅ 始终使用大括号
if (condition) {
    statement;
}

// ❌ 不使用大括号（危险）
if (condition)
    statement;
    doAnotherThing();  // 意外总是执行！
```

#### 复合语句
```c
// ✅ 清晰的代码块
if (condition) {
    statement1();
    statement2();
    statement3();
}
```

### 行长度

**原则**：保持行长度合理。

**推荐：**
- 最大 80 字符（传统标准）
- 最大 120 字符（现代标准）

**过长行处理：**
```javascript
// ❌ 过长的行
const result = await fetch(url).then(res => res.json()).then(data => processData(data)).catch(err => handleError(err));

// ✅ 分行
const result = await fetch(url)
    .then(res => res.json())
    .then(data => processData(data))
    .catch(err => handleError(err));
```

### 空行

**原则**：使用空行分隔逻辑块。

**示例：**
```c
initializeData();

// 处理输入数据
processInput();

// 计算结果
calculateResults();

// 输出结果
printResults();

// 清理资源
cleanup();
```

## 代码风格

### 命名约定的一致性

**原则**：项目中使用统一的命名约定。

**一致性示例：**
```javascript
// ✅ 一致的命名
function getUserById(userId) { ... }
function getOrderById(orderId) { ... }
function getProductById(productId) { ... }

// ❌ 不一致的命名
function getUser(id) { ... }
function getOrder(order_id) { ... }
function getProduct(productID) { ... }
```

### 代码组织

#### 文件组织原则

**原则**：相关代码放在一起。

**推荐结构：**
```javascript
// 1. 常量和配置
const MAX_RETRY = 3;
const API_URL = "https://api.example.com";

// 2. 类型定义
interface User { ... }
interface Order { ... }

// 3. 工具函数
function formatDate(date: Date): string { ... }
function validateEmail(email: string): boolean { ... }

// 4. 业务逻辑
class UserService { ... }
class OrderService { ... }

// 5. 导出
export { UserService, OrderService };
```

#### 子程序组织

**原则**：子程序内的代码应按逻辑顺序组织。

**推荐顺序：**
1. 输入验证
2. 数据准备
3. 核心逻辑
4. 输出处理
5. 错误处理

```c
void processOrder(Order* order) {
    // 1. 输入验证
    if (order == NULL) return;
    if (!isValidOrder(order)) return;

    // 2. 数据准备
    Inventory* inventory = getInventory();

    // 3. 核心逻辑
    if (inventory->hasItems(order->items)) {
        inventory->reserveItems(order->items);
        order->status = CONFIRMED;
    }

    // 4. 输出处理
    sendConfirmation(order);

    // 5. 错误处理在开头完成
}
```

## 注释（第19章）

### 注释原则

**核心观点**：好的编程风格是自文档化的。注释是"锦上添花"，而非主要文档手段。

### 什么时候需要注释？

**✅ 需要注释的情况：**

1. **解释"为什么"而非"是什么"**
   ```c
   // 使用二分查找是因为数据已排序
   index = binarySearch(sortedArray, key);

   // 尝试3次后超时，避免无限等待
   for (int retry = 0; retry < 3; retry++) { ... }
   ```

2. **说明复杂算法**
   ```c
   // Knuth-Morris-Pratt 素数匹配算法
   // 时间复杂度 O(n*m)，空间复杂度 O(n+m)
   int kmpSearch(const char* text, const char* pattern) { ... }
   ```

3. **标记重要的业务规则**
   ```c
   // 折扣规则：金额大于1000时需主管审批
   if (amount > 1000) {
       requireManagerApproval();
   }
   ```

4. **警告和注意事项**
   ```c
   // 警告：此方法会修改全局状态，不是线程安全的
   void updateGlobalState() { ... }

   // TODO: 需要添加错误处理
   void processData() { ... }
   ```

### ❌ 不好的注释

**1. 重复代码**
```c
i++;  // 增加 i
```
**问题**：注释不如代码清晰

**2. 过时的注释**
```c
// 修复了 bug 1234
if (user.isAdmin) { ... }
```
**问题**：bug 1234 早已修复，但注释留下了

**3. 模糊的注释**
```c
// 处理数据
processData(data);
```
**问题**：没有说明如何处理

**4. 显而易见的注释**
```c
count++;  // 计数器加 1
```
**问题**：侮辱读者智商

### 注释的最佳实践

#### 1. 注释应该解释"为什么"

**反例（解释是什么）：**
```c
// 循环遍历数组
for (int i = 0; i < size; i++) {
    sum += array[i];
}
```

**正例（解释为什么）：**
```c
// 从后向前遍历，避免删除元素时的索引问题
for (int i = size - 1; i >= 0; i--) {
    removeElement(array, i);
}
```

#### 2. 保持注释同步

**原则**：代码修改时同步更新注释。

**反例：注释过时**
```c
// 处理用户输入
if (user.isAdmin) {  // 注释说处理输入，实际是权限检查
    grantAccess();
}
```

**正例：注释准确**
```c
// 检查管理员权限
if (user.isAdmin) {
    grantAccess();
}
```

#### 3. 注释格式

**函数注释：**
```c
/**
 * 计算订单总价
 *
 * @param order 订单对象
 * @param includeTax 是否包含税费
 * @return 总价（分为）
 *
 * @throws InvalidOrderException 如果订单无效
 */
Money calculateTotal(Order* order, bool includeTax) {
    // ...
}
```

**行内注释：**
```c
int result = value * 2;  // 乘以2是业务规则，不是魔术数字
```

**块注释：**
```c
/*
 * 计算年度收入
 *
 * 考虑因素：
 * - 月度收入汇总
 * - 季度调整
 * - 税务合规
 */
Revenue calculateAnnualRevenue() {
    // ...
}
```

#### 4. PDL 作为注释

**使用 PDL（程序设计语言）作为注释：**

```c
void recordErrorMessage(int errorCode) {
    // 获取错误信息
    message = lookupErrorMessage(errorCode);

    // 根据处理模式输出信息
    if (isInteractiveMode()) {
        printToUser(message);
    } else {
        logToFile(message);
    }

    // 更新处理状态
    setStatus(FAILURE);
}
```

**好处：**
- PDL 本身就是注释
- 描述设计意图而非实现
- 易于维护

### 检查表：代码是否自文档化

**子程序检查：**
- [ ] 名称是否描述功能？
- [ ] 参数是否清晰？
- [ ] 变量名是否有意义？
- [ ] 逻辑结构是否简单？

**数据检查：**
- [ ] 类型名是否清晰？
- [ ] 变量名是否描述用途？
- [ ] 命名常量是否替代了数字？
- [ ] 数据结构是否简化了逻辑？

**布局检查：**
- [ ] 缩进是否一致？
- [ ] 代码块是否清晰？
- [ ] 空行是否合理分隔逻辑块？

**注释检查：**
- [ ] 是否解释了"为什么"？
- [ ] 是否过时或不准确？
- [ ] 是否有明显的格式（如函数注释）？
- [ ] 是否与代码同步？

## 编程工具（第20章）

### 工具的重要性

**数据支持**：先进的编程工具能提高 50% 以上的生产率。

### 必备工具类别

#### 1. 编辑器/IDE

**关键特性：**
- 语法高亮
- 自动缩进
- 代码补全
- 括号匹配
- 多文件编辑
- 重构支持
- 集成 Git

**推荐：**
- VS Code
- IntelliJ IDEA
- Visual Studio
- Vim/Neovim（高级用户）

#### 2. 版本控制

**必须使用：**
- Git
- SVN（遗留系统）

**工作流：**
```bash
git add .
git commit -m "feat: add user authentication"
git push
```

#### 3. 调试工具

**功能：**
- 断点
- 单步执行
- 变量监视
- 内存检查

#### 4. 自动化工具

**构建工具：**
- Make
- npm scripts
- CMake

**测试工具：**
- 单元测试框架
- 覆盖率工具

**代码检查：**
- Linter
- 静态分析工具

### 工具配置

#### 编辑器配置

**VS Code (settings.json)：**
```json
{
    "editor.tabSize": 4,
    "editor.insertSpaces": true,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
    },
    "editor.rulers": [80, 120]
}
```

#### 代码格式化工具

**JavaScript/TypeScript：**
```bash
npm install -D prettier eslint
```

**Python：**
```bash
pip install black flake8 mypy
```

**C/C++：**
```bash
clang-format
```

### 建立工具链

**推荐工具链：**

**JavaScript/TypeScript：**
- 编辑器：VS Code
- 格式化：Prettier
- Linter：ESLint
- 测试：Jest
- 版本控制：Git

**Python：**
- 编辑器：VS Code / PyCharm
- 格式化：Black
- Linter：Flake8, Pylint
- 测试：pytest
- 版本控制：Git

**C/C++：**
- 编辑器：VS Code / CLion
- 格式化：clang-format
- 调试：GDB
- 构建：CMake
- 版本控制：Git

## 代码风格检查清单

### 布局

- [ ] 缩进是否一致？
- [ ] 代码块是否清晰？
- [ ] 行长度是否合理？
- [ ] 空行使用是否恰当？

### 命名

- [ ] 变量名是否有意义？
- [ ] 函数名是否描述功能？
- [ ] 类型名是否清晰？
- [ ] 常量是否有名称？

### 组织

- [ ] 相关代码是否组织在一起？
- [ ] 文件结构是否合理？
- [ ] 子程序是否按逻辑顺序？
- [ ] 是否有清晰的公共接口？

### 文档

- [ ] 注释是否解释"为什么"？
- [ ] 函数是否有清晰的文档？
- [ ] README 是否存在并有用？
- [ ] 是否说明了重要的设计决策？

## 常见错误

### ❌ 不要

1. **不一致的风格**
   ```javascript
   let userName = "Alice";
   let user_id = "Bob";  // 驼峰 vs 下划线
   ```

2. **过度注释**
   ```c
   i++;  // 增加 i
   i++;  // 增加 i
   i++;  // 增加 i
   ```

3. **无缩进**
   ```c
   if (a)
   if (b)
   statement();
   ```

4. **混合缩进**
   ```javascript
   if (condition) {
      if (another) {
     statement;  // 2、4、6 空格混用
   }
   }
   ```

### ✅ 应该

1. **统一风格**
   - 使用 linter/formatter
   - 配置 .editorconfig
   - 定义项目规范

2. **自文档化代码**
   - 清晰的命名
   - 简单的逻辑结构
   - 最少的注释（只注释"为什么"）

3. **自动化格式化**
   - 配置编辑器保存时格式化
   - 提交前运行格式化工具

4. **代码审查**
   - 使用 linter
   - 进行代码评审
   - 使用自动化工具检查风格

## 何时参考此内容

查阅此材料当：
- 制定项目代码规范
- 配置编辑器和工具
- 进行代码评审
- 改进代码可读性
- 编写项目文档

## 相关阅读

- **子程序设计**：参见 `02-routines.md`
- **控制结构**：参见 `05-statements.md`
- **质量保证**：参见 `07-quality.md`
- **代码优化**：参见 `08-optimization.md`
