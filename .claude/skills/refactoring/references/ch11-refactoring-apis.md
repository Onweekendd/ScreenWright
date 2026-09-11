# 第11章 重构API

## 306 将查询函数和修改函数分离 (Separate Query from Modifier)

## 示例

```javascript
// Before
function getTotalOutstandingAndSendBill() {
  const result = customer.invoices.reduce((total, each) => each.amount + total, 0);
  sendBill();
  return result;
}

// After
function totalOutstanding() {
  return customer.invoices.reduce((total, each) => each.amount + total, 0);
}
function sendBill() {
  emailGateway.send(formatBill(customer));
}
```

### 动机

任何有返回值的函数，都不应该有看得到的副作用——命令与查询分离(Command-Query Separation)。

### 做法

1. 复制整个函数，将其作为一个查询来命名
2. 从新建的查询函数中去掉所有造成副作用的语句
3. 执行静态检查
4. 查找所有调用原函数的地方，修改为调用新建的查询函数，并在下面马上再调用一次原函数
5. 从原函数中去掉返回值

---

## 310 函数参数化 (Parameterize Function)

曾用名：令函数携带参数 (Parameterize Method)

## 示例

```javascript
// Before
function tenPercentRaise(aPerson) {
  aPerson.salary = aPerson.salary.multiply(1.1);
}
function fivePercentRaise(aPerson) {
  aPerson.salary = aPerson.salary.multiply(1.05);
}

// After
function raise(aPerson, factor) {
  aPerson.salary = aPerson.salary.multiply(1 + factor);
}
```

### 动机

如果两个函数逻辑非常相似，只有一些字面量值不同，可以将其合并成一个函数。

### 做法

1. 从一组相似的函数中选择一个
2. 运用改变函数声明(124)，把需要作为参数传入的字面量添加到参数列表中
3. 修改该函数所有的调用处
4. 测试
5. 修改函数体，令其使用新传入的参数

---

## 314 移除标记参数 (Remove Flag Argument)

曾用名：以明确函数取代参数 (Replace Parameter with Explicit Methods)

## 示例

```javascript
// Before
function setDimension(name, value) {
  if (name === "height") {
    this._height = value;
    return;
  }
  if (name === "width") {
    this._width = value;
    return;
  }
}

// After
function setHeight(value) {this._height = value;}
function setWidth(value) {this._width = value;}
```

### 动机

"标记参数"是调用者用它来指示被调函数应该执行哪一部分逻辑的参数。这样的参数令人难以理解。

### 做法

1. 针对参数的每一种可能值，新建一个明确函数
2. 如果主函数有清晰的条件分发逻辑，可以用分解条件表达式(260)创建明确函数
3. 对于用字面量值作为参数的函数调用者，将其改为调用新建的明确函数

---

## 319 保持对象完整 (Preserve Whole Object)

## 示例

```javascript
// Before
const low = aRoom.daysTempRange.low;
const high = aRoom.daysTempRange.high;
if (aPlan.withinRange(low, high))

// After
if (aPlan.withinRange(aRoom.daysTempRange))
```

### 动机

"传递整个记录"的方式能更好地应对变化，并且能缩短参数列表。

### 做法

1. 新建一个空函数，给它以期望中的参数列表（传入完整对象）
2. 在新函数体内调用旧函数
3. 逐一修改旧函数的调用者
4. 用内联函数(115)把旧函数内联到新函数体内

---

## 324 以查询取代参数 (Replace Parameter with Query)

曾用名：以函数取代参数 (Replace Parameter with Method)
反向重构：以参数取代查询(327)

## 示例

```javascript
// Before
availableVacation(anEmployee, anEmployee.grade);

// After
availableVacation(anEmployee);
```

### 动机

如果调用函数时传入了一个值，而这个值由函数自己来获得也是同样容易，这就是重复。

### 做法

1. 如有必要，使用提炼函数(106)将参数的计算过程提炼到独立函数中
2. 将函数体内引用该参数的地方改为调用新建的函数
3. 使用改变函数声明(124)将该参数去掉

---

## 327 以参数取代查询 (Replace Query with Parameter)

反向重构：以查询取代参数(324)

## 示例

```javascript
// Before
targetTemperature(aPlan);
function targetTemperature(aPlan) {
  currentTemperature = thermostat.currentTemperature;
}

// After
targetTemperature(aPlan, thermostat.currentTemperature);
function targetTemperature(aPlan, currentTemperature) {}
```

### 动机

如果想要改变代码的依赖关系——为了让目标函数不再依赖于某个元素，可以把这个元素的值以参数形式传递。

### 做法

1. 对执行查询操作的代码使用提炼变量(119)，将其从函数体中分离出来
2. 对这部分代码使用提炼函数(106)
3. 对原来的函数使用内联函数(115)

---

## 331 移除设值函数 (Remove Setting Method)

## 示例

```javascript
// Before
class Person {
  get name() {...}
  set name(aString) {...}
}

// After
class Person {
  get name() {...}
}
```

### 动机

如果不希望在对象创建之后字段还有机会被改变，就不要为它提供设值函数。

### 做法

1. 如果构造函数尚无法得到值，使用改变函数声明(124)将值以参数形式传入构造函数
2. 移除所有在构造函数之外对设值函数的调用
3. 用内联函数(115)消去设值函数

---

## 334 以工厂函数取代构造函数 (Replace Constructor with Factory Function)

## 示例

```javascript
// Before
leadEngineer = new Employee(document.leadEngineer, 'E');

// After
leadEngineer = createEngineer(document.leadEngineer);
```

### 动机

工厂函数不受构造函数的限制，可以返回子类实例或代理对象，也可以使用更清晰的函数名。

### 做法

1. 新建一个工厂函数，让它调用现有的构造函数
2. 将调用构造函数的代码改为调用工厂函数
3. 尽量缩小构造函数的可见范围

---

## 337 以命令取代函数 (Replace Function with Command)

曾用名：以函数对象取代函数 (Replace Method with Method Object)
反向重构：以函数取代命令(344)

## 示例

```javascript
// Before
function score(candidate, medicalExam, scoringGuide) {
  let result = 0;
  let healthLevel = 0;
  // long body code
}

// After
class Scorer {
  constructor(candidate, medicalExam, scoringGuide) {
    this._candidate = candidate;
    this._medicalExam = medicalExam;
    this._scoringGuide = scoringGuide;
  }
  execute() {
    this._result = 0;
    this._healthLevel = 0;
    // long body code
  }
}
```

### 动机

命令对象提供了更大的控制灵活性和更强的表达能力。

### 做法

1. 为想要包装的函数创建一个空的类
2. 使用搬移函数(198)把函数移到空的类里
3. 给命令对象中负责实际执行命令的函数起一个通用的名字，如"execute"

---

## 344 以函数取代命令 (Replace Command with Function)

反向重构：以命令取代函数(337)

## 示例

```javascript
// Before
class ChargeCalculator {
  execute() {
    return this._customer.rate * this._usage;
  }
}

// After
function charge(customer, usage) {
  return customer.rate * usage;
}
```

### 动机

如果命令对象不是太复杂，那么它可能显得费而不惠，就应该考虑将其变回普通的函数。

### 做法

1. 运用提炼函数(106)，把"创建并执行命令对象"的代码单独提炼到一个函数中
2. 对命令对象在执行阶段用到的函数，逐一使用内联函数(115)
3. 把所有逻辑都内联到调用方
