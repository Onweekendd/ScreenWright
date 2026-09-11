# 第8章 搬移特性

## 198 搬移函数 (Move Function)

## 示例

```javascript
// Before
class Account {
  get bankCharge() {
    let result = 4.5;
    if (this._daysOverdrawn > 0) result += this.overdraftCharge(this._daysOverdrawn);
    return result;
  }
  overdraftCharge(daysOverdrawn) {
    if (this._type.isPremium) {
      const baseCharge = 10;
      if (daysOverdrawn <= 7) return baseCharge;
      else return baseCharge + (daysOverdrawn - 7) * 0.85;
    } else {
      return daysOverdrawn * 1.75;
    }
  }
}

// After
class AccountType {
  overdraftCharge(account) {
    if (this.isPremium) {
      const baseCharge = 10;
      if (account.daysOverdrawn <= 7) return baseCharge;
      else return baseCharge + (account.daysOverdrawn - 7) * 0.85;
    } else {
      return account.daysOverdrawn * 1.75;
    }
  }
}
class Account {
  get bankCharge() {
    let result = 4.5;
    if (this._daysOverdrawn > 0) result += this._type.overdraftCharge(this);
    return result;
  }
}
```

### 动机

当一个函数频繁使用另一个类的元素，或者与另一个类的交互比自身类更多时，应该搬移这个函数。

### 做法

1. 检查函数在原类中被调用的所有地方
2. 检查函数是否具备多态
3. 在目标类中创建一个函数
4. 将函数从原类复制到目标类
5. 编译测试
6. 修改原类，令其调用目标类的新函数
7. 编译测试
8. 删除原函数

---

## 201 搬移字段 (Move Field)

## 示例

```javascript
// Before
class Customer {
  get plan() {return this._plan;}
  get discountRate() {return this._discountRate;}
}

// After
class Customer {
  get plan() {return this._plan;}
  get discountRate() {return this.plan.discountRate;}
}
```

### 动机

当一个字段被其驻留类之外的另一个类更多地使用时，应该搬移这个字段。

### 做法

1. 封装字段
2. 在目标类中创建字段和取值/设值函数
3. 编译测试
4. 从源类中删除字段
5. 编译测试

---

## 207 搬移语句到函数 (Move Statements into Function)

## 示例

```javascript
// Before
result = [];
for (const p of people) {
  result.push(p);
}
emitResult(result);

// After
emitResult(people.slice());
```

### 动机

如果调用函数在调用之前/之后需要做一些操作，这些操作应该被搬移到函数内部。

### 做法

1. 如果目标函数是公共的，使用搬移函数(198)
2. 如果目标函数是私有的，搬移语句到函数内部

---

## 213 搬移语句到调用者 (Move Statements to Callers)

## 示例

```javascript
// Before
emitResult(people.slice());

// After
result = [];
for (const p of people) {
  result.push(p);
}
emitResult(result);
```

### 动机

当函数内的部分操作可以由调用者完成时，应该搬移这些语句。

### 做法

1. 将目标函数内联到调用者
2. 删除原函数

---

## 217 以函数调用取代内联代码 (Replace Inline Code with Function Call)

## 示例

```javascript
// Before
let appliesToMass = false;
for (const s of states) {
  if (s === "MA") appliesToMass = true;
}

// After
let appliesToMass = states.includes("MA");
```

### 动机

当代码与语言内置功能重复时，应该用语言功能替换。

### 做法

1. 用语言功能替换内联代码
2. 编译测试

---

## 223 滑动语句 (Slide Statements)

## 示例

```javascript
// Before
const plan = enrollPerson(anOrder);
const total = anOrder.quantity * anOrder.itemPrice;

// After
const total = anOrder.quantity * an行order.itemPrice;
const plan = enrollPerson(anOrder);
```

### 动机

让相关代码聚集在一起，可以更容易理解代码。

### 做法

1. 移动语句
2. 确保移动后程序仍然正确

---

## 227 拆分循环 (Split Loop)

## 示例

```javascript
// Before
let averageAge = 0;
let totalSalary = 0;
for (const p of people) {
  averageAge += p.age;
  totalSalary += p.salary;
}
averageAge = averageAge / people.length;

// After
let totalSalary = people.reduce((total, p) => total + p.salary, 0);
let averageAge = people.reduce((total, p) => total + p.age, 0) / people.length;
```

### 动机

当一个循环做两件事时，应该拆分成两个独立的循环。

### 做法

1. 复制循环
2. 删除第一个循环中与第二个任务相关的代码
3. 删除第二个循环中与第一个任务相关的代码
4. 编译测试

---

## 231 以管道取代循环 (Replace Loop with Pipeline)

## 示例

```javascript
// Before
const names = [];
for (const i of input) {
  if (i.job === "programmer") {
    names.push(i.name);
  }
}

// After
const names = input
  .filter(i => i.job === "programmer")
  .map(i => i.name);
```

### 动机

管道操作可以更清晰地表达集合处理逻辑。

### 做法

1. 创建一个管道操作链
2. 用管道操作替换循环
3. 编译测试

---

## 237 移除死代码 (Remove Dead Code)

## 示例

```javascript
// Before
if (false) {
  doSomething();
}

// After
// 删除整个if块
```

### 动机

死代码只会增加维护成本，应该删除。

### 做法

1. 删除死代码
2. 编译测试
